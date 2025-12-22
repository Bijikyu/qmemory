/**
 * Database Performance Metrics Collector
 *
 * Comprehensive database operation tracking with timing analysis, success rate monitoring,
 * and slow query detection. This class provides detailed insights for database optimization,
 * index tuning, and query performance analysis.
 */
import { EventEmitter } from 'node:events';
import {
  DEFAULT_SLOW_QUERY_THRESHOLD,
  DEFAULT_MAX_SLOW_QUERIES,
  DEFAULT_MAX_RECENT_TIMES,
} from '../../config/localVars.js';

// Type definitions
interface DatabaseMetricsOptions {
  slowQueryThreshold?: number;
  maxSlowQueries?: number;
  maxRecentTimes?: number;
}

interface QueryStats {
  total: number;
  count: number;
  min: number;
  max: number;
  failures: number;
  p95: number;
  recentTimes: number[];
}

export interface SlowQuery {
  queryName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata: Record<string, unknown>;
}

// Typed event contract ensures subscribers receive structured slow-query payloads
export type DatabaseMetricsEvents = {
  slowQuery: [SlowQuery];
};

interface ConnectionMetrics {
  active: number;
  available: number;
  created: number;
  destroyed: number;
}

interface QueryStatsDetail {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  failureRate: number;
  queriesPerSecond: number;
}

interface MetricsReport {
  totalQueries: number;
  slowQueries: number;
  connectionPool: ConnectionMetrics;
  queryStats: Record<string, QueryStatsDetail>;
  recentSlowQueries: SlowQuery[];
}

export default class DatabaseMetrics extends EventEmitter<DatabaseMetricsEvents> {
  private slowQueryThreshold: number;
  private maxSlowQueries: number;
  private maxRecentTimes: number;
  private queryTimes: Map<string, QueryStats>;
  private slowQueries: SlowQuery[];
  private queryCount: number;
  private connectionMetrics: ConnectionMetrics;

  constructor(options: DatabaseMetricsOptions = {}) {
    super();
    // Configuration with sensible defaults for production environments
    this.slowQueryThreshold = options.slowQueryThreshold || Number(DEFAULT_SLOW_QUERY_THRESHOLD); // milliseconds
    this.maxSlowQueries = options.maxSlowQueries || Number(DEFAULT_MAX_SLOW_QUERIES); // bounded history size
    this.maxRecentTimes = options.maxRecentTimes || Number(DEFAULT_MAX_RECENT_TIMES); // rolling window size
    // Core metrics storage optimized for performance and memory efficiency
    this.queryTimes = new Map(); // query performance statistics by operation type
    this.slowQueries = []; // chronological history of slow queries with context
    this.queryCount = 0; // total query counter for throughput analysis
    // Connection pool metrics for resource utilization monitoring
    this.connectionMetrics = {
      active: 0, // currently executing connections
      available: 0, // idle connections ready for use
      created: 0, // total connections created since startup
      destroyed: 0, // total connections destroyed (for leak detection)
    };
    console.log('DatabaseMetrics initialized with slow query threshold:', this.slowQueryThreshold);
  }
  /**
   * Records comprehensive database query performance metrics
   *
   * @param queryName - Descriptive identifier for the query type or operation
   * @param duration - Query execution time in milliseconds (high precision)
   * @param success - Whether the query completed successfully without errors
   * @param metadata - Additional context for debugging and analysis
   */
  recordQuery(
    queryName: string,
    duration: number,
    success: boolean = true,
    metadata: Record<string, unknown> = {}
  ): void {
    console.log(
      `DatabaseMetrics recording query: ${queryName}, duration: ${duration}ms, success: ${success}`
    );
    // Increment global query counter for throughput calculations
    this.queryCount++;
    // Initialize query statistics if this is first occurrence of this query type
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, {
        total: 0, // cumulative duration for average calculation
        count: 0, // total occurrences for statistical significance
        min: Infinity, // fastest execution time recorded
        max: 0, // slowest execution time recorded
        failures: 0, // failed query count for reliability analysis
        p95: 0, // 95th percentile response time
        recentTimes: [], // rolling window for real-time percentile calculation
      });
    }
    // Update statistical metrics with current query performance data
    const stats = this.queryTimes.get(queryName)!;
    stats.total += duration;
    stats.count++;
    stats.min = Math.min(stats.min || Infinity, duration);
    stats.max = Math.max(stats.max, duration);
    stats.recentTimes.push(duration);
    // Maintain bounded rolling window for memory efficiency and recent performance focus
    if (stats.recentTimes.length > this.maxRecentTimes) {
      stats.recentTimes.shift(); // Remove oldest measurement to maintain window size
    }
    // Calculate 95th percentile from recent measurements for current performance assessment
    if (stats.recentTimes.length >= 20) {
      // Require minimum sample size for statistical validity
      const sorted = [...stats.recentTimes].sort((a, b) => a - b);
      stats.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    }
    // Track failure rates for reliability monitoring and alerting
    if (!success) {
      stats.failures++;
      console.log(`DatabaseMetrics recorded failed query: ${queryName}`);
    }
    // Detect and track slow queries for performance optimization opportunities
    if (duration > this.slowQueryThreshold) {
      const slowQuery = {
        queryName, // operation identifier for categorization
        duration, // actual execution time for analysis
        timestamp: new Date(), // temporal context for trend analysis
        success, // outcome for correlation with performance
        metadata: { ...metadata }, // deep copy to prevent reference mutations
      };
      this.slowQueries.push(slowQuery);
      console.log(`DatabaseMetrics detected slow query: ${queryName} took ${duration}ms`);
      // Emit event for real-time alerting and monitoring system integration
      this.emit('slowQuery', slowQuery);
      // Maintain bounded slow query history to prevent unlimited memory growth
      if (this.slowQueries.length > this.maxSlowQueries) {
        this.slowQueries.shift(); // Remove oldest slow query to maintain limit
      }
    }
  }
  /**
   * Updates database connection pool metrics for resource utilization monitoring
   *
   * @param active - Currently executing database connections
   * @param available - Idle connections available for immediate use
   * @param created - Total connections created since application startup
   * @param destroyed - Total connections properly closed and destroyed
   */
  updateConnectionMetrics(active: number, available: number, created: number, destroyed: number) {
    console.log(
      `DatabaseMetrics updating connection metrics: active=${active}, available=${available}, created=${created}, destroyed=${destroyed}`
    );
    this.connectionMetrics = {
      active, // snapshot of currently active connections
      available, // snapshot of connections ready for use
      created, // cumulative counter for lifecycle tracking
      destroyed, // cumulative counter for leak detection
    };
  }
  /**
   * Generates comprehensive database performance metrics report
   *
   * @returns Comprehensive database performance metrics report
   */
  getMetrics(): MetricsReport {
    console.log('DatabaseMetrics generating comprehensive metrics report');
    const metrics: MetricsReport = {
      totalQueries: this.queryCount, // overall throughput indicator
      slowQueries: this.slowQueries.length, // performance degradation indicator
      connectionPool: { ...this.connectionMetrics }, // resource utilization snapshot
      queryStats: {}, // per-operation performance analysis
      recentSlowQueries: this.slowQueries.slice(-10), // recent performance issues for debugging
    };
    // Generate detailed statistics for each tracked query type
    for (const [queryName, stats] of Array.from(this.queryTimes.entries())) {
      metrics.queryStats[queryName] = {
        count: stats.count, // total occurrences
        avgDuration: Math.round((stats.total / stats.count) * 100) / 100, // mean response time
        minDuration: stats.min, // best case performance
        maxDuration: stats.max, // worst case performance
        p95Duration: stats.p95, // 95th percentile latency
        failureRate: Math.round((stats.failures / stats.count) * 10000) / 100, // reliability percentage
        queriesPerSecond: this.calculateQPS(stats.count), // throughput metric
      };
    }
    console.log(
      `DatabaseMetrics report generated with ${Object.keys(metrics.queryStats).length} query types`
    );
    return metrics;
  }
  /**
   * Calculates queries per second for throughput analysis
   *
   * @param queryCount - Total number of queries for calculation
   * @returns Queries per second rate rounded to 2 decimal places
   */
  calculateQPS(queryCount: number) {
    const hoursRunning = Math.max(process.uptime() / 3600, 1); // Minimum 1 hour to prevent extreme values
    const qps = Math.round((queryCount / hoursRunning) * 100) / 100;
    console.log(
      `DatabaseMetrics calculated QPS: ${qps} for ${queryCount} queries over ${hoursRunning} hours`
    );
    return qps;
  }

  /**
   * Strongly-typed listener registration so downstream handlers know the payload structure.
   */
  public override on<K extends keyof DatabaseMetricsEvents>(
    eventName: K,
    listener: (...args: DatabaseMetricsEvents[K]) => void
  ): this {
    return super.on(eventName, listener);
  }

  /**
   * Strongly-typed single-shot listener registration for slow query alerts.
   */
  public override once<K extends keyof DatabaseMetricsEvents>(
    eventName: K,
    listener: (...args: DatabaseMetricsEvents[K]) => void
  ): this {
    return super.once(eventName, listener);
  }

  /**
   * Strongly-typed event emission to guarantee emitted payloads match listeners.
   */
  public override emit<K extends keyof DatabaseMetricsEvents>(
    eventName: K,
    ...args: DatabaseMetricsEvents[K]
  ): boolean {
    return super.emit(eventName, ...args);
  }
}
