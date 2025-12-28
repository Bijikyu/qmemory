/**
 * HTTP Request Performance Metrics
 *
 * Comprehensive HTTP request tracking with timing analysis, status code monitoring,
 * and endpoint-specific performance metrics. This class provides detailed insights for API
 * performance analysis, capacity planning, and optimization decision-making.
 */
import * as qerrors from 'qerrors';

interface RequestMetricsOptions {
  maxRecentTimes?: number;
}

interface EndpointStats {
  requests: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  statusCodes: Map<number, number>;
  recentTimes: number[];
  p95: number;
}

interface RequestMetricsReport {
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

export default class RequestMetrics {
  private maxRecentTimes: number;
  private endpoints: Map<string, EndpointStats>;
  private totalRequests: number;
  private startTime: number;

  constructor(options: RequestMetricsOptions = {}) {
    // Configuration with production-appropriate defaults
    this.maxRecentTimes = options.maxRecentTimes || 100; // rolling window size for percentile calculations
    // Core metrics storage optimized for performance and memory efficiency
    this.endpoints = new Map(); // per-endpoint performance statistics
    this.totalRequests = 0; // global request counter for throughput analysis
    this.startTime = Date.now(); // application start time for uptime calculations
    console.log('RequestMetrics initialized for HTTP performance tracking');
  }
  /**
   * Records comprehensive HTTP request performance metrics
   *
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param path - Request path or route pattern for categorization
   * @param statusCode - HTTP response status code for outcome analysis
   * @param duration - Request processing time in milliseconds
   * @param userAgent - Client user agent for behavior analysis (optional)
   */
  recordRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userAgent: string | null = null
  ): void {
    try {
      console.log(`RequestMetrics recording: ${method} ${path} ${statusCode} ${duration}ms`);
      // Increment global request counter for overall throughput calculations
      this.totalRequests++;
      // Create endpoint identifier for performance categorization
      const endpoint = `${method} ${path}`;
      // Initialize endpoint statistics if this is first request to this endpoint
      if (!this.endpoints.has(endpoint)) {
        this.endpoints.set(endpoint, {
          requests: 0, // total request count for this endpoint
          totalDuration: 0, // cumulative response time for average calculation
          minDuration: Infinity, // fastest response time recorded
          maxDuration: 0, // slowest response time recorded
          statusCodes: new Map(), // HTTP status code distribution
          recentTimes: [], // rolling window for percentile calculation
          p95: 0, // 95th percentile response time
        });
      }
      // Update endpoint performance statistics with current request data
      const stats = this.endpoints.get(endpoint);
      if (stats) {
        stats.requests++;
        stats.totalDuration += duration;
        stats.minDuration = Math.min(stats.minDuration, duration);
        stats.maxDuration = Math.max(stats.maxDuration, duration);
        stats.recentTimes.push(duration);
      }
      // Track HTTP status code distribution for error pattern analysis
      if (stats) {
        stats.statusCodes.set(statusCode, (stats.statusCodes.get(statusCode) || 0) + 1);
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
      }
    } catch (error) {
      qerrors.qerrors(error as Error, 'request-metrics.recordRequest', {
        method,
        path,
        statusCode,
        duration,
        hasUserAgent: userAgent !== null,
        totalRequests: this.totalRequests,
        trackedEndpoints: this.endpoints.size,
      });
      // Re-throw to preserve error propagation for critical monitoring failures
      throw error;
    }
  }
  /**
   * Generates comprehensive HTTP performance metrics report
   *
   * @returns Comprehensive HTTP performance metrics report
   */
  getMetrics(): RequestMetricsReport {
    try {
      console.log('RequestMetrics generating comprehensive metrics report');
      // Calculate application-wide throughput metrics
      const uptime = Date.now() - this.startTime;
      const rps = this.totalRequests / (uptime / 1000);
      const metrics: RequestMetricsReport = {
        totalRequests: this.totalRequests, // overall request volume
        requestsPerSecond: Math.round(rps * 100) / 100, // throughput indicator
        uptime: Math.round(uptime / 1000), // application availability duration
        endpoints: {}, // per-endpoint performance breakdown
      };
      // Generate detailed statistics for each tracked endpoint
      for (const [endpoint, stats] of Array.from(this.endpoints.entries())) {
        // Calculate error rate from status code distribution
        const errorCount = Array.from(stats.statusCodes.entries())
          .filter(([code]) => code >= 400)
          .reduce((sum, [, count]) => sum + count, 0);
        metrics.endpoints[endpoint] = {
          requests: stats.requests, // endpoint request volume
          avgDuration: Math.round((stats.totalDuration / stats.requests) * 100) / 100, // mean response time
          minDuration: stats.minDuration, // best case performance
          maxDuration: stats.maxDuration, // worst case performance
          p95Duration: stats.p95, // 95th percentile latency
          errorRate: Math.round((errorCount / stats.requests) * 10000) / 100, // reliability percentage
          statusCodes: Object.fromEntries(stats.statusCodes), // HTTP outcome distribution
        };
      }
      console.log(
        `RequestMetrics report generated with ${Object.keys(metrics.endpoints).length} endpoints`
      );
      return metrics;
    } catch (error) {
      qerrors.qerrors(error as Error, 'request-metrics.getMetrics', {
        totalRequests: this.totalRequests,
        trackedEndpoints: this.endpoints.size,
        uptime: Date.now() - this.startTime,
        hasValidStartTime: this.startTime > 0,
      });
      // Return minimal metrics on error to prevent monitoring system failures
      return {
        totalRequests: this.totalRequests,
        requestsPerSecond: 0,
        uptime: Math.round((Date.now() - this.startTime) / 1000),
        endpoints: {},
      };
    }
  }
}
