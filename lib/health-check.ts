/**
 * Health Check and Monitoring Service using Terminus
 * Comprehensive health monitoring for applications and microservices
 *
 * Provides health monitoring for load balancers, monitoring systems,
 * auto-scaling solutions, and container orchestration platforms using
 * the industry-standard terminus package for Kubernetes integration.
 *
 * Features:
 * - Service health status checks (healthy/degraded/unhealthy)
 * - Resource usage monitoring (memory, CPU, filesystem)
 * - Request metrics tracking
 * - Kubernetes readiness/liveness endpoints
 * - Graceful degradation reporting
 * - Graceful shutdown handling
 *
 * Design philosophy:
 * - Simple pass/warn/fail status for each check
 * - Configurable thresholds for different environments
 * - Minimal overhead for frequent health checks
 * - Integration with existing performance utilities
 * - Standard Kubernetes health check patterns
 */
import { promises as fs } from 'fs';
import { totalmem, freemem, cpus as getCpuInfo, loadavg as getLoadAverage } from 'node:os'; // Use Node's ESM OS utilities for metrics gathering
import { createTerminus, HealthCheck } from '@godaddy/terminus';
import { Server } from 'http';
import { Request, Response } from 'express';
import qerrors from 'qerrors';

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  systemTotal: number;
  systemFree: number;
  systemUsed: number;
  systemUsagePercent: string;
}

interface CpuUsage {
  model: string;
  speed: number;
  cores: number;
  loadAverage: {
    '1min': number;
    '5min': number;
    '15min': number;
  };
}

interface FilesystemUsage {
  status: 'pass' | 'fail';
  message: string;
}

interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  activeRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

interface HealthCheckItem {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  timestamp: string;
  uptime: number;
  checks: HealthCheckItem[];
  metrics: {
    memory: MemoryUsage;
    cpu: CpuUsage;
    requests: RequestMetrics;
  };
}

interface TerminusOptions {
  onSignal?: () => Promise<void>;
  logger?: (message: string) => void;
  timeout?: number;
  interval?: number;
  beforeShutdown?: () => Promise<void>;
  onShutdown?: () => Promise<void>;
}
let totalRequests = 0;
let totalResponseTime = 0;
let totalErrors = 0;
let activeRequests = 0;
const updateMetrics = (responseTime: number, isError: boolean = false): void => {
  totalRequests++;
  totalResponseTime += responseTime;
  isError && totalErrors++;
};
const incrementActiveRequests = () => {
  activeRequests++;
};
const decrementActiveRequests = () => {
  activeRequests = Math.max(0, activeRequests - 1);
};
/**
 * Get memory usage information
 *
 * @returns {MemoryUsage} Memory usage statistics
 */
const getMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  const totalMem = totalmem(); // Capture total system memory via ESM import to avoid CommonJS require
  const freeMem = freemem(); // Capture free memory using the same ESM-based access pattern
  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
    systemTotal: totalMem,
    systemFree: freeMem,
    systemUsed: totalMem - freeMem,
    systemUsagePercent:
      totalMem > 0 ? (((totalMem - freeMem) / totalMem) * 100).toFixed(2) : '0.00',
  };
};
/**
 * Get CPU usage information
 *
 * @returns {CpuUsage} CPU usage statistics
 */
const getCpuUsage = () => {
  const cpuInfo = getCpuInfo(); // Collect CPU core information with ESM-compatible helper
  const loadAvg = getLoadAverage(); // Collect load averages without falling back to CommonJS require
  return {
    model: cpuInfo.length > 0 ? cpuInfo[0]?.model || 'unknown' : 'unknown',
    speed: cpuInfo.length > 0 ? cpuInfo[0]?.speed || 0 : 0,
    cores: cpuInfo.length,
    loadAverage: {
      '1min': loadAvg[0] || 0,
      '5min': loadAvg[1] || 0,
      '15min': loadAvg[2] || 0,
    },
  };
};
/**
 * Get filesystem usage information
 *
 * @returns {FilesystemUsage} Filesystem usage statistics
 */
const getFilesystemUsage = async (): Promise<FilesystemUsage> => {
  try {
    await fs.stat('.');
    return { status: 'pass', message: 'Filesystem accessible' };
  } catch (error) {
    qerrors.qerrors(error as Error, 'health-check.getFilesystemUsage', {
      operation: 'filesystem-check',
    });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { status: 'fail', message: `Filesystem error: ${errorMessage}` };
  }
};
/**
 * Get request metrics
 *
 * @returns {RequestMetrics} Request statistics
 */
function getRequestMetrics(): RequestMetrics {
  const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  return {
    totalRequests,
    totalErrors,
    activeRequests,
    averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    errorRate: parseFloat(errorRate.toFixed(2)),
  };
}
/**
 * Perform comprehensive health check
 *
 * @returns {Promise<HealthCheckResult>} Health check results
 */
async function performHealthCheck() {
  try {
    const memUsage = getMemoryUsage();
    const cpuUsage = getCpuUsage();
    const fsUsage = await getFilesystemUsage();
    const requestMetrics = getRequestMetrics();
    // Determine overall health status
    const memoryUsagePercent = parseFloat(memUsage.systemUsagePercent);
    const load1Min = cpuUsage.loadAverage['1min'];
    const errorRate = requestMetrics.errorRate;
    let overallStatus = 'pass';
    const checks = [];
    let hasFailed = false;
    // Memory check
    if (memoryUsagePercent > 90) {
      overallStatus = 'fail';
      hasFailed = true;
      checks.push({
        name: 'memory',
        status: 'fail',
        message: `Memory usage: ${memoryUsagePercent}%`,
      });
    } else if (memoryUsagePercent > 75) {
      if (!hasFailed) {
        overallStatus = 'warn';
      }
      checks.push({
        name: 'memory',
        status: 'warn',
        message: `Memory usage: ${memoryUsagePercent}%`,
      });
    } else {
      checks.push({
        name: 'memory',
        status: 'pass',
        message: `Memory usage: ${memoryUsagePercent}%`,
      });
    }
    // CPU check
    if (load1Min > cpuUsage.cores * 2) {
      overallStatus = 'fail';
      checks.push({ name: 'cpu', status: 'fail', message: `Load average: ${load1Min.toFixed(2)}` });
    } else if (load1Min > cpuUsage.cores) {
      overallStatus = overallStatus === 'fail' ? 'fail' : 'warn';
      checks.push({ name: 'cpu', status: 'warn', message: `Load average: ${load1Min.toFixed(2)}` });
    } else {
      checks.push({ name: 'cpu', status: 'pass', message: `Load average: ${load1Min.toFixed(2)}` });
    }
    // Filesystem check
    checks.push({ name: 'filesystem', status: fsUsage.status, message: fsUsage.message });
    if (fsUsage.status === 'fail') {
      overallStatus = 'fail';
      hasFailed = true;
    }
    // Error rate check
    if (errorRate > 50) {
      overallStatus = 'fail';
      checks.push({ name: 'error_rate', status: 'fail', message: `Error rate: ${errorRate}%` });
    } else if (errorRate > 10) {
      if (!hasFailed) {
        overallStatus = 'warn';
      }
      checks.push({ name: 'error_rate', status: 'warn', message: `Error rate: ${errorRate}%` });
    } else {
      checks.push({ name: 'error_rate', status: 'pass', message: `Error rate: ${errorRate}%` });
    }
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      metrics: {
        memory: memUsage,
        cpu: cpuUsage,
        requests: requestMetrics,
      },
    };
  } catch (error) {
    qerrors.qerrors(error as Error, 'health-check.performHealthCheck', {
      operation: 'comprehensive-health-check',
    });
    throw error;
  }
}
/**
 * Create liveness health check function for Kubernetes
 *
 * Liveness checks determine if the application is in a healthy state
 * and should be restarted if it's not responding properly.
 *
 * @returns {Function} Liveness check function
 */
function createLivenessCheck() {
  return async () => {
    try {
      const health = await performHealthCheck();
      // For liveness, we only care if the process is responsive
      // Critical failures only
      if (
        health.status === 'fail' &&
        health.checks.some(check => check.name === 'filesystem' && check.status === 'fail')
      ) {
        throw new Error('Application is not in a recoverable state');
      }
      return {
        status: 'ok',
        timestamp: health.timestamp,
        uptime: health.uptime,
      };
    } catch (error) {
      qerrors.qerrors(error as Error, 'health-check.createLivenessCheck', {
        operation: 'liveness-check',
      });
      throw error;
    }
  };
}
/**
 * Create readiness health check function for Kubernetes
 *
 * Readiness checks determine if the application is ready to serve traffic.
 *
 * @returns {Function} Readiness check function
 */
function createReadinessCheck() {
  return async () => {
    try {
      const health = await performHealthCheck();
      // For readiness, we check if we can handle traffic
      // High memory usage or high error rates make us not ready
      if (health.status === 'fail') {
        throw new Error('Application is not ready to serve traffic');
      }
      if (
        health.status === 'warn' &&
        health.checks.some(
          check =>
            (check.name === 'memory' && parseFloat(check.message.match(/\d+/)?.[0] || '0') > 85) ||
            (check.name === 'error_rate' && parseFloat(check.message.match(/\d+/)?.[0] || '0') > 20)
        )
      ) {
        throw new Error('Application is degraded and not ready for full traffic');
      }
      return {
        status: 'ok',
        timestamp: health.timestamp,
        uptime: health.uptime,
      };
    } catch (error) {
      qerrors.qerrors(error as Error, 'health-check.createReadinessCheck', {
        operation: 'readiness-check',
      });
      throw error;
    }
  };
}
/**
 * Custom health check function for terminus
 *
 * @returns {Promise<HealthCheckResult>} Health check result
 */
const healthCheck = async () => {
  const health = await performHealthCheck();
  // Convert to terminus format
  if (health.status === 'fail') {
    throw new Error('Health check failed');
  }
  return health;
};
/**
 * Graceful shutdown handler
 *
 * @param {Function} onSignal - Signal handler function
 * @returns {Function} Terminus onSignal handler
 */
function createOnSignal(onSignal?: () => Promise<void>): () => Promise<void> {
  return async () => {
    console.log('Received signal, starting graceful shutdown...');
    if (typeof onSignal === 'function') {
      await onSignal();
    }
    console.log('Graceful shutdown completed');
  };
}
/**
 * Create health check middleware for Express
 *
 * @param {Server} server - Express server instance
 * @param {TerminusOptions} options - Configuration options
 * @returns {ReturnType<typeof createTerminus>} Terminus configuration
 */
function setupHealthChecks(
  server: Server,
  options: TerminusOptions = {}
): ReturnType<typeof createTerminus> {
  const terminusOptions: any = {
    healthChecks: {
      '/health': healthCheck,
      '/live': createLivenessCheck(),
      '/ready': createReadinessCheck(),
    },
    onSignal: createOnSignal(options.onSignal),
    logger: options.logger || console.log,
    timeout: options.timeout || 5000,
    interval: options.interval || 10000,
    beforeShutdown: options.beforeShutdown,
  };
  if (options.onShutdown) {
    terminusOptions.onShutdown = options.onShutdown;
  }
  return createTerminus(server, terminusOptions);
}
// Legacy compatibility functions
/**
 * Create health check endpoint (legacy compatibility)
 *
 * @param {any} req - Express request object
 * @param {any} res - Express response object
 */
function createHealthEndpoint(req: Request, res: Response): void {
  performHealthCheck()
    .then(health => {
      const statusCode = health.status === 'pass' ? 200 : health.status === 'warn' ? 200 : 503;
      res.status(statusCode).json(health);
    })
    .catch(error => {
      qerrors.qerrors(error as Error, 'health-check.createHealthEndpoint', {
        operation: 'health-endpoint',
        hasRequest: req !== undefined,
        hasResponse: res !== undefined,
      });
      res.status(503).json({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    });
}
/**
 * Create liveness endpoint (legacy compatibility)
 *
 * @param {any} req - Express request object
 * @param {any} res - Express response object
 */
function createLivenessEndpoint(req: Request, res: Response): void {
  createLivenessCheck()()
    .then(result => res.json(result))
    .catch(error => {
      qerrors.qerrors(error as Error, 'health-check.createLivenessEndpoint', {
        operation: 'liveness-endpoint',
        hasRequest: req !== undefined,
        hasResponse: res !== undefined,
      });
      res.status(503).json({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    });
}
/**
 * Create readiness endpoint (legacy compatibility)
 *
 * @param {any} req - Express request object
 * @param {any} res - Express response object
 */
function createReadinessEndpoint(req: Request, res: Response): void {
  createReadinessCheck()()
    .then(result => res.json(result))
    .catch(error => {
      qerrors.qerrors(error as Error, 'health-check.createReadinessEndpoint', {
        operation: 'readiness-endpoint',
        hasRequest: req !== undefined,
        hasResponse: res !== undefined,
      });
      res.status(503).json({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    });
}
// Export all functions
export {
  updateMetrics,
  incrementActiveRequests,
  decrementActiveRequests,
  getMemoryUsage,
  getCpuUsage,
  getFilesystemUsage,
  getRequestMetrics,
  performHealthCheck,
  createLivenessCheck,
  createReadinessCheck,
  createOnSignal,
  setupHealthChecks,
  // Legacy compatibility
  createHealthEndpoint,
  createLivenessEndpoint,
  createReadinessEndpoint,
};
