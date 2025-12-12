/**
 * Health Check and Monitoring Service
 * Comprehensive health monitoring for applications and microservices
 * 
 * Provides health monitoring for load balancers, monitoring systems,
 * auto-scaling solutions, and container orchestration platforms.
 * 
 * Features:
 * - Service health status checks (healthy/degraded/unhealthy)
 * - Resource usage monitoring (memory, CPU, filesystem)
 * - Request metrics tracking
 * - Kubernetes readiness/liveness endpoints
 * - Graceful degradation reporting
 * 
 * Design philosophy:
 * - Simple pass/warn/fail status for each check
 * - Configurable thresholds for different environments
 * - Minimal overhead for frequent health checks
 * - Integration with existing performance utilities
 */

const os = require('os');
const fs = require('fs');
const { performance } = require('perf_hooks');

let totalRequests = 0;
let totalResponseTime = 0;
let totalErrors = 0;
let activeRequests = 0;

/**
 * Update request metrics tracking
 * 
 * @param {number} responseTime - Response time in milliseconds
 * @param {boolean} isError - Whether the request resulted in an error
 */
function updateMetrics(responseTime, isError = false) {
  totalRequests++;
  totalResponseTime += responseTime;
  if (isError) {
    totalErrors++;
  }
}

/**
 * Increment active request counter
 */
function incrementActiveRequests() {
  activeRequests++;
}

/**
 * Decrement active request counter
 */
function decrementActiveRequests() {
  activeRequests = Math.max(0, activeRequests - 1);
}

/**
 * Get current request metrics
 * 
 * @returns {Object} Current metrics snapshot
 */
function getRequestMetrics() {
  const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  
  return {
    activeRequests,
    totalRequests,
    totalErrors,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100
  };
}

/**
 * Reset request metrics
 */
function resetMetrics() {
  totalRequests = 0;
  totalResponseTime = 0;
  totalErrors = 0;
  activeRequests = 0;
}

/**
 * Check memory usage health
 * 
 * @param {Object} thresholds - Memory thresholds
 * @returns {Object} Health check result
 */
function checkMemoryHealth(thresholds = {}) {
  const warnThreshold = thresholds.warn ?? 70;
  const failThreshold = thresholds.fail ?? 85;
  
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemoryMB = memUsage.rss / 1024 / 1024;
    const totalMemoryMB = totalMemory / 1024 / 1024;
    const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;
    
    const details = {
      rss: Math.round(usedMemoryMB),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      percent: Math.round(memoryUsagePercent)
    };
    
    if (memoryUsagePercent > failThreshold) {
      return {
        status: 'fail',
        message: `High memory usage: ${Math.round(memoryUsagePercent)}%`,
        details
      };
    }
    
    if (memoryUsagePercent > warnThreshold) {
      return {
        status: 'warn',
        message: `Moderate memory usage: ${Math.round(memoryUsagePercent)}%`,
        details
      };
    }
    
    return {
      status: 'pass',
      message: `Memory usage normal: ${Math.round(memoryUsagePercent)}%`,
      details
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Memory check error: ${error.message}`
    };
  }
}

/**
 * Check CPU usage health
 * 
 * @param {Object} thresholds - CPU thresholds
 * @returns {Object} Health check result
 */
function checkCpuHealth(thresholds = {}) {
  const warnThreshold = thresholds.warn ?? 70;
  const failThreshold = thresholds.fail ?? 90;
  
  try {
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const oneMinuteLoad = loadAvg[0];
    const loadPercent = (oneMinuteLoad / cpuCount) * 100;
    
    const details = {
      load: oneMinuteLoad,
      load5min: loadAvg[1],
      load15min: loadAvg[2],
      cores: cpuCount,
      percent: Math.round(loadPercent)
    };
    
    if (loadPercent > failThreshold) {
      return {
        status: 'fail',
        message: `High CPU load: ${Math.round(loadPercent)}%`,
        details
      };
    }
    
    if (loadPercent > warnThreshold) {
      return {
        status: 'warn',
        message: `Moderate CPU load: ${Math.round(loadPercent)}%`,
        details
      };
    }
    
    return {
      status: 'pass',
      message: `CPU load normal: ${Math.round(loadPercent)}%`,
      details
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `CPU check error: ${error.message}`
    };
  }
}

/**
 * Check filesystem access health
 * 
 * @returns {Object} Health check result
 */
function checkFilesystemHealth() {
  try {
    const testFile = `${os.tmpdir()}/health-check-${Date.now()}.tmp`;
    
    try {
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
    } catch (writeError) {
      try {
        fs.unlinkSync(testFile);
      } catch {
        // Ignore cleanup errors
      }
      throw writeError;
    }
    
    return {
      status: 'pass',
      message: 'Filesystem accessible',
      details: { tmpdir: os.tmpdir() }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Filesystem error: ${error.message}`
    };
  }
}

/**
 * Run a custom health check function
 * 
 * @param {string} name - Check name
 * @param {Function} checkFn - Async function that returns true/false or throws
 * @returns {Promise<Object>} Health check result
 */
async function runCustomCheck(name, checkFn) {
  const startTime = performance.now();
  
  try {
    const result = await checkFn();
    const responseTime = performance.now() - startTime;
    
    return {
      status: result ? 'pass' : 'fail',
      message: result ? `${name} check passed` : `${name} check failed`,
      responseTime: Math.round(responseTime)
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;
    return {
      status: 'fail',
      message: `${name} error: ${error.message}`,
      responseTime: Math.round(responseTime)
    };
  }
}

/**
 * Determine overall health status from check results
 * 
 * @param {Array<Object>} checks - Array of health check results
 * @returns {string} Overall status: 'healthy', 'degraded', or 'unhealthy'
 */
function determineOverallStatus(checks) {
  const hasFailures = checks.some(check => check.status === 'fail');
  const hasWarnings = checks.some(check => check.status === 'warn');
  
  if (hasFailures) return 'unhealthy';
  if (hasWarnings) return 'degraded';
  return 'healthy';
}

/**
 * Get comprehensive health status
 * 
 * @param {Object} options - Health check options
 * @returns {Object} Complete health status report
 */
function getHealthStatus(options = {}) {
  const startTime = performance.now();
  
  const services = {
    memory: checkMemoryHealth(options.memoryThresholds),
    cpu: checkCpuHealth(options.cpuThresholds)
  };
  
  const dependencies = {
    filesystem: checkFilesystemHealth()
  };
  
  const allChecks = [...Object.values(services), ...Object.values(dependencies)];
  const overallStatus = determineOverallStatus(allChecks);
  
  const metrics = getRequestMetrics();
  const responseTime = performance.now() - startTime;
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime() * 1000,
    version: process.env.npm_package_version || '1.0.0',
    services,
    dependencies,
    metrics,
    responseTime: Math.round(responseTime)
  };
}

/**
 * Express middleware for comprehensive health check endpoint
 * 
 * @param {Object} options - Health check options
 * @returns {Function} Express middleware function
 */
function healthCheckMiddleware(options = {}) {
  return (req, res) => {
    const healthStatus = getHealthStatus(options);
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
    
    console.log(`Health check completed in ${healthStatus.responseTime}ms: ${healthStatus.status}`);
  };
}

/**
 * Express middleware for Kubernetes readiness check
 * 
 * @param {Object} options - Readiness check options
 * @returns {Function} Express middleware function
 */
function readinessCheckMiddleware(options = {}) {
  return (req, res) => {
    const memoryReady = checkMemoryHealth(options.memoryThresholds).status !== 'fail';
    const filesystemReady = checkFilesystemHealth().status !== 'fail';
    
    const isReady = memoryReady && filesystemReady;
    
    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({
        status: 'not ready',
        checks: {
          memory: memoryReady,
          filesystem: filesystemReady
        }
      });
    }
  };
}

/**
 * Express middleware for Kubernetes liveness check
 * 
 * @returns {Function} Express middleware function
 */
function livenessCheckMiddleware() {
  return (req, res) => {
    res.status(200).json({
      status: 'alive',
      uptime: process.uptime(),
      pid: process.pid
    });
  };
}

/**
 * Create health check routes for Express app
 * 
 * @param {Object} app - Express application
 * @param {Object} options - Configuration options
 */
function setupHealthRoutes(app, options = {}) {
  const basePath = options.basePath || '/health';
  
  app.get(basePath, healthCheckMiddleware(options));
  app.get(`${basePath}/ready`, readinessCheckMiddleware(options));
  app.get(`${basePath}/live`, livenessCheckMiddleware());
  
  console.log(`Health check routes configured at ${basePath}`);
}

module.exports = {
  updateMetrics,
  incrementActiveRequests,
  decrementActiveRequests,
  getRequestMetrics,
  resetMetrics,
  checkMemoryHealth,
  checkCpuHealth,
  checkFilesystemHealth,
  runCustomCheck,
  determineOverallStatus,
  getHealthStatus,
  healthCheckMiddleware,
  readinessCheckMiddleware,
  livenessCheckMiddleware,
  setupHealthRoutes
};
