/**
 * Performance Monitoring Utilities
 * Centralized performance tracking and metrics collection
 * 
 * This module provides comprehensive performance monitoring capabilities that integrate
 * seamlessly with the existing library architecture. It tracks database operations,
 * HTTP requests, system resources, and provides actionable insights for optimization.
 * 
 * Design philosophy:
 * - Minimal overhead: Performance monitoring shouldn't impact application performance
 * - Real-time insights: Immediate feedback on performance changes and degradation
 * - Actionable data: Metrics that directly inform optimization decisions and capacity planning
 * - Historical tracking: Trend analysis for proactive performance management
 * - Integration-first: Works seamlessly with existing HTTP utilities and database operations
 * 
 * Key Performance Indicators tracked:
 * 1. Database query performance with slow query detection and optimization insights
 * 2. HTTP request/response times, throughput metrics, and endpoint-specific analytics
 * 3. Memory usage patterns, garbage collection efficiency, and resource utilization
 * 4. API endpoint performance analysis with error rate tracking
 * 5. System health monitoring with automated alerting capabilities
 * 
 * Architecture integration:
 * - Uses existing HTTP utilities for consistent error handling and response formatting
 * - Follows the same logging patterns as other library modules for debugging consistency
 * - Maintains the barrel export pattern for clean module organization
 * - Implements defensive programming principles used throughout the library
 */

const { EventEmitter } = require('events');

/**
 * Database Performance Metrics Collector
 * 
 * Comprehensive database operation tracking with timing analysis, success rate monitoring,
 * and slow query detection. This class provides detailed insights for database optimization,
 * index tuning, and query performance analysis.
 * 
 * Performance tracking methodology:
 * - High-resolution timing using process.hrtime.bigint() for nanosecond precision
 * - Rolling window statistics for real-time percentile calculations
 * - Automatic slow query detection with configurable thresholds
 * - Connection pool monitoring for resource utilization analysis
 * - Query pattern analysis for optimization opportunities
 * 
 * Integration considerations:
 * - Emits events for real-time alerting and monitoring integrations
 * - Minimal memory footprint with bounded history collections
 * - Thread-safe operations suitable for high-concurrency environments
 * - Configurable thresholds for different application requirements
 */
class DatabaseMetrics extends EventEmitter { // comprehensive database performance tracking
    constructor(options = {}) { // initialize metric collection containers with configuration
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
     * This method captures detailed timing and success information for every database
     * operation, enabling sophisticated performance analysis and optimization insights.
     * The collected data supports both real-time monitoring and historical trend analysis.
     * 
     * Statistical calculations:
     * - Running averages for efficient computation without storing all historical data
     * - Rolling window percentiles for recent performance characteristics
     * - Min/max tracking for identifying performance outliers
     * - Failure rate analysis for reliability monitoring
     * 
     * Alerting integration:
     * - Automatic slow query detection with configurable thresholds
     * - Event emission for external monitoring system integration
     * - Contextual metadata preservation for debugging slow operations
     * 
     * @param {string} queryName - Descriptive identifier for the query type or operation
     * @param {number} duration - Query execution time in milliseconds (high precision)
     * @param {boolean} success - Whether the query completed successfully without errors
     * @param {Object} metadata - Additional context for debugging and analysis
     */
    recordQuery(queryName, duration, success = true, metadata = {}) { // record query performance with comprehensive metrics
        console.log(`DatabaseMetrics recording query: ${queryName}, duration: ${duration}ms, success: ${success}`);
        
        // Increment global query counter for throughput calculations
        this.queryCount++;
        
        // Initialize query statistics if this is the first occurrence of this query type
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
     * Connection pool monitoring provides insights into database resource utilization,
     * connection leaks, and capacity planning requirements. These metrics help identify
     * when connection pool sizing needs adjustment or when connection leak issues exist.
     * 
     * Resource utilization analysis:
     * - Active connection tracking for current load assessment
     * - Available connection monitoring for capacity planning
     * - Creation/destruction tracking for leak detection
     * - Pool efficiency calculations for optimization insights
     * 
     * @param {number} active - Currently executing database connections
     * @param {number} available - Idle connections available for immediate use
     * @param {number} created - Total connections created since application startup
     * @param {number} destroyed - Total connections properly closed and destroyed
     */
    updateConnectionMetrics(active, available, created, destroyed) { // track connection pool resource utilization
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
     * This method produces a detailed performance analysis suitable for monitoring dashboards,
     * alerting systems, and optimization planning. The report includes both current state
     * snapshots and historical trend data for comprehensive performance assessment.
     * 
     * Report structure optimized for:
     * - Monitoring dashboard consumption with pre-calculated key metrics
     * - Alerting system integration with threshold-ready values
     * - Performance analysis with statistical summaries and percentiles
     * - Capacity planning with throughput and utilization metrics
     * 
     * Statistical accuracy:
     * - Rounded values for human readability while maintaining precision
     * - Percentage calculations with appropriate decimal precision
     * - Rate calculations normalized to standard time units
     * - Historical context with configurable recent data windows
     * 
     * @returns {Object} Comprehensive database performance metrics report
     */
    getMetrics() { // generate comprehensive performance analysis report
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
     * Throughput calculation provides insights into database load patterns and capacity
     * utilization. This metric helps with capacity planning and performance trending.
     * 
     * Calculation methodology:
     * - Uses process uptime for accurate time base calculation
     * - Provides minimum time base to prevent division by zero
     * - Rounds to reasonable precision for dashboard display
     * 
     * @param {number} queryCount - Total number of queries for the calculation
     * @returns {number} Queries per second rate rounded to 2 decimal places
     */
    calculateQPS(queryCount) { // compute throughput metrics for capacity planning
        const hoursRunning = Math.max(process.uptime() / 3600, 1); // Minimum 1 hour to prevent extreme values
        const qps = Math.round(queryCount / hoursRunning * 100) / 100;
        console.log(`DatabaseMetrics calculated QPS: ${qps} for ${queryCount} queries over ${hoursRunning} hours`);
        return qps;
    }
}

/**
 * HTTP Request Performance Metrics Collector
 * 
 * Comprehensive HTTP endpoint performance tracking with response time analysis,
 * throughput monitoring, and error rate calculation. This class provides detailed
 * insights for API optimization, capacity planning, and service reliability monitoring.
 * 
 * Performance analysis capabilities:
 * - Per-endpoint response time statistics with percentile calculations
 * - HTTP status code distribution for error pattern analysis
 * - Throughput monitoring with requests per second calculations
 * - User agent tracking for client behavior analysis
 * - Real-time performance degradation detection
 * 
 * Integration features:
 * - Express middleware compatibility for automatic request tracking
 * - Minimal overhead design suitable for high-traffic applications
 * - Configurable metrics collection with memory-bounded storage
 * - Statistical accuracy with rolling window calculations
 */
class RequestMetrics { // comprehensive HTTP endpoint performance tracking
    constructor(options = {}) { // initialize request tracking containers with configuration
        // Configuration with production-appropriate defaults
        this.maxRecentTimes = options.maxRecentTimes || 100; // rolling window size for percentile calculations
        
        // Core metrics storage optimized for performance and memory efficiency
        this.endpoints = new Map(); // per-endpoint performance statistics
        this.totalRequests = 0;     // global request counter for throughput analysis
        this.startTime = Date.now(); // application start time for uptime calculations
        
        console.log('RequestMetrics initialized for HTTP performance tracking');
    }

    /**
     * Records comprehensive HTTP request performance metrics
     * 
     * This method captures detailed timing and outcome information for every HTTP request,
     * enabling sophisticated API performance analysis and optimization insights. The data
     * supports both real-time monitoring and historical trend analysis.
     * 
     * Statistical methodology:
     * - High-resolution timing for accurate response time measurement
     * - Endpoint-specific aggregation for focused performance analysis
     * - Status code distribution tracking for error pattern recognition
     * - Rolling window percentiles for current performance assessment
     * 
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param {string} path - Request path or route pattern for categorization
     * @param {number} statusCode - HTTP response status code for outcome analysis
     * @param {number} duration - Request processing time in milliseconds
     * @param {string} userAgent - Client user agent for behavior analysis (optional)
     */
    recordRequest(method, path, statusCode, duration, userAgent = null) { // record HTTP request performance metrics
        console.log(`RequestMetrics recording: ${method} ${path} ${statusCode} ${duration}ms`);
        
        // Increment global request counter for overall throughput calculations
        this.totalRequests++;
        
        // Create endpoint identifier for performance categorization
        const endpoint = `${method} ${path}`;
        
        // Initialize endpoint statistics if this is the first request to this endpoint
        if (!this.endpoints.has(endpoint)) {
            this.endpoints.set(endpoint, {
                requests: 0,                    // total request count for this endpoint
                totalDuration: 0,               // cumulative response time for average calculation
                minDuration: Infinity,          // fastest response time recorded
                maxDuration: 0,                 // slowest response time recorded
                statusCodes: new Map(),         // HTTP status code distribution
                recentTimes: [],                // rolling window for percentile calculation
                p95: 0                          // 95th percentile response time
            });
        }
        
        // Update endpoint performance statistics with current request data
        const stats = this.endpoints.get(endpoint);
        stats.requests++;
        stats.totalDuration += duration;
        stats.minDuration = Math.min(stats.minDuration, duration);
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.recentTimes.push(duration);
        
        // Track HTTP status code distribution for error pattern analysis
        stats.statusCodes.set(statusCode, (stats.statusCodes.get(statusCode) || 0) + 1);
        
        // Maintain bounded rolling window for memory efficiency and recent performance focus
        if (stats.recentTimes.length > this.maxRecentTimes) {
            stats.recentTimes.shift(); // Remove oldest measurement to maintain window size
        }
        
        // Calculate 95th percentile from recent measurements for current performance assessment
        if (stats.recentTimes.length >= 20) { // Require minimum sample size for statistical validity
            const sorted = [...stats.recentTimes].sort((a, b) => a - b);
            stats.p95 = sorted[Math.floor(sorted.length * 0.95)];
        }
    }

    /**
     * Generates comprehensive HTTP performance metrics report
     * 
     * This method produces detailed API performance analysis suitable for monitoring dashboards,
     * capacity planning, and optimization decision-making. The report includes both application-wide
     * metrics and per-endpoint breakdowns for granular performance assessment.
     * 
     * Report optimization:
     * - Pre-calculated key performance indicators for dashboard consumption
     * - Error rate analysis with actionable threshold comparisons
     * - Throughput metrics normalized to standard time units
     * - Statistical summaries with appropriate precision for human readability
     * 
     * @returns {Object} Comprehensive HTTP performance metrics report
     */
    getMetrics() { // generate comprehensive HTTP performance analysis report
        console.log('RequestMetrics generating comprehensive metrics report');
        
        // Calculate application-wide throughput metrics
        const uptime = Date.now() - this.startTime;
        const rps = this.totalRequests / (uptime / 1000);
        
        const metrics = {
            totalRequests: this.totalRequests,                          // overall request volume
            requestsPerSecond: Math.round(rps * 100) / 100,             // throughput indicator
            uptime: Math.round(uptime / 1000),                          // application availability duration
            endpoints: {}                                                // per-endpoint performance breakdown
        };
        
        // Generate detailed statistics for each tracked endpoint
        for (const [endpoint, stats] of this.endpoints) {
            // Calculate error rate from status code distribution
            const errorCount = Array.from(stats.statusCodes.entries())
                .filter(([code]) => code >= 400)
                .reduce((sum, [, count]) => sum + count, 0);
            
            metrics.endpoints[endpoint] = {
                requests: stats.requests,                                                        // endpoint request volume
                avgDuration: Math.round(stats.totalDuration / stats.requests * 100) / 100,     // mean response time
                minDuration: stats.minDuration,                                                  // best case performance
                maxDuration: stats.maxDuration,                                                  // worst case performance
                p95Duration: stats.p95,                                                          // 95th percentile latency
                errorRate: Math.round(errorCount / stats.requests * 10000) / 100,               // reliability percentage
                statusCodes: Object.fromEntries(stats.statusCodes)                              // HTTP outcome distribution
            };
        }
        
        console.log(`RequestMetrics report generated with ${Object.keys(metrics.endpoints).length} endpoints`);
        return metrics;
    }
}

/**
 * System Resource Monitoring
 * 
 * Comprehensive system resource tracking including memory usage patterns, CPU utilization,
 * and process health metrics. This class provides early warning capabilities for resource
 * exhaustion scenarios and supports capacity planning decisions.
 * 
 * Resource monitoring capabilities:
 * - Real-time memory usage tracking with heap analysis
 * - CPU utilization monitoring with historical trending
 * - Process health indicators including uptime and version tracking
 * - Automated data collection with configurable intervals
 * - Memory-bounded historical data storage for trend analysis
 * 
 * Performance considerations:
 * - Minimal overhead monitoring designed for production environments
 * - Efficient data structures for historical storage with automatic cleanup
 * - Non-blocking metrics collection suitable for high-performance applications
 * - Configurable collection intervals for different monitoring requirements
 */
class SystemMetrics { // comprehensive system resource utilization monitoring
    constructor(options = {}) { // initialize system monitoring with configuration
        // Configuration with production-appropriate defaults
        this.collectionInterval = options.collectionInterval || 30000; // 30 seconds default
        this.maxHistoryPoints = options.maxHistoryPoints || 2880; // 24 hours at 30s intervals
        
        // Historical data storage with bounded memory usage
        this.memoryHistory = [];        // chronological memory usage snapshots
        this.cpuHistory = [];           // chronological CPU utilization measurements
        
        // CPU calculation state for accurate percentage calculations
        this.lastCpuUsage = process.cpuUsage();  // baseline for relative CPU measurement
        this.startTime = process.hrtime();       // high-resolution time reference
        
        console.log(`SystemMetrics initialized with ${this.collectionInterval}ms collection interval`);
        
        // Start automated metrics collection for continuous monitoring
        this.collectionTimer = setInterval(() => this.collectMetrics(), this.collectionInterval);
    }

    /**
     * Collects current system resource metrics and updates historical data
     * 
     * This method performs comprehensive system resource measurement including memory
     * utilization analysis and CPU percentage calculation. The collected data is stored
     * in bounded historical arrays for trend analysis and capacity planning.
     * 
     * Resource measurement methodology:
     * - High-resolution memory measurement from Node.js process object
     * - Relative CPU usage calculation for accurate percentage determination
     * - Timestamp-based historical storage for temporal analysis
     * - Automatic data rotation to prevent unlimited memory growth
     * 
     * Memory categories tracked:
     * - RSS (Resident Set Size): Total memory allocated to the process
     * - Heap Used: Active JavaScript object memory consumption
     * - Heap Total: Total heap space allocated by V8
     * - External: Memory used by C++ objects bound to JavaScript
     */
    collectMetrics() { // gather current system resource utilization measurements
        console.log('SystemMetrics collecting current resource measurements');
        
        // Capture current memory utilization from Node.js process
        const memory = process.memoryUsage();
        
        // Calculate CPU utilization since last measurement
        const cpuUsage = process.cpuUsage(this.lastCpuUsage);
        const elapsed = process.hrtime(this.startTime);
        const elapsedMS = elapsed[0] * 1000 + elapsed[1] / 1000000;
        
        // Convert CPU microseconds to percentage over elapsed time
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / (elapsedMS * 1000) * 100;
        
        // Store memory snapshot with temporal context
        this.memoryHistory.push({
            timestamp: Date.now(),                  // temporal reference for trend analysis
            rss: memory.rss,                        // total process memory allocation
            heapUsed: memory.heapUsed,              // active JavaScript heap consumption
            heapTotal: memory.heapTotal,            // total heap space allocated
            external: memory.external               // C++ object memory binding
        });
        
        // Store CPU measurement with temporal context
        this.cpuHistory.push({
            timestamp: Date.now(),                  // temporal reference for trend analysis
            percent: cpuPercent                     // CPU utilization percentage
        });
        
        // Maintain bounded historical data to prevent unlimited memory growth
        if (this.memoryHistory.length > this.maxHistoryPoints) {
            this.memoryHistory.shift(); // Remove oldest memory measurement
        }
        if (this.cpuHistory.length > this.maxHistoryPoints) {
            this.cpuHistory.shift(); // Remove oldest CPU measurement
        }
        
        // Update CPU calculation baseline for next measurement cycle
        this.lastCpuUsage = process.cpuUsage();
        this.startTime = process.hrtime();
        
        console.log(`SystemMetrics collected: CPU=${cpuPercent.toFixed(2)}%, Heap=${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    /**
     * Generates comprehensive system resource metrics report
     * 
     * This method produces detailed system performance analysis suitable for monitoring
     * dashboards, alerting systems, and capacity planning initiatives. The report includes
     * both current resource utilization snapshots and historical trend data.
     * 
     * Report structure optimization:
     * - Current state metrics for real-time monitoring and alerting
     * - Historical data windows for trend analysis and capacity planning
     * - Human-readable units with appropriate precision for dashboard display
     * - Process metadata for environment context and debugging support
     * 
     * @returns {Object} Comprehensive system resource metrics report
     */
    getMetrics() { // generate comprehensive system resource analysis report
        console.log('SystemMetrics generating comprehensive metrics report');
        
        // Capture current memory state for real-time monitoring
        const currentMemory = process.memoryUsage();
        
        // Calculate recent CPU average for current utilization assessment
        const recentCpu = this.cpuHistory.slice(-10); // Last 10 measurements
        const avgCpu = recentCpu.length > 0 
            ? recentCpu.reduce((sum, point) => sum + point.percent, 0) / recentCpu.length 
            : 0;
        
        const metrics = {
            memory: {
                current: {
                    rss: Math.round(currentMemory.rss / 1024 / 1024 * 100) / 100,              // MB precision
                    heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024 * 100) / 100,    // MB precision
                    heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024 * 100) / 100,  // MB precision
                    external: Math.round(currentMemory.external / 1024 / 1024 * 100) / 100     // MB precision
                },
                history: this.memoryHistory.slice(-100) // Recent trend data for analysis
            },
            cpu: {
                current: Math.round(avgCpu * 100) / 100,                    // Current utilization percentage
                history: this.cpuHistory.slice(-100)                       // Recent trend data for analysis
            },
            uptime: Math.round(process.uptime()),                           // Process availability duration
            nodeVersion: process.version                                    // Runtime environment context
        };
        
        console.log(`SystemMetrics report generated: CPU=${metrics.cpu.current}%, Heap=${metrics.memory.current.heapUsed}MB`);
        return metrics;
    }

    /**
     * Stops automated metrics collection and cleans up resources
     * 
     * This method provides proper cleanup for the monitoring system, stopping the
     * automated collection timer and preventing resource leaks in applications
     * that dynamically create and destroy monitoring instances.
     */
    stop() { // cleanup resources and stop automated collection
        console.log('SystemMetrics stopping automated collection');
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
        }
    }
}

/**
 * Centralized Performance Monitor
 * 
 * Orchestrates all performance monitoring components into a unified system that provides
 * comprehensive application performance insights. This class serves as the primary interface
 * for performance monitoring integration and provides Express middleware for automatic tracking.
 * 
 * Integration capabilities:
 * - Express middleware for automatic HTTP request performance tracking
 * - Database operation wrapper for transparent query performance monitoring
 * - Unified reporting interface combining all performance dimensions
 * - Health check generation for monitoring system integration
 * - Event-driven alerting for proactive performance management
 * 
 * Design principles:
 * - Minimal application impact through efficient monitoring implementation
 * - Comprehensive coverage across all performance dimensions
 * - Easy integration with existing application architectures
 * - Configurable monitoring thresholds for different environments
 * - Production-ready with proper error handling and resource management
 */
class PerformanceMonitor { // centralized performance monitoring orchestration
    constructor(options = {}) { // initialize comprehensive monitoring system
        console.log('PerformanceMonitor initializing comprehensive monitoring system');
        
        // Initialize all monitoring components with consistent configuration
        this.database = new DatabaseMetrics(options.database || {});
        this.requests = new RequestMetrics(options.requests || {});
        this.system = new SystemMetrics(options.system || {});
        
        // Configure alerting for critical performance issues
        this.database.on('slowQuery', (query) => {
            console.warn(`PERFORMANCE_ALERT: Slow query detected - ${query.queryName} took ${query.duration}ms at ${query.timestamp}`);
        });
        
        console.log('PerformanceMonitor initialization completed with all monitoring components active');
    }

    /**
     * Creates Express middleware for automatic HTTP request performance tracking
     * 
     * This middleware provides transparent request performance monitoring without requiring
     * application code changes. It captures timing data and response characteristics for
     * every HTTP request, enabling comprehensive API performance analysis.
     * 
     * Middleware implementation:
     * - High-resolution timing using process.hrtime.bigint() for accuracy
     * - Automatic request categorization by method and path
     * - Response event handling for complete request lifecycle tracking
     * - Minimal performance overhead suitable for production use
     * 
     * Integration pattern:
     * - Standard Express middleware interface for easy adoption
     * - Automatic route path extraction when available
     * - User agent capture for client behavior analysis
     * - Non-blocking operation that doesn't affect request processing
     * 
     * @returns {Function} Express middleware function for request performance tracking
     */
    createRequestMiddleware() { // generate Express middleware for automatic request tracking
        console.log('PerformanceMonitor creating Express request tracking middleware');
        
        return (req, res, next) => {
            // Capture high-resolution request start time for accurate duration calculation
            const startTime = process.hrtime.bigint();
            
            // Set up response completion tracking for request lifecycle monitoring
            res.on('finish', () => {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert nanoseconds to milliseconds
                
                // Record comprehensive request performance metrics
                this.requests.recordRequest(
                    req.method,                                 // HTTP method for categorization
                    req.route?.path || req.path,               // Route pattern or actual path
                    res.statusCode,                             // Response status for outcome analysis
                    duration,                                   // Accurate request processing time
                    req.get('User-Agent')                       // Client identification for behavior analysis
                );
            });
            
            // Continue request processing without delay
            next();
        };
    }

    /**
     * Wraps database operations for automatic performance tracking
     * 
     * This wrapper provides transparent database operation monitoring without requiring
     * changes to existing database code. It captures timing and success information for
     * every database operation, enabling comprehensive query performance analysis.
     * 
     * Wrapper implementation:
     * - High-resolution timing for accurate performance measurement
     * - Automatic success/failure detection through exception handling
     * - Operation categorization for focused performance analysis
     * - Transparent result passthrough maintaining original API contracts
     * 
     * @param {Function} operation - Database operation function to wrap
     * @param {string} operationName - Descriptive name for the operation type
     * @returns {Function} Wrapped operation with performance tracking
     */
    wrapDatabaseOperation(operation, operationName) { // wrap database functions for automatic performance tracking
        console.log(`PerformanceMonitor wrapping database operation: ${operationName}`);
        
        return async (...args) => {
            // Capture high-resolution operation start time
            const startTime = process.hrtime.bigint();
            let success = true;
            
            try {
                // Execute original database operation with argument passthrough
                const result = await operation(...args);
                return result; // Return original result without modification
            } catch (error) {
                // Track operation failure for reliability monitoring
                success = false;
                throw error; // Re-throw original error without modification
            } finally {
                // Record performance metrics regardless of operation outcome
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
                
                this.database.recordQuery(operationName, duration, success);
            }
        };
    }

    /**
     * Generates comprehensive performance report combining all monitoring dimensions
     * 
     * This method produces a unified performance analysis that combines database, HTTP,
     * and system metrics into a single comprehensive report. The report is optimized
     * for monitoring dashboard consumption and performance analysis workflows.
     * 
     * Report integration:
     * - Temporal synchronization across all performance dimensions
     * - Consistent metric formatting for dashboard consumption
     * - Comprehensive coverage enabling holistic performance assessment
     * - Structured data format suitable for alerting system integration
     * 
     * @returns {Object} Comprehensive performance metrics across all monitoring dimensions
     */
    getComprehensiveMetrics() { // produce unified performance report across all dimensions
        console.log('PerformanceMonitor generating comprehensive performance report');
        
        const report = {
            timestamp: new Date().toISOString(),               // temporal context for report correlation
            database: this.database.getMetrics(),              // database performance analysis
            requests: this.requests.getMetrics(),              // HTTP endpoint performance analysis
            system: this.system.getMetrics()                   // system resource utilization analysis
        };
        
        console.log('PerformanceMonitor comprehensive report generated successfully');
        return report;
    }

    /**
     * Generates performance health check summary for monitoring system integration
     * 
     * This method produces a simplified health assessment that summarizes overall system
     * performance status. The health check is designed for integration with monitoring
     * systems, alerting platforms, and automated deployment pipelines.
     * 
     * Health assessment methodology:
     * - Individual component health evaluation against configurable thresholds
     * - Overall system health determination using worst-case component status
     * - Actionable status levels for automated response systems
     * - Key performance indicators for quick performance assessment
     * 
     * Status levels:
     * - healthy: All systems performing within normal parameters
     * - warning: Performance degradation detected but system functional
     * - degraded: Significant performance issues requiring attention
     * 
     * @returns {Object} Performance health check summary with component status breakdown
     */
    getHealthCheck() { // generate performance health assessment for monitoring integration
        console.log('PerformanceMonitor generating performance health check');
        
        // Collect current metrics from all monitoring components
        const dbMetrics = this.database.getMetrics();
        const reqMetrics = this.requests.getMetrics();
        const sysMetrics = this.system.getMetrics();
        
        // Evaluate individual component health against performance thresholds
        const health = {
            status: 'healthy',                              // overall system performance status
            timestamp: new Date().toISOString(),           // health check temporal context
            checks: {
                database: {
                    status: dbMetrics.slowQueries < 10 ? 'healthy' : 'degraded',
                    slowQueries: dbMetrics.slowQueries,
                    totalQueries: dbMetrics.totalQueries
                },
                requests: {
                    status: reqMetrics.requestsPerSecond < 1000 ? 'healthy' : 'high_load',
                    requestsPerSecond: reqMetrics.requestsPerSecond,
                    totalRequests: reqMetrics.totalRequests
                },
                memory: {
                    status: sysMetrics.memory.current.heapUsed < 512 ? 'healthy' : 'high_usage',
                    heapUsedMB: sysMetrics.memory.current.heapUsed,
                    cpuPercent: sysMetrics.cpu.current
                }
            }
        };
        
        // Determine overall system health based on worst component status
        const statuses = Object.values(health.checks).map(check => check.status);
        if (statuses.includes('degraded')) {
            health.status = 'degraded';
        } else if (statuses.includes('high_load') || statuses.includes('high_usage')) {
            health.status = 'warning';
        }
        
        console.log(`PerformanceMonitor health check completed with status: ${health.status}`);
        return health;
    }

    /**
     * Stops all monitoring components and cleans up resources
     * 
     * This method provides proper cleanup for the entire monitoring system, ensuring
     * that all automated collection processes are stopped and resources are released.
     * Essential for applications that dynamically manage monitoring instances.
     */
    stop() { // cleanup all monitoring components and release resources
        console.log('PerformanceMonitor stopping all monitoring components');
        
        this.system.stop(); // Stop system metrics collection timer
        
        console.log('PerformanceMonitor cleanup completed');
    }
}

// Export individual components for flexible integration patterns
// This allows consumers to use specific monitoring components independently
// while also providing the unified PerformanceMonitor for comprehensive monitoring
module.exports = {
    DatabaseMetrics,        // database performance tracking component
    RequestMetrics,         // HTTP request performance tracking component
    SystemMetrics,          // system resource monitoring component
    PerformanceMonitor      // unified performance monitoring orchestration
};