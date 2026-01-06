/**
 * Enhanced Logging Utility Functions - qerrors Integration
 * Provides structured logging, audit logging, and performance monitoring helpers.
 */
import {
  logger,
  createTypedError,
  ErrorTypes,
  sanitizeMessage,
  sanitizeContext,
  generateUniqueId,
} from './simple-wrapper.js';
import { getTimestamp } from './common-patterns.js';

// Minimal implementations for missing functions
function logDebug(message: string, meta?: any): void {
  if (logger?.logDebug) logger.logDebug(message, meta);
  else console.log(`DEBUG: ${message}`, meta);
}

function logInfo(message: string, meta?: any): void {
  if (logger?.info) logger.info(message, meta);
  else console.log(`INFO: ${message}`, meta);
}

function logWarn(message: string, meta?: any): void {
  if (logger?.warn) logger.warn(message, meta);
  else console.warn(`WARN: ${message}`, meta);
}

function logError(message: string, meta?: any): void {
  if (logger?.error) logger.error(message, meta);
  else console.error(`ERROR: ${message}`, meta);
}

function logFatal(message: string, meta?: any): void {
  if (logger?.logFatal) logger.logFatal(message, meta);
  else console.error(`FATAL: ${message}`, meta);
}

function logAudit(message: string, meta?: any): void {
  if (logger?.logAudit) logger.logAudit(message, meta);
  else console.log(`AUDIT: ${message}`, meta);
}

function createTimer(label?: string): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

function createPerformanceTimer(label: string): (success?: boolean) => void {
  const start = Date.now();
  return (success = true) => {
    const duration = Date.now() - start;
    logDebug(`Performance: ${label} took ${duration}ms`, { success, duration });
  };
}

export const logFunctionStart = (
  functionName: string,
  params: Record<string, unknown> = {},
  options: LogOptions = {}
): void => {
  if (shouldLogToConsole()) {
    console.log(`→ START ${functionName}`, { params, ...options });
  } else {
    logEntry(functionName, { event: 'start', params, ...options });
  }
};

// Additional stub functions
function addCustomSanitizationPattern(): void {}
function sanitizeWithCustomPatterns(data: any): any {
  return data;
}
function clearCustomSanitizationPatterns(): void {}
function deepClone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}
function safeRun(fn: () => any): any {
  try {
    return fn();
  } catch (e) {
    return null;
  }
}
function verboseLog(message: string): void {
  console.log(message);
}
const ErrorSeverity: Record<string, string> = {};
function handleControllerError(error: Error): void {
  logError(error.message);
}
function withErrorHandling(fn: () => any): any {
  try {
    return fn();
  } catch (e) {
    logError(e.message);
    return null;
  }
}
function getEnv(key: string): string | undefined {
  return process.env[key];
}
function getInt(key: string): number {
  return parseInt(process.env[key] || '0');
}
function getMissingEnvVars(keys: string[]): string[] {
  return keys.filter(key => !process.env[key]);
}
function throwIfMissingEnvVars(keys: string[]): void {
  const missing = getMissingEnvVars(keys);
  if (missing.length > 0) throw new Error(`Missing env vars: ${missing.join(', ')}`);
}
function warnIfMissingEnvVars(keys: string[]): void {
  const missing = getMissingEnvVars(keys);
  if (missing.length > 0) logWarn(`Missing env vars: ${missing.join(', ')}`);
}
const simpleLogger = logger;
function createSimpleWinstonLogger() {
  return logger;
}
const LOG_LEVELS = { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' };

/**
 * Context captured when a function begins execution.
 */
export interface LogEntryContext {
  timer?: (success?: boolean) => void;
  requestId?: string;
  functionName?: string;
  startTime?: number;
}

/**
 * Optional metadata for structured logging.
 */
export interface LogOptions {
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  additionalContext?: Record<string, unknown>;
}

/**
 * Context payload for audit logging.
 */
export interface AuditContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  result?: unknown;
}

/**
 * Optional metadata for audit logging.
 */
export interface AuditOptions {
  risk?: 'low' | 'medium' | 'high';
  category?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Options for performance monitoring helpers.
 */
export interface PerformanceOptions {
  threshold?: number;
}

/**
 * Result returned from performance monitored operations.
 */
export interface PerformanceResult<T = unknown> {
  result: T;
  performance: {
    operation: string;
    duration: number;
    threshold: number;
    exceeded: boolean;
  };
}

/**
 * Formats parameters for console logging so existing tests retain expected output.
 */
const formatParamsForConsole = (params?: Record<string, unknown>): string => {
  if (!params || Object.keys(params).length === 0) return '';
  return Object.entries(params)
    .map(([key, value]) => {
      if (typeof value === 'object' && value !== null) return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${String(value)}`;
    })
    .join(', ');
};

/**
 * Formats a return value for human readable console output.
 */
const formatResultForConsole = (result: unknown): string => {
  if (typeof result === 'object') {
    if (result === null) return 'null';
    return JSON.stringify(result, null, 2);
  }
  return String(result);
};

/**
 * Detects whether verbose console logging should run.
 */
const shouldLogToConsole = (): boolean => process.env.NODE_ENV === 'development';

/**
 * Generates log entry metadata and triggers debug logging when a function starts.
 *
 * @param functionName - Identifier for the executing function.
 * @param params - Parameters supplied to the function.
 * @param options - Additional request metadata to enrich the log.
 * @returns Captured timing context for later exit/error logging.
 */
export const logFunctionEntry = (
  functionName: string,
  params: Record<string, unknown> = {},
  options: LogOptions = {}
): LogEntryContext => {
  try {
    const requestId = options.requestId ?? generateUniqueId();
    const timer = createPerformanceTimer(functionName);
    const sanitizedParams = sanitizeContext(params);

    logDebug(`Function entry: ${functionName}`, {
      functionName,
      requestId,
      timestamp: getTimestamp(),
      params: sanitizedParams,
      userId: options.userId,
      metadata: options.metadata ?? {},
    });

    if (shouldLogToConsole()) {
      const formattedParams = formatParamsForConsole(params);
      console.log(`[DEBUG] ${functionName} started with ${formattedParams}`);
    }

    return {
      timer,
      requestId,
      functionName,
      startTime: Date.now(),
    };
  } catch (error) {
    const fallbackRequestId = options.requestId ?? generateUniqueId();
    console.error(
      `[LOGGING_ERROR] Failed to log function entry for ${functionName}:`,
      error instanceof Error ? error.message : error
    );
    return {
      timer: createTimer(),
      requestId: fallbackRequestId,
      functionName,
      startTime: Date.now(),
    };
  }
};

/**
 * Logs successful function completion, emitting both structured and console logs.
 *
 * @param functionName - Identifier for the executed function.
 * @param result - Return payload from the function.
 * @param context - Context previously returned by logFunctionEntry.
 * @param options - Additional metadata for audit and correlation.
 * @returns Structured summary of execution with performance metrics.
 */
export const logFunctionExit = (
  functionName: string,
  result: unknown,
  context: LogEntryContext = {},
  options: LogOptions = {}
): {
  duration: number;
  success: boolean;
  requestId: string;
  performance: {
    startTime: number | undefined;
    endTime: number;
    duration: number;
  } | null;
} => {
  const endTime = Date.now();
  const duration = context.startTime ? endTime - context.startTime : 0;
  const requestId = context.requestId ?? options.requestId ?? 'unknown';

  try {
    const performance =
      context.startTime !== undefined
        ? {
            startTime: context.startTime,
            endTime,
            duration,
          }
        : null;

    const sanitizedResult = sanitizeContext(result);

    logInfo(`Function exit: ${functionName}`, {
      functionName,
      requestId,
      timestamp: getTimestamp(),
      result: sanitizedResult,
      duration: `${duration}ms`,
      performance,
      success: true,
      metadata: options.metadata ?? {},
    });

    if (context.timer) {
      context.timer(true);
    }

    if (shouldLogToConsole()) {
      console.log(
        `[DEBUG] ${functionName} completed with result: ${formatResultForConsole(result)}`
      );
    }

    return {
      duration,
      success: true,
      requestId,
      performance,
    };
  } catch (error) {
    console.error(
      `[LOGGING_ERROR] Failed to log function exit for ${functionName}:`,
      error instanceof Error ? error.message : error
    );
    return {
      duration,
      success: true,
      requestId,
      performance: null,
    };
  }
};

/**
 * Logs function failures with enriched error context and performance metrics.
 *
 * @param functionName - Identifier for the failing function.
 * @param error - Error thrown during execution.
 * @param context - Context previously returned by logFunctionEntry.
 * @param options - Additional metadata for debugging and tracing.
 * @returns Structured summary of the failure.
 */
export const logFunctionError = (
  functionName: string,
  error: Error,
  context: LogEntryContext = {},
  options: LogOptions = {}
): {
  duration: number;
  success: boolean;
  requestId: string;
  error: {
    name: string;
    message: string;
    stack: string | undefined;
    code?: unknown;
    statusCode?: unknown;
  };
  performance: {
    startTime: number | undefined;
    endTime: number;
    duration: number;
  } | null;
} => {
  const endTime = Date.now();
  const duration = context.startTime ? endTime - context.startTime : 0;
  const requestId = context.requestId ?? options.requestId ?? generateUniqueId();

  try {
    const sanitizedMessage = sanitizeMessage(error.message);
    const performance =
      context.startTime !== undefined
        ? {
            startTime: context.startTime,
            endTime,
            duration,
          }
        : null;

    const errorContext = {
      functionName,
      requestId,
      timestamp: getTimestamp(),
      error: {
        name: error.name,
        message: sanitizedMessage,
        stack: error.stack,
        code: (error as unknown as Record<string, unknown>).code,
        statusCode: (error as unknown as Record<string, unknown>).statusCode,
      },
      duration: `${duration}ms`,
      performance,
      success: false,
      additionalContext: sanitizeContext(options.additionalContext ?? {}),
      metadata: options.metadata ?? {},
    };

    logError(`${functionName} failed`, errorContext);

    if (context.timer) {
      context.timer(false);
    }

    console.error(`[ERROR] ${functionName} failed:`, {
      message: sanitizedMessage,
      stack: error.stack,
      name: error.name,
      timestamp: getTimestamp(),
    });

    return {
      duration,
      success: false,
      requestId,
      error: errorContext.error,
      performance,
    };
  } catch (loggingError) {
    console.error(
      `[LOGGING_ERROR] Failed to log function error for ${functionName}:`,
      loggingError instanceof Error ? loggingError.message : loggingError
    );
    console.error(`[ORIGINAL_ERROR] ${functionName} error:`, error.message);
    return {
      duration,
      success: false,
      requestId,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      performance: null,
    };
  }
};

/**
 * Logs audit events for compliance tracking and returns the captured entry.
 *
 * @param action - Description of the audited action.
 * @param context - Context about the actor and target resource.
 * @param options - Additional audit metadata like risk category.
 * @returns Persistable audit record when logging succeeds.
 */
export const logAuditEvent = (
  action: string,
  context: AuditContext = {},
  options: AuditOptions = {}
):
  | (AuditContext & {
      action: string;
      timestamp: string;
      risk: AuditOptions['risk'];
      category: string;
      metadata: Record<string, unknown>;
      result: unknown;
    })
  | null => {
  try {
    const auditEntry = {
      action,
      timestamp: getTimestamp(),
      userId: context.userId,
      sessionId: context.sessionId,
      requestId: context.requestId ?? generateUniqueId(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      resource: context.resource,
      result: context.result,
      risk: options.risk ?? 'low',
      category: options.category ?? 'general',
      metadata: options.metadata ?? {},
    };

    logAudit(`AUDIT: ${action}`, auditEntry);
    return auditEntry;
  } catch (error) {
    console.error(
      `[AUDIT_ERROR] Failed to log audit event for ${action}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
};

/**
 * Measures operation duration and emits warnings when thresholds are exceeded.
 *
 * @param operationName - Human readable description of the operation.
 * @param operation - Function or promise to execute and monitor.
 * @param options - Performance threshold configuration.
 * @returns Operation result along with timing metadata.
 */
export const monitorPerformance = async <T>(
  operationName: string,
  operation: (() => Promise<T> | T) | Promise<T> | T,
  options: PerformanceOptions = {}
): Promise<PerformanceResult<T>> => {
  const startTime = Date.now();
  try {
    const result =
      typeof operation === 'function'
        ? await (operation as () => Promise<T> | T)()
        : await Promise.resolve(operation as Promise<T> | T);

    const duration = Date.now() - startTime;
    const threshold = options.threshold ?? 1000;
    const exceeded = duration > threshold;

    const logPayload = {
      operation: operationName,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      exceeded,
    };

    if (exceeded) {
      logWarn(`Performance warning: ${operationName} exceeded threshold`, logPayload);
    } else {
      logDebug(`Performance: ${operationName} completed`, logPayload);
    }

    return {
      result,
      performance: {
        operation: operationName,
        duration,
        threshold,
        exceeded,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`Performance error: ${operationName} failed`, {
      operation: operationName,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
};

/**
 * Convenience alias preserving legacy naming while using enhanced entry logging.
 */
export const logEntry = (
  functionName: string,
  params: Record<string, unknown> = {},
  options: LogOptions = {}
): LogEntryContext => logFunctionEntry(functionName, params, options);

/**
 * Convenience alias preserving legacy naming while using enhanced exit logging.
 */
export const logExit = (
  functionName: string,
  result: unknown,
  context: LogEntryContext = {},
  options: LogOptions = {}
) => logFunctionExit(functionName, result, context, options);

export {
  logger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal,
  logAudit,
  createPerformanceTimer,
  sanitizeMessage,
  sanitizeContext,
  addCustomSanitizationPattern,
  sanitizeWithCustomPatterns,
  clearCustomSanitizationPatterns,
  generateUniqueId,
  createTimer,
  deepClone,
  safeRun,
  verboseLog,
  createTypedError,
  ErrorTypes,
  ErrorSeverity,
  handleControllerError,
  withErrorHandling,
  getEnv,
  getInt,
  getMissingEnvVars,
  throwIfMissingEnvVars,
  warnIfMissingEnvVars,
  simpleLogger,
  createSimpleWinstonLogger,
  LOG_LEVELS,
};
