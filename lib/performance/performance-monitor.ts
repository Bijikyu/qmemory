/**
 * Performance Monitor Orchestration
 *
 * Centralized performance monitoring coordination that combines database, HTTP,
 * and system monitoring into a unified performance management system.
 */
import DatabaseMetrics from './database-metrics.js';
import RequestMetricsDefault from './request-metrics.js';
import SystemMetricsDefault from './system-metrics.js';

// Interface definitions
interface PerformanceMonitorOptions {
  database?: Record<string, any>;
  requests?: Record<string, any>;
  system?: Record<string, any>;
}

interface DatabaseMetricsReport {
  totalQueries: number;
  slowQueries: number;
  connectionPool: {
    active: number;
    available: number;
    created: number;
    destroyed: number;
  };
  queryStats: Record<
    string,
    {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      p95Duration: number;
      failureRate: number;
      queriesPerSecond: number;
    }
  >;
  recentSlowQueries: Array<{
    queryName: string;
    duration: number;
    timestamp: Date;
    success: boolean;
    metadata: any;
  }>;
}

interface RequestMetricsData {
  totalRequests: number;
  requestsPerSecond: number;
  uptime: number;
  endpoints: Record<
    string,
    {
      requests: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      p95Duration: number;
      errorRate: number;
      statusCodes: Record<number, number>;
    }
  >;
}

interface SystemMetricsData {
  memory: {
    current: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    history: any[];
  };
  cpu: {
    current: number;
    history: any[];
  };
  uptime: number;
  nodeVersion: string;
}

interface ComprehensiveMetrics {
  timestamp: string;
  database: DatabaseMetricsReport;
  requests: RequestMetricsData;
  system: SystemMetricsData;
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'degraded';
  timestamp: string;
  checks: {
    database: {
      status: 'healthy' | 'degraded';
      slowQueries: number;
      totalQueries: number;
    };
    requests: {
      status: 'healthy' | 'high_load';
      requestsPerSecond: number;
      totalRequests: number;
    };
    memory: {
      status: 'healthy' | 'high_usage';
      heapUsedMB: number;
      cpuPercent: number;
    };
  };
}

// Express request/response types
interface ExpressRequest {
  method: string;
  path: string;
  route?: { path: string };
  get: (header: string) => string | undefined;
}

interface ExpressResponse {
  statusCode: number;
  on: (event: string, listener: () => void) => void;
}

class PerformanceMonitor {
  private database: DatabaseMetrics;
  private requests: RequestMetricsDefault;
  private system: SystemMetricsDefault;

  constructor(options: PerformanceMonitorOptions = {}) {
    console.log('PerformanceMonitor initializing comprehensive monitoring system');
    // Initialize all monitoring components with consistent configuration
    this.database = new DatabaseMetrics(options.database || {});
    this.requests = new RequestMetricsDefault(options.requests || {});
    this.system = new SystemMetricsDefault(options.system || {});
    // Configure alerting for critical performance issues
    this.database.on('slowQuery', query => {
      console.warn(
        `PERFORMANCE_ALERT: Slow query detected - ${query.queryName} took ${query.duration}ms at ${query.timestamp}`
      );
    });
    console.log(
      'PerformanceMonitor initialization completed with all monitoring components active'
    );
  }
  /**
   * Creates Express middleware for automatic HTTP request performance tracking
   *
   * @returns {Function} Express middleware function for request performance tracking
   */
  createRequestMiddleware(): (req: ExpressRequest, res: ExpressResponse, next: () => void) => void {
    console.log('PerformanceMonitor creating Express request tracking middleware');
    return (req: ExpressRequest, res: ExpressResponse, next: () => void) => {
      // Capture high-resolution request start time for accurate duration calculation
      const startTime = process.hrtime.bigint();
      // Set up response completion tracking for request lifecycle monitoring
      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert nanoseconds to milliseconds
        // Record comprehensive request performance metrics
        this.requests.recordRequest(
          req.method, // HTTP method for categorization
          req.route?.path || req.path, // Route pattern or actual path
          res.statusCode, // Response status for outcome analysis
          duration, // Accurate request processing time
          req.get('User-Agent') || null // Client identification for behavior analysis
        );
      });
      // Continue request processing without delay
      next();
    };
  }
  /**
   * Wraps database operations for automatic performance tracking
   *
   * @param {Function} operation - Database operation function to wrap
   * @param {string} operationName - Descriptive name for operation type
   * @returns {Function} Wrapped operation with performance tracking
   */
  wrapDatabaseOperation<T extends any[]>(
    operation: (...args: T) => Promise<any>,
    operationName: string
  ): (...args: T) => Promise<any> {
    console.log(`PerformanceMonitor wrapping database operation: ${operationName}`);
    return async (...args: T) => {
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
   * @returns {ComprehensiveMetrics} Comprehensive performance metrics across all monitoring dimensions
   */
  getComprehensiveMetrics(): ComprehensiveMetrics {
    console.log('PerformanceMonitor generating comprehensive performance report');
    const report: ComprehensiveMetrics = {
      timestamp: new Date().toISOString(), // temporal context for report correlation
      database: this.database.getMetrics(), // database performance analysis
      requests: this.requests.getMetrics(), // HTTP endpoint performance analysis
      system: this.system.getMetrics(), // system resource utilization analysis
    };
    console.log('PerformanceMonitor comprehensive report generated successfully');
    return report;
  }
  /**
   * Generates performance health check summary for monitoring system integration
   *
   * @returns {HealthCheckResult} Performance health check summary with component status breakdown
   */
  getHealthCheck() {
    console.log('PerformanceMonitor generating performance health check');
    // Collect current metrics from all monitoring components
    const dbMetrics = this.database.getMetrics();
    const reqMetrics = this.requests.getMetrics();
    const sysMetrics = this.system.getMetrics();
    // Evaluate individual component health against performance thresholds
    const health = {
      status: 'healthy', // overall system performance status
      timestamp: new Date().toISOString(), // health check temporal context
      checks: {
        database: {
          status: dbMetrics.slowQueries < 10 ? 'healthy' : 'degraded',
          slowQueries: dbMetrics.slowQueries,
          totalQueries: dbMetrics.totalQueries,
        },
        requests: {
          status: reqMetrics.requestsPerSecond < 1000 ? 'healthy' : 'high_load',
          requestsPerSecond: reqMetrics.requestsPerSecond,
          totalRequests: reqMetrics.totalRequests,
        },
        memory: {
          status: sysMetrics.memory.current.heapUsed < 512 ? 'healthy' : 'high_usage',
          heapUsedMB: sysMetrics.memory.current.heapUsed,
          cpuPercent: sysMetrics.cpu.current,
        },
      },
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
   */
  stop() {
    console.log('PerformanceMonitor stopping all monitoring components');
    this.system.stop(); // Stop system metrics collection timer
    console.log('PerformanceMonitor cleanup completed');
  }
}
export default PerformanceMonitor;
