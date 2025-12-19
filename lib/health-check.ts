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

import { stat } from 'node:fs/promises'; // ESM-native filesystem access keeps compatibility with TypeScript ESM builds.
import { freemem, totalmem, cpus as getCpuInfo, loadavg as getLoadAverage } from 'node:os'; // Node OS metrics supply memory and CPU telemetry without CommonJS fallbacks.
import { createTerminus, type TerminusOptions, type TerminusState } from '@godaddy/terminus'; // Terminus orchestrates health endpoints with graceful shutdown support.
import type { Server } from 'http';
import type { Request, Response } from 'express';

type HealthCheckStatus = 'pass' | 'warn' | 'fail';

interface DetailedMemoryUsage extends NodeJS.MemoryUsage {
  systemTotal: number;
  systemFree: number;
  systemUsed: number;
  systemUsagePercent: string;
}

interface CpuLoadAverage {
  '1min': number;
  '5min': number;
  '15min': number;
}

interface CpuUsageMetrics {
  model: string;
  speed: number;
  cores: number;
  loadAverage: CpuLoadAverage;
}

interface FilesystemUsageResult {
  status: Extract<HealthCheckStatus, 'pass' | 'fail'>;
  message: string;
}

interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  activeRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

interface HealthCheckDetail {
  name: string;
  status: HealthCheckStatus;
  message: string;
}

interface HealthCheckResult {
  status: HealthCheckStatus;
  timestamp: string;
  uptime: number;
  checks: HealthCheckDetail[];
  metrics: {
    memory: DetailedMemoryUsage;
    cpu: CpuUsageMetrics;
    requests: RequestMetrics;
  };
}

interface HealthEndpointPayload {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

type HealthEndpointHandler = () => Promise<HealthEndpointPayload>;

type HealthCheckLogger = (message: string, error?: Error) => void;

interface HealthCheckOptions extends Omit<TerminusOptions, 'logger' | 'onSignal' | 'healthChecks'> {
  logger?: HealthCheckLogger;
  onSignal?: () => void | Promise<void>;
  interval?: number;
}

let totalRequests = 0; // Tracks every completed request to compute running averages for observability.
let totalResponseTime = 0; // Aggregates cumulative response time so that averages stay accurate without storing all samples.
let totalErrors = 0; // Keeps a count of responses that surfaced errors to expose failure ratios.
let activeRequests = 0; // Mirrors the number of in-flight requests for live capacity indicators.

const defaultLogger: HealthCheckLogger = (message, error) => {
  if (error) {
    console.error(message, error); // Surface structured terminus errors without hiding stack traces.
    return;
  }
  console.log(message); // Provide lightweight logging when no error was supplied.
};

const toTerminusLogger = (logger: HealthCheckLogger): TerminusOptions['logger'] => (message, error) => {
  logger(message, error); // Terminus expects a two-argument logger, so we normalize the signature here.
};

/**
 * Increment request counters with latency tracking and error awareness.
 *
 * @param {number} responseTime - Total time spent processing the request in milliseconds.
 * @param {boolean} [isError=false] - Whether the request resulted in an error to track failure rate.
 * @returns {void}
 */
const updateMetrics = (responseTime: number, isError = false): void => {
  totalRequests += 1; // Preserve total request volume for rate calculations.
  totalResponseTime += responseTime; // Maintain a cumulative latency sum for averaging.
  if (isError) {
    totalErrors += 1; // Only bump the error counter when the caller reports a fault.
  }
};

/**
 * Signal that a new request is being processed to update concurrency telemetry.
 *
 * @returns {void}
 */
const incrementActiveRequests = (): void => {
  activeRequests += 1; // Active request count grows when work starts to expose load to monitors.
};

/**
 * Signal that a request finished processing to update concurrency telemetry.
 *
 * @returns {void}
 */
const decrementActiveRequests = (): void => {
  activeRequests = Math.max(0, activeRequests - 1); // Guard against counter underflow if hooks run out of order.
};

/**
 * Collect process and system-level memory data.
 *
 * @returns {DetailedMemoryUsage} Memory usage statistics enriched with system metrics.
 */
const getMemoryUsage = (): DetailedMemoryUsage => {
  const memUsage = process.memoryUsage(); // Node exposes process heap and RSS values for precise monitoring.
  const totalMem = totalmem(); // Capture total system memory to contextualize usage.
  const freeMem = freemem(); // Capture free system memory for availability insights.

  return {
    rss: memUsage.rss,
    heapTotal: memUsage.heapTotal,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
    systemTotal: totalMem,
    systemFree: freeMem,
    systemUsed: totalMem - freeMem,
    systemUsagePercent: totalMem > 0 ? (((totalMem - freeMem) / totalMem) * 100).toFixed(2) : '0.00', // Protect against division by zero on minimal environments.
  };
};

/**
 * Collect CPU model and load information.
 *
 * @returns {CpuUsageMetrics} CPU usage statistics across load averages.
 */
const getCpuUsage = (): CpuUsageMetrics => {
  const cpuInfo = getCpuInfo(); // CPU metadata includes per-core model and speed details.
  const loadAvg = getLoadAverage(); // Load averages provide OS-level pressure indicators.

  return {
    model: cpuInfo.length > 0 ? cpuInfo[0]?.model ?? 'unknown' : 'unknown', // Fallback protects exotic hardware where model is omitted.
    speed: cpuInfo.length > 0 ? cpuInfo[0]?.speed ?? 0 : 0, // Avoid NaN when CPU data is unavailable.
    cores: cpuInfo.length, // Core count informs threshold calculations elsewhere.
    loadAverage: {
      '1min': loadAvg[0] ?? 0,
      '5min': loadAvg[1] ?? 0,
      '15min': loadAvg[2] ?? 0,
    },
  };
};

/**
 * Ensure the filesystem is reachable for application storage operations.
 *
 * @returns {Promise<FilesystemUsageResult>} Filesystem accessibility summary.
 */
const getFilesystemUsage = async (): Promise<FilesystemUsageResult> => {
  try {
    await stat('.'); // Touch the current working directory to confirm core file system access.
    return { status: 'pass', message: 'Filesystem accessible' }; // Healthy status when stat succeeds.
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown filesystem error'; // Normalize thrown values into actionable messages.
    return { status: 'fail', message: `Filesystem error: ${message}` }; // Flag the filesystem check when stat fails.
  }
};

/**
 * Derive aggregate request metrics that inform error rate and latency.
 *
 * @returns {RequestMetrics} Request statistics with averages and rates.
 */
const getRequestMetrics = (): RequestMetrics => {
  const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0; // Prevent division by zero before any traffic occurs.
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0; // Express error rate as a percentage for threshold comparisons.

  return {
    totalRequests,
    totalErrors,
    activeRequests,
    averageResponseTime: parseFloat(avgResponseTime.toFixed(2)), // Clamp decimals for stable telemetry formatting.
    errorRate: parseFloat(errorRate.toFixed(2)), // Clamp decimals for stable telemetry formatting.
  };
};

/**
 * Compute the full health status, aggregating resource and request metrics.
 *
 * @returns {Promise<HealthCheckResult>} Consolidated health assessment with per-check details.
 */
const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const memUsage = getMemoryUsage(); // Capture memory telemetry up-front to reuse across checks.
  const cpuUsage = getCpuUsage(); // Capture CPU telemetry once per health cycle for consistency.
  const fsUsage = await getFilesystemUsage(); // Probe filesystem readiness before returning status.
  const requestMetrics = getRequestMetrics(); // Fetch live request counters to evaluate failure rates.

  const memoryUsagePercent = parseFloat(memUsage.systemUsagePercent); // Convert the formatted string back to a float for comparisons.
  const load1Min = cpuUsage.loadAverage['1min']; // One-minute load average reacts fastest to spikes.
  const errorRate = requestMetrics.errorRate; // Percent error rate drives readiness decisions.

  let overallStatus: HealthCheckStatus = 'pass'; // Default to healthy until evidence shows degradation.
  const checks: HealthCheckDetail[] = []; // Collect per-check diagnostics for downstream observers.
  let hasFailed = false; // Track if any critical check already failed so warnings do not downgrade status prematurely.

  if (memoryUsagePercent > 90) {
    overallStatus = 'fail'; // Hard fail when memory pressure is critical.
    hasFailed = true;
    checks.push({ name: 'memory', status: 'fail', message: `Memory usage: ${memoryUsagePercent}%` });
  } else if (memoryUsagePercent > 75) {
    if (!hasFailed) {
      overallStatus = 'warn'; // Only downgrade to warn when no fail has been recorded yet.
    }
    checks.push({ name: 'memory', status: 'warn', message: `Memory usage: ${memoryUsagePercent}%` });
  } else {
    checks.push({ name: 'memory', status: 'pass', message: `Memory usage: ${memoryUsagePercent}%` });
  }

  if (load1Min > cpuUsage.cores * 2) {
    overallStatus = 'fail'; // Load higher than double the core count indicates saturation.
    checks.push({ name: 'cpu', status: 'fail', message: `Load average: ${load1Min.toFixed(2)}` });
  } else if (load1Min > cpuUsage.cores) {
    overallStatus = overallStatus === 'fail' ? 'fail' : 'warn'; // Preserve fail precedence if already triggered elsewhere.
    checks.push({ name: 'cpu', status: 'warn', message: `Load average: ${load1Min.toFixed(2)}` });
  } else {
    checks.push({ name: 'cpu', status: 'pass', message: `Load average: ${load1Min.toFixed(2)}` });
  }

  checks.push({ name: 'filesystem', status: fsUsage.status, message: fsUsage.message }); // Surface filesystem health for consumers.
  if (fsUsage.status === 'fail') {
    overallStatus = 'fail'; // Filesystem failure compromises service availability.
    hasFailed = true;
  }

  if (errorRate > 50) {
    overallStatus = 'fail'; // Error rate above fifty percent marks the service unhealthy.
    checks.push({ name: 'error_rate', status: 'fail', message: `Error rate: ${errorRate}%` });
  } else if (errorRate > 10) {
    if (!hasFailed) {
      overallStatus = 'warn'; // Escalate to warn only if no other fatal failures were observed.
    }
    checks.push({ name: 'error_rate', status: 'warn', message: `Error rate: ${errorRate}%` });
  } else {
    checks.push({ name: 'error_rate', status: 'pass', message: `Error rate: ${errorRate}%` });
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(), // Timestamp allows external monitors to assess data freshness.
    uptime: process.uptime(), // Node uptime in seconds communicates process age to orchestrators.
    checks,
    metrics: {
      memory: memUsage,
      cpu: cpuUsage,
      requests: requestMetrics,
    },
  };
};

/**
 * Produce a liveness probe handler suitable for Kubernetes integration.
 *
 * @returns {HealthEndpointHandler} Function resolving when the service is alive.
 */
const createLivenessCheck = (): HealthEndpointHandler => {
  return async () => {
    const health = await performHealthCheck(); // Reuse the comprehensive health assessment to honour consistent thresholds.

    if (health.status === 'fail' && health.checks.some((check) => check.name === 'filesystem' && check.status === 'fail')) {
      throw new Error('Application is not in a recoverable state'); // Filesystem failure is irrecoverable without restart, so instruct orchestration to restart.
    }

    return {
      status: 'ok',
      timestamp: health.timestamp,
      uptime: health.uptime,
    };
  };
};

/**
 * Produce a readiness probe handler signalling traffic readiness.
 *
 * @returns {HealthEndpointHandler} Function resolving when the service can accept requests.
 */
const createReadinessCheck = (): HealthEndpointHandler => {
  return async () => {
    const health = await performHealthCheck(); // Re-run checks to ensure readiness reflects current pressure.

    if (health.status === 'fail') {
      throw new Error('Application is not ready to serve traffic'); // Propagate failure to upstream load balancers.
    }

    const hasCriticalWarning = health.status === 'warn' && health.checks.some((check) => {
      if (check.name === 'memory') {
        const usageMatch = check.message.match(/\d+(\.\d+)?/); // Extract the numeric portion from the formatted message.
        return usageMatch !== null && parseFloat(usageMatch[0]) > 85; // High warning memory usage delays readiness.
      }
      if (check.name === 'error_rate') {
        const errorMatch = check.message.match(/\d+(\.\d+)?/);
        return errorMatch !== null && parseFloat(errorMatch[0]) > 20; // Elevated error rates block readiness.
      }
      return false;
    });

    if (hasCriticalWarning) {
      throw new Error('Application is degraded and not ready for full traffic'); // Signal partial degradation to orchestrators.
    }

    return {
      status: 'ok',
      timestamp: health.timestamp,
      uptime: health.uptime,
    };
  };
};

/**
 * Adapt an internal health evaluator to the signature terminus expects.
 *
 * @param {() => Promise<T>} evaluator - Health evaluator that does not need terminus state.
 * @returns {({ state }: { state: TerminusState }) => Promise<T>} Terminus-compatible evaluator.
 */
const adaptTerminusCheck = <T>(evaluator: () => Promise<T>): ((context: { state: TerminusState }) => Promise<T>) => {
  return async () => evaluator(); // Terminus passes state we do not need, so we intentionally ignore it.
};

/**
 * Health check exposed directly to terminus for aggregated reporting.
 *
 * @returns {Promise<HealthCheckResult>} Fails when health is not pass or warn.
 */
const healthCheck = async (): Promise<HealthCheckResult> => {
  const health = await performHealthCheck(); // Evaluate health once so aggregated results stay consistent.
  if (health.status === 'fail') {
    throw new Error('Health check failed'); // Terminus expects thrown errors to mark failures.
  }
  return health;
};

/**
 * Build a graceful shutdown hook compatible with terminus.
 *
 * @param {(() => void | Promise<void>) | undefined} onSignal - Optional caller hook for cleanup.
 * @returns {() => Promise<void>} Terminus onSignal handler.
 */
const createOnSignal = (onSignal?: () => void | Promise<void>): (() => Promise<void>) => {
  return async () => {
    console.log('Received signal, starting graceful shutdown...'); // Provide context for operational logs.
    if (typeof onSignal === 'function') {
      await onSignal(); // Await to ensure cleanup completes before terminating connections.
    }
    console.log('Graceful shutdown completed'); // Confirm shutdown finished for traceability.
  };
};

/**
 * Register health, liveness, and readiness endpoints on a server using terminus.
 *
 * @param {Server} server - HTTP server instance obtained from Express or similar frameworks.
 * @param {HealthCheckOptions} [options={}] - Terminus configuration overrides for timeouts and logging.
 * @returns {Server} The same server instance so callers can continue chaining.
 */
const setupHealthChecks = <T extends Server>(server: T, options: HealthCheckOptions = {}): T => {
  const terminusOptions: TerminusOptions & { interval?: number } = {
    healthChecks: {
      '/health': adaptTerminusCheck(healthCheck),
      '/live': adaptTerminusCheck(createLivenessCheck()),
      '/ready': adaptTerminusCheck(createReadinessCheck()),
    },
    onSignal: createOnSignal(options.onSignal),
    logger: toTerminusLogger(options.logger ?? defaultLogger),
  };

  terminusOptions.timeout = options.timeout ?? 5000; // Default to a five-second timeout to balance responsiveness and stability.
  if (options.beforeShutdown !== undefined) {
    terminusOptions.beforeShutdown = options.beforeShutdown; // Allow optional delay before shutdown completes.
  }
  if (options.onShutdown !== undefined) {
    terminusOptions.onShutdown = options.onShutdown; // Surface caller-provided shutdown hook to terminus.
  }
  if (options.caseInsensitive !== undefined) {
    terminusOptions.caseInsensitive = options.caseInsensitive; // Preserve caller preference for case-insensitive routing.
  }
  if (options.signal !== undefined) {
    terminusOptions.signal = options.signal; // Allow overriding the default termination signal.
  }
  if (options.signals !== undefined) {
    terminusOptions.signals = options.signals; // Allow multiple termination signals.
  }
  if (options.sendFailuresDuringShutdown !== undefined) {
    terminusOptions.sendFailuresDuringShutdown = options.sendFailuresDuringShutdown; // Maintain compatibility with custom failure delivery preferences.
  }
  if (options.statusOk !== undefined) {
    terminusOptions.statusOk = options.statusOk; // Allow customizing the HTTP status for successful probes.
  }
  if (options.statusOkResponse !== undefined) {
    terminusOptions.statusOkResponse = options.statusOkResponse; // Allow customizing the payload for successful probes.
  }
  if (options.statusError !== undefined) {
    terminusOptions.statusError = options.statusError; // Allow customizing the HTTP status for failed probes.
  }
  if (options.statusErrorResponse !== undefined) {
    terminusOptions.statusErrorResponse = options.statusErrorResponse; // Allow customizing the payload for failed probes.
  }
  if (options.useExit0 !== undefined) {
    terminusOptions.useExit0 = options.useExit0; // Support exit code overrides for specialised deployments.
  }
  if (options.onSendFailureDuringShutdown !== undefined) {
    terminusOptions.onSendFailureDuringShutdown = options.onSendFailureDuringShutdown; // Adopt optional callback for send failures during shutdown.
  }
  if (options.headers !== undefined) {
    terminusOptions.headers = options.headers; // Pass through custom headers if requested.
  }
  if (options.interval !== undefined) {
    terminusOptions.interval = options.interval; // Store interval for compatibility with legacy callers relying on this property.
  }

  createTerminus(server, terminusOptions); // Terminus mutates the server with the configured endpoints.
  return server; // Return server for chaining, aligning with Terminus's documented behaviour.
};

/**
 * Express-compatible health endpoint for legacy integrations.
 *
 * @param {Request} _req - Express request object (unused because health is global).
 * @param {Response} res - Express response instance used to emit JSON payloads.
 * @returns {void}
 */
const createHealthEndpoint = (_req: Request, res: Response): void => {
  void performHealthCheck()
    .then((health) => {
      const statusCode = health.status === 'pass' ? 200 : health.status === 'warn' ? 200 : 503; // Warn still returns 200 to keep load balancers satisfied.
      res.status(statusCode).json(health); // Return the full health payload for compatibility.
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Health check execution failed'; // Normalize unexpected rejection reasons.
      res.status(503).json({ status: 'error', message }); // Preserve legacy error contract.
    });
};

/**
 * Express-compatible liveness endpoint for legacy integrations.
 *
 * @param {Request} _req - Express request object (unused because the check is global).
 * @param {Response} res - Express response instance used to emit JSON payloads.
 * @returns {void}
 */
const createLivenessEndpoint = (_req: Request, res: Response): void => {
  void createLivenessCheck()()
    .then((result) => res.json(result)) // Success returns the liveness payload unchanged.
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Liveness check failed unexpectedly'; // Ensure message is user-readable even for unknown errors.
      res.status(503).json({ status: 'error', message }); // Preserve HTTP 503 to align with Kubernetes expectations.
    });
};

/**
 * Express-compatible readiness endpoint for legacy integrations.
 *
 * @param {Request} _req - Express request object (unused because readiness is global).
 * @param {Response} res - Express response instance used to emit JSON payloads.
 * @returns {void}
 */
const createReadinessEndpoint = (_req: Request, res: Response): void => {
  void createReadinessCheck()()
    .then((result) => res.json(result)) // Provide readiness payload directly to consumers.
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Readiness check failed unexpectedly'; // Translate thrown values to strings safely.
      res.status(503).json({ status: 'error', message }); // Maintain consistent status code with standard readiness contracts.
    });
};

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
  createHealthEndpoint,
  createLivenessEndpoint,
  createReadinessEndpoint,
};
