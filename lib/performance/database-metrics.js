/**
 * Database Performance Metrics Collector
 * 
 * Comprehensive database operation tracking with timing analysis, success rate monitoring,
 * and slow query detection. This class provides detailed insights for database optimization,
 * index tuning, and query performance analysis.
 */

const { EventEmitter } = require('events');

class DatabaseMetrics extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration with sensible defaults for production environments
        this.slowQueryThreshold = options.slowQueryThreshold || 100; // milliseconds
        this.maxSlowQueries = options.maxSlowQueries || 100; // bounded history size
        this.maxRecentTimes = options.maxRecentTimes || 100; // rolling window size
        
        // Core metrics storage optimized for performance and memory efficiency
        this.queryTimes = new Map(); // query performance statistics by operation type
        this.slowQueries = []; // chronological history of slow queries with context
        this.queryCount = 0; // total query counter for throughput analysis
        
        // Connection pool metrics for resource utilization monitoring
        this.connectionMetrics = {
            active: 0,      // currently executing connections
            available: 0,   // idle connections ready for use
            created: 0,     // total connections created since startup
            destroyed: 0    // total connections destroyed (for leak detection)
        };
        
        console.log('DatabaseMetrics initialized with slow query threshold:', this.slowQueryThreshold);
    }

    /**
     * Records comprehensive database query performance metrics
     * 
     * @param {string} queryName - Descriptive identifier for the query type or operation
     * @param {number} duration - Query execution time in milliseconds (high precision)
     * @param {boolean} success - Whether the query completed successfully without errors
     * @param {Object} metadata - Additional context for debugging and analysis
     */
    recordQuery(queryName, duration, success = true, metadata = {}) {
        console.log(`DatabaseMetrics recording query: ${queryName}, duration: ${duration}ms, success: ${success}`);
        
        // Increment global query counter for throughput calculations
        this.queryCount++;
        
        // Initialize query statistics if this is first occurrence of this query type
        if (!this.queryTimes.has(queryName)) {
            this.queryTimes.set(queryName, {
                total: 0,           // cumulative duration for average calculation
                count: 0,           // total occurrences for statistical significance
                min: Infinity,      // fastest execution time recorded
                max: 0,             // slowest execution time recorded
                failures: 0,        // failed query count for reliability analysis
                p95: 0,             // 95th percentile response time
                recentTimes: []     // rolling window for real-time percentile calculation
            });
        }
        
        // Update statistical metrics with current query performance data
        const stats = this.queryTimes.get(queryName);
        stats.total += duration;
        stats.count++;
        stats.min = Math.min(stats.min, duration);
        stats.max = Math.max(stats.max, duration);
        stats.recentTimes.push(duration);
        
        // Maintain bounded rolling window for memory efficiency and recent performance focus
        if (stats.recentTimes.length > this.maxRecentTimes) {
            stats.recentTimes.shift(); // Remove oldest measurement to maintain window size
        }
        
        // Calculate 95th percentile from recent measurements for current performance assessment
        if (stats.recentTimes.length >= 20) { // Require minimum sample size for statistical validity
            const sorted = [...stats.recentTimes].sort((a, b) => a - b);
            stats.p95 = sorted[Math.floor(sorted.length * 0.95)];
        }
        
        // Track failure rates for reliability monitoring and alerting
        if (!success) {
            stats.failures++;
            console.log(`DatabaseMetrics recorded failed query: ${queryName}`);
        }
        
        // Detect and track slow queries for performance optimization opportunities
        if (duration > this.slowQueryThreshold) {
            const slowQuery = {
                queryName,                          // operation identifier for categorization
                duration,                           // actual execution time for analysis
                timestamp: new Date(),              // temporal context for trend analysis
                success,                            // outcome for correlation with performance
                metadata: { ...metadata }           // deep copy to prevent reference mutations
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
     * @param {number} active - Currently executing database connections
     * @param {number} available - Idle connections available for immediate use
     * @param {number} created - Total connections created since application startup
     * @param {number} destroyed - Total connections properly closed and destroyed
     */
    updateConnectionMetrics(active, available, created, destroyed) {
        console.log(`DatabaseMetrics updating connection metrics: active=${active}, available=${available}, created=${created}, destroyed=${destroyed}`);
        
        this.connectionMetrics = {
            active,      // snapshot of currently active connections
            available,   // snapshot of connections ready for use
            created,     // cumulative counter for lifecycle tracking
            destroyed    // cumulative counter for leak detection
        };
    }

    /**
     * Generates comprehensive database performance metrics report
     * 
     * @returns {Object} Comprehensive database performance metrics report
     */
    getMetrics() {
        console.log('DatabaseMetrics generating comprehensive metrics report');
        
        const metrics = {
            totalQueries: this.queryCount,                           // overall throughput indicator
            slowQueries: this.slowQueries.length,                   // performance degradation indicator
            connectionPool: { ...this.connectionMetrics },          // resource utilization snapshot
            queryStats: {},                                          // per-operation performance analysis
            recentSlowQueries: this.slowQueries.slice(-10)          // recent performance issues for debugging
        };
        
        // Generate detailed statistics for each tracked query type
        for (const [queryName, stats] of this.queryTimes) {
            metrics.queryStats[queryName] = {
                count: stats.count,                                                                      // total occurrences
                avgDuration: Math.round(stats.total / stats.count * 100) / 100,                        // mean response time
                minDuration: stats.min,                                                                  // best case performance
                maxDuration: stats.max,                                                                  // worst case performance
                p95Duration: stats.p95,                                                                  // 95th percentile latency
                failureRate: Math.round(stats.failures / stats.count * 10000) / 100,                   // reliability percentage
                queriesPerSecond: this.calculateQPS(stats.count)                                        // throughput metric
            };
        }
        
        console.log(`DatabaseMetrics report generated with ${Object.keys(metrics.queryStats).length} query types`);
        return metrics;
    }

    /**
     * Calculates queries per second for throughput analysis
     * 
     * @param {number} queryCount - Total number of queries for calculation
     * @returns {number} Queries per second rate rounded to 2 decimal places
     */
    calculateQPS(queryCount) {
        const hoursRunning = Math.max(process.uptime() / 3600, 1); // Minimum 1 hour to prevent extreme values
        const qps = Math.round(queryCount / hoursRunning * 100) / 100;
        console.log(`DatabaseMetrics calculated QPS: ${qps} for ${queryCount} queries over ${hoursRunning} hours`);
        return qps;
    }
}

module.exports = DatabaseMetrics;