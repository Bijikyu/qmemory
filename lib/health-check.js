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

const os = require('os');
const fs = require('fs');
const { createTerminus } = require('@godaddy/terminus');

let totalRequests = 0;
let totalResponseTime = 0;
let totalErrors = 0;
let activeRequests = 0;

const updateMetrics = (responseTime, isError = false) => {
  totalRequests++;
  totalResponseTime += responseTime;
  isError && totalErrors++;
};

const incrementActiveRequests = () => { activeRequests++; };

const decrementActiveRequests = () => { activeRequests = Math.max(0, activeRequests - 1); };

/**
 * Get memory usage information
 * 
 * @returns {Object} Memory usage statistics
 */
const getMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
    systemTotal: totalMem,
    systemFree: freeMem,
    systemUsed: totalMem - freeMem,
    systemUsagePercent: totalMem > 0 ? ((totalMem - freeMem) / totalMem * 100).toFixed(2) : '0.00'
  };
};

/**
 * Get CPU usage information
 * 
 * @returns {Object} CPU usage statistics
 */
const getCpuUsage = () => {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  return {
    model: cpus.length > 0 ? (cpus[0]?.model || 'unknown') : 'unknown',
    speed: cpus.length > 0 ? (cpus[0]?.speed || 0) : 0,
    cores: cpus.length,
    loadAverage: {
      '1min': loadAvg[0] || 0,
      '5min': loadAvg[1] || 0,
      '15min': loadAvg[2] || 0
    }
  };
};

/**
 * Get filesystem usage information
 * 
 * @returns {Object} Filesystem usage statistics
 */
const getFilesystemUsage = () => {
  try {
    fs.statSync('.');
    return { status: 'pass', message: 'Filesystem accessible' };
  } catch (error) {
    return { status: 'fail', message: `Filesystem error: ${error.message}` };
  }
};

/**
 * Get request metrics
 * 
 * @returns {Object} Request statistics
 */
function getRequestMetrics() {
  const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests * 100) : 0;
  
  return {
    totalRequests,
    totalErrors,
    activeRequests,
    averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
    errorRate: parseFloat(errorRate.toFixed(2))
  };
}

/**
 * Perform comprehensive health check
 * 
 * @returns {Object} Health check results
 */
function performHealthCheck() {
  const memUsage = getMemoryUsage();
  const cpuUsage = getCpuUsage();
  const fsUsage = getFilesystemUsage();
  const requestMetrics = getRequestMetrics();
  
  // Determine overall health status
  const memoryUsagePercent = parseFloat(memUsage.systemUsagePercent);
  const load1Min = cpuUsage.loadAverage['1min'];
  const errorRate = requestMetrics.errorRate;
  
  let overallStatus = 'pass';
  const checks = [];
  
  // Memory check
  if (memoryUsagePercent > 90) {
    overallStatus = 'fail';
    checks.push({ name: 'memory', status: 'fail', message: `Memory usage: ${memoryUsagePercent}%` });
  } else if (memoryUsagePercent > 75) {
    overallStatus = overallStatus === 'fail' ? 'fail' : 'warn';
    checks.push({ name: 'memory', status: 'warn', message: `Memory usage: ${memoryUsagePercent}%` });
  } else {
    checks.push({ name: 'memory', status: 'pass', message: `Memory usage: ${memoryUsagePercent}%` });
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
  checks.push({ name: 'filesystem', ...fsUsage });
  if (fsUsage.status === 'fail') {
    overallStatus = 'fail';
  }
  
  // Error rate check
  if (errorRate > 50) {
    overallStatus = 'fail';
    checks.push({ name: 'error_rate', status: 'fail', message: `Error rate: ${errorRate}%` });
  } else if (errorRate > 10) {
    overallStatus = overallStatus === 'fail' ? 'fail' : 'warn';
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
      requests: requestMetrics
    }
  };
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
    const health = performHealthCheck();
    
    // For liveness, we only care if the process is responsive
    // Critical failures only
    if (health.status === 'fail' && health.checks.some(check => 
        check.name === 'filesystem' && check.status === 'fail')) {
      throw new Error('Application is not in a recoverable state');
    }
    
    return {
      status: 'ok',
      timestamp: health.timestamp,
      uptime: health.uptime
    };
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
    const health = performHealthCheck();
    
    // For readiness, we check if we can handle traffic
    // High memory usage or high error rates make us not ready
    if (health.status === 'fail') {
      throw new Error('Application is not ready to serve traffic');
    }
    
    if (health.status === 'warn' && health.checks.some(check => 
        (check.name === 'memory' && parseFloat(check.message.match(/\d+/)?.[0] || 0) > 85) ||
        (check.name === 'error_rate' && parseFloat(check.message.match(/\d+/)?.[0] || 0) > 20))) {
      throw new Error('Application is degraded and not ready for full traffic');
    }
    
    return {
      status: 'ok',
      timestamp: health.timestamp,
      uptime: health.uptime
    };
  };
}

/**
 * Custom health check function for terminus
 * 
 * @returns {Promise<Object>} Health check result
 */
const healthCheck = async () => {
  const health = performHealthCheck();
  
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
function createOnSignal(onSignal) {
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
 * @param {Object} server - Express server instance
 * @param {Object} options - Configuration options
 * @returns {Object} Terminus configuration
 */
function setupHealthChecks(server, options = {}) {
  const terminusOptions = {
    healthChecks: {
      '/health': healthCheck,
      '/live': createLivenessCheck(),
      '/ready': createReadinessCheck()
    },
    onSignal: createOnSignal(options.onSignal),
    onShutdown: options.onShutdown,
    logger: options.logger || console.log,
    timeout: options.timeout || 5000,
    interval: options.interval || 10000,
    beforeShutdown: options.beforeShutdown
  };
  
  return createTerminus(server, terminusOptions);
}

// Legacy compatibility functions

/**
 * Create health check endpoint (legacy compatibility)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function createHealthEndpoint(req, res) {
  const health = performHealthCheck();
  
  const statusCode = health.status === 'pass' ? 200 : 
                    health.status === 'warn' ? 200 : 503;
  
  res.status(statusCode).json(health);
}

/**
 * Create liveness endpoint (legacy compatibility)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function createLivenessEndpoint(req, res) {
  createLivenessCheck()()
    .then(result => res.json(result))
    .catch(error => res.status(503).json({ 
      status: 'error', 
      message: error.message 
    }));
}

/**
 * Create readiness endpoint (legacy compatibility)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function createReadinessEndpoint(req, res) {
  createReadinessCheck()()
    .then(result => res.json(result))
    .catch(error => res.status(503).json({ 
      status: 'error', 
      message: error.message 
    }));
}

// Export all functions
module.exports = {
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
  createReadinessEndpoint
};