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
import * as qerrors from 'qerrors';
import { createModuleUtilities } from '../common-patterns.js';

const utils = createModuleUtilities('database-metrics');

// Type definitions
interface DatabaseMetricsOptions {
  slowQueryThreshold?: number;
  maxSlowQueries?: number;
  maxRecentTimes?: number;
  maxQueryTypes?: number; // NEW: Prevent unbounded query type growth
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
  private maxQueryTypes: number; // NEW: Prevent unbounded query type growth
  private queryCountWrapThreshold: number; // NEW: Prevent counter overflow
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
    // NEW: Memory bounds enforcement to prevent OOM crashes
    this.maxQueryTypes = options.maxQueryTypes || 100; // Limit tracked query types
    this.queryCountWrapThreshold = Number.MAX_SAFE_INTEGER - 1000000; // Prevent overflow
    // Core metrics storage with bounded memory management for production scalability
    this.queryTimes = new Map(); // query performance statistics by operation type
    this.slowQueries = []; // chronological history of slow queries with context (bounded by maxSlowQueries)
    this.queryCount = 0; // total query counter for throughput analysis (with wrap-around to prevent overflow)
    // Connection pool metrics for resource utilization monitoring
    this.connectionMetrics = {
      active: 0, // currently executing connections
      available: 0, // idle connections ready for use
      created: 0, // total connections created since startup
      destroyed: 0, // total connections destroyed (for leak detection)
    };
    utils.debugLog(
      'DatabaseMetrics initialized with slow query threshold:',
      this.slowQueryThreshold
    );
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
    try {
      utils.debugLog(
        `DatabaseMetrics recording query: ${queryName}, duration: ${duration}ms, success: ${success}`
      );
      // Increment global query counter with overflow protection
      this.queryCount++;
      if (this.queryCount > this.queryCountWrapThreshold) {
        this.queryCount = 0; // Wrap around to prevent overflow
      }
      // Initialize query statistics if this is first occurrence of this query type
      // Enforce memory bounds on tracked query types
      if (!this.queryTimes.has(queryName)) {
        if (this.queryTimes.size >= this.maxQueryTypes) {
          // Remove least recently used query type to maintain memory bounds
          const oldestKey = this.queryTimes.keys().next().value;
          this.queryTimes.delete(oldestKey);
          utils.debugLog(
            `DatabaseMetrics: Removed query type '${oldestKey}' to maintain memory bounds`
          );
        }
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
        utils.debugLog(`DatabaseMetrics recorded failed query: ${queryName}`);
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
        utils.debugLog(`DatabaseMetrics detected slow query: ${queryName} took ${duration}ms`);
        // Emit event for real-time alerting and monitoring system integration
        this.emit('slowQuery', slowQuery);
        // Maintain bounded slow query history to prevent unlimited memory growth
        if (this.slowQueries.length > this.maxSlowQueries) {
          this.slowQueries.shift(); // Remove oldest slow query to maintain limit
        }
      }
    } catch (error) {
      qerrors.qerrors(error as Error, 'database-metrics.recordQuery', {
        queryName,
        duration,
        success,
        metadataFieldCount: Object.keys(metadata).length,
        totalQueries: this.queryCount,
        trackedQueryTypes: this.queryTimes.size,
      });
      // Re-throw to preserve error propagation for critical monitoring failures
      throw error;
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
    try {
      utils.debugLog(
        `DatabaseMetrics updating connection metrics: active=${active}, available=${available}, created=${created}, destroyed=${destroyed}`
      );
      this.connectionMetrics = {
        active, // snapshot of currently active connections
        available, // snapshot of connections ready for use
        created, // cumulative counter for lifecycle tracking
        destroyed, // cumulative counter for leak detection
      };
    } catch (error) {
      qerrors.qerrors(error as Error, 'database-metrics.updateConnectionMetrics', {
        active,
        available,
        created,
        destroyed,
        hasValidNumbers: [active, available, created, destroyed].every(
          n => typeof n === 'number' && Number.isFinite(n)
        ),
        hasValidConnectionMetrics: this.connectionMetrics !== undefined,
      });
      // Log error but don't re-throw for monitoring failures to prevent cascading issues
      utils.debugLog('DatabaseMetrics connection metrics update failed:', error);
    }
  }
  /**
   * Generates comprehensive database performance metrics report
   *
   * @returns Comprehensive database performance metrics report
   */
  getMetrics(): MetricsReport {
    try {
      utils.debugLog('DatabaseMetrics generating comprehensive metrics report');
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
      utils.debugLog(
        `DatabaseMetrics report generated with ${Object.keys(metrics.queryStats).length} query types`
      );
      return metrics;
    } catch (error) {
      qerrors.qerrors(error as Error, 'database-metrics.getMetrics', {
        totalQueries: this.queryCount,
        slowQueriesCount: this.slowQueries.length,
        trackedQueryTypes: this.queryTimes.size,
        hasConnectionMetrics: this.connectionMetrics !== undefined,
        hasValidQueryTypes: this.queryTimes.size > 0,
      });
      // Return minimal metrics on error to prevent monitoring system failures
      return {
        totalQueries: this.queryCount,
        slowQueries: this.slowQueries.length,
        connectionPool: { active: 0, available: 0, created: 0, destroyed: 0 },
        queryStats: {},
        recentSlowQueries: [],
      };
    }
  }
  /**
   * Calculates queries per second for throughput analysis
   *
   * @param queryCount - Total number of queries for calculation
   * @returns Queries per second rate rounded to 2 decimal places
   */
  calculateQPS(queryCount: number) {
    try {
      const hoursRunning = Math.max(process.uptime() / 3600, 1); // Minimum 1 hour to prevent extreme values
      const qps = Math.round((queryCount / hoursRunning) * 100) / 100;
      utils.debugLog(
        `DatabaseMetrics calculated QPS: ${qps} for ${queryCount} queries over ${hoursRunning} hours`
      );
      return qps;
    } catch (error) {
      qerrors.qerrors(error as Error, 'database-metrics.calculateQPS', {
        queryCount,
        uptime: process.uptime(),
        hasValidQueryCount: typeof queryCount === 'number' && Number.isFinite(queryCount),
      });
      // Return safe default on error
      return 0;
    }
  }

  /**
   * Strongly-typed listener registration so downstream handlers know the payload structure.
   */
  public override on<K extends keyof DatabaseMetricsEvents>(
    eventName: K,
    listener: (...args: DatabaseMetricsEvents[K]) => void
  ): this {
    return super.on(eventName as any, listener as any);
  }

  /**
   * Strongly-typed single-shot listener registration for slow query alerts.
   */
  public override once<K extends keyof DatabaseMetricsEvents>(
    eventName: K,
    listener: (...args: DatabaseMetricsEvents[K]) => void
  ): this {
    return super.once(eventName as any, listener as any) as this;
  }

  /**
   * Strongly-typed event emission to guarantee emitted payloads match listeners.
   */
  public override emit<K extends keyof DatabaseMetricsEvents>(
    eventName: K,
    ...args: DatabaseMetricsEvents[K]
  ): boolean {
    return super.emit(eventName as any, ...(args as any));
  }
}
