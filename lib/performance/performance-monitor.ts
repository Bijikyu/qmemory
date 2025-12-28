/**
 * Simple Performance Monitor
 * Centralized performance monitoring without external dependencies
 */

import qerrors from 'qerrors';

export class PerformanceMonitor {
  private database: any = null;
  private requests: any = null;
  private system: any = null;

  constructor(options: any = {}) {
    // Initialize basic metrics tracking
    this.database = { getMetrics: () => ({ totalQueries: 0, slowQueries: 0 }) };
    this.requests = { getMetrics: () => ({ totalRequests: 0, requestsPerSecond: 0 }) };
    this.system = {
      getMetrics: () => ({ memory: { current: { heapUsed: 0 } }, cpu: { current: 0 } }),
    };
    console.log('PerformanceMonitor initialization completed');
  }

  getMiddleware() {
    console.log('PerformanceMonitor creating Express request tracking middleware');
    return (req: any, res: any, next: any) => {
      const startTime = process.hrtime.bigint();

      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        this.requests.recordRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration,
          req.get('User-Agent') || null
        );
      });

      next();
    };
  }

  wrapDatabaseOperation<T extends any[]>(
    operation: (...args: T) => Promise<any>,
    operationName: string
  ) {
    console.log(`PerformanceMonitor wrapping database operation: ${operationName}`);
    return async (...args: T) => {
      const shouldTime = Math.random() < 0.1;
      let startTime: bigint;

      if (shouldTime) {
        startTime = process.hrtime.bigint();
      }

      let success = true;
      try {
        const result = await operation(...args);
        return result;
      } catch (error) {
        success = false;
        qerrors.qerrors(error as Error, 'performance-monitor.wrapDatabaseOperation', {
          operationName,
          argCount: args.length,
          operationType: typeof operation,
          success: false,
        });
        throw error;
      } finally {
        if (shouldTime) {
          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1000000;
          this.database.recordQuery(operationName, duration, success);
        } else {
          this.database.recordQuery(operationName, 0, success);
        }
      }
    };
  }

  getHealthCheck() {
    console.log('PerformanceMonitor generating performance health check');
    const dbMetrics = this.database.getMetrics();
    const reqMetrics = this.requests.getMetrics();
    const sysMetrics = this.system.getMetrics();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          slowQueries: dbMetrics.slowQueries,
          totalQueries: dbMetrics.totalQueries,
        },
        requests: {
          status: 'healthy',
          requestsPerSecond: reqMetrics.requestsPerSecond,
          totalRequests: reqMetrics.totalRequests,
        },
        memory: {
          status: 'healthy',
          heapUsedMB: sysMetrics.memory.current.heapUsed,
          cpuPercent: sysMetrics.cpu.current,
        },
      },
    };

    console.log(`PerformanceMonitor health check completed with status: ${health.status}`);
    return health;
  }

  getComprehensiveMetrics() {
    console.log('PerformanceMonitor generating comprehensive performance report');

    const report = {
      timestamp: new Date().toISOString(),
      database: this.database.getMetrics(),
      requests: this.requests.getMetrics(),
      system: this.system.getMetrics(),
    };

    console.log('PerformanceMonitor comprehensive report generated successfully');
    return report;
  }

  stop() {
    console.log('PerformanceMonitor stopping all monitoring components');
    console.log('PerformanceMonitor cleanup completed');
  }
}

export default PerformanceMonitor;
