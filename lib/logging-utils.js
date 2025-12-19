/**
 * Enhanced Logging Utility Functions - qerrors Integration
 *
 * This module consolidates logging functionality using qerrors directly,
 * eliminating code duplication while maintaining backward compatibility.
 *
 * Enhanced features through qerrors:
 * - AI-powered error analysis and debugging suggestions
 * - Advanced performance monitoring with automatic timing
 * - Request correlation and debugging with unique IDs
 * - Security-aware sanitization with custom patterns
 * - Structured logging with comprehensive metadata
 * - Multiple log levels with appropriate routing
 * - Queue management for high-traffic scenarios
 */
// Direct imports from qerrors
import * as qerrors from 'qerrors';
// Extract functions from qerrors
const { 
// Enhanced Logging System
logDebug, logInfo, logWarn, logError, logFatal, logAudit, logger, 
// Performance Monitoring
createPerformanceTimer, 
// Data Security & Sanitization
sanitizeMessage, sanitizeContext, addCustomSanitizationPattern, sanitizeWithCustomPatterns, clearCustomSanitizationPatterns, 
// Error Handling
createTypedError, ErrorTypes, ErrorSeverity, ErrorFactory, handleControllerError, withErrorHandling, 
// Utility Functions
generateUniqueId, createTimer, deepClone, safeRun, verboseLog, 
// Configuration & Environment
getEnv, getInt, getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars, 
// Simple Logger
simpleLogger, createSimpleWinstonLogger, LOG_LEVELS } = qerrors;
/**
 * Enhanced function entry logging with performance monitoring
 */
export const logFunctionEntry = (functionName, params = {}, options = {}) => {
    try {
        // Generate unique request ID if not provided
        const requestId = options.requestId || generateUniqueId();
        // Create performance timer for automatic monitoring
        const timer = createPerformanceTimer(functionName);
        // Create enhanced log entry with comprehensive metadata
        const logEntry = {
            functionName,
            requestId,
            timestamp: new Date().toISOString(),
            params: sanitizeContext(params), // Use qerrors sanitization
            userId: options.userId,
            metadata: options.metadata || {}
        };
        // Log with enhanced debugging information
        logDebug(`Function entry: ${functionName}`, logEntry);
        // Return timer and context for performance tracking
        return {
            timer,
            requestId,
            functionName,
            startTime: Date.now()
        };
    }
    catch (error) {
        // Fallback logging if enhanced logging fails
        console.error(`[LOGGING_ERROR] Failed to log function entry for ${functionName}:`, error.message);
        return {
            timer: createTimer(),
            requestId: generateUniqueId(),
            functionName,
            startTime: Date.now()
        };
    }
};
/**
 * Enhanced function exit logging with performance metrics
 */
export const logFunctionExit = (functionName, result, context = {}, options = {}) => {
    try {
        // Calculate performance metrics
        const endTime = Date.now();
        const duration = context.startTime ? endTime - context.startTime : 0;
        // Create enhanced log entry with performance metrics
        const logEntry = {
            functionName,
            requestId: context.requestId,
            timestamp: new Date().toISOString(),
            result: sanitizeContext(result), // Use qerrors sanitization
            duration: `${duration}ms`,
            performance: {
                startTime: context.startTime,
                endTime,
                duration
            },
            success: true,
            metadata: options.metadata || {}
        };
        // End performance timer if available
        if (context.timer && typeof context.timer === 'function') {
            context.timer(true); // Mark as successful completion
        }
        // Log with enhanced performance information
        logInfo(`Function exit: ${functionName}`, logEntry);
        // Return performance metrics for monitoring
        return {
            duration,
            success: true,
            requestId: context.requestId || 'unknown',
            performance: logEntry.performance
        };
    }
    catch (error) {
        // Fallback logging if enhanced logging fails
        console.error(`[LOGGING_ERROR] Failed to log function exit for ${functionName}:`, error.message);
        return {
            duration: 0,
            success: true,
            requestId: context.requestId || 'unknown',
            performance: null
        };
    }
};
/**
 * Enhanced function error logging with comprehensive analysis
 */
export const logFunctionError = (functionName, error, context = {}, options = {}) => {
    try {
        // Calculate performance metrics even for errors
        const endTime = Date.now();
        const duration = context.startTime ? endTime - context.startTime : 0;
        // Create enhanced error context with sanitization
        const errorContext = {
            functionName,
            requestId: context.requestId,
            timestamp: new Date().toISOString(),
            error: {
                name: error.name,
                message: sanitizeMessage(error.message, 'Error occurred'),
                stack: error.stack,
                code: error.code,
                statusCode: error.statusCode
            },
            duration: `${duration}ms`,
            performance: {
                startTime: context.startTime,
                endTime,
                duration
            },
            success: false,
            additionalContext: sanitizeContext(options.additionalContext || {}),
            metadata: options.metadata || {}
        };
        // End performance timer if available
        if (context.timer && typeof context.timer === 'function') {
            context.timer(false); // Mark as failure completion
        }
        // Use enhanced error logging with qerrors (includes AI analysis if configured)
        logError(`${functionName} failed`, errorContext);
        // Return error metrics for monitoring
        return {
            duration,
            success: false,
            requestId: context.requestId || 'unknown',
            error: errorContext.error,
            performance: errorContext.performance
        };
    }
    catch (loggingError) {
        // Last resort fallback logging
        console.error(`[LOGGING_ERROR] Failed to log function error for ${functionName}:`, loggingError.message);
        console.error(`[ORIGINAL_ERROR] ${functionName} error:`, error.message);
        return {
            duration: 0,
            success: false,
            requestId: context.requestId || 'unknown',
            error: { message: error.message, name: error.name },
            performance: null
        };
    }
};
/**
 * Enhanced audit logging for security and compliance
 */
export const logAuditEvent = (action, context = {}, options = {}) => {
    try {
        // Create comprehensive audit entry
        const auditEntry = {
            action,
            timestamp: new Date().toISOString(),
            userId: context.userId,
            sessionId: context.sessionId,
            requestId: context.requestId || generateUniqueId(),
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            resource: context.resource,
            result: context.result,
            risk: options.risk || 'low',
            category: options.category || 'general',
            metadata: options.metadata || {}
        };
        // Log with audit level for compliance tracking
        logAudit(`AUDIT: ${action}`, auditEntry);
        return auditEntry;
    }
    catch (error) {
        // Fallback audit logging
        console.error(`[AUDIT_ERROR] Failed to log audit event for ${action}:`, error.message);
        return null;
    }
};
/**
 * Performance monitoring helper for critical operations
 */
export const monitorPerformance = async (operationName, operation, options = {}) => {
    const startTime = Date.now();
    try {
        // Execute operation directly (async-safe)
        const result = typeof operation === 'function' ? await operation() : operation;
        const duration = Date.now() - startTime;
        const threshold = options.threshold || 1000; // Default 1 second threshold
        // Log performance information with qerrors
        if (duration > threshold) {
            logWarn(`Performance warning: ${operationName} exceeded threshold`, {
                operation: operationName,
                duration: `${duration}ms`,
                threshold: `${threshold}ms`,
                exceeded: true
            });
        }
        else {
            logDebug(`Performance: ${operationName} completed`, {
                operation: operationName,
                duration: `${duration}ms`,
                threshold: `${threshold}ms`,
                exceeded: false
            });
        }
        return {
            result,
            performance: {
                operation: operationName,
                duration,
                threshold,
                exceeded: duration > threshold
            }
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        // Log performance error with qerrors
        logError(`Performance error: ${operationName} failed`, {
            operation: operationName,
            duration: `${duration}ms`,
            error: error.message
        });
        throw error;
    }
};
// Export enhanced logging utilities with qerrors integration
// Direct access to qerrors logging capabilities
export { logger } from 'qerrors';
export { logDebug, logInfo, logWarn, logError, logFatal, logAudit } from 'qerrors';
// qerrors Performance Monitoring
export { createPerformanceTimer } from 'qerrors';
// qerrors Data Security & Sanitization
export { sanitizeMessage, sanitizeContext, addCustomSanitizationPattern, sanitizeWithCustomPatterns, clearCustomSanitizationPatterns } from 'qerrors';
// qerrors Utility Functions
export { generateUniqueId, createTimer, deepClone, safeRun, verboseLog } from 'qerrors';
// qerrors Error Handling
export { createTypedError, ErrorTypes, ErrorSeverity, ErrorFactory, handleControllerError, withErrorHandling } from 'qerrors';
// qerrors Configuration & Environment
export { getEnv, getInt, getMissingEnvVars, throwIfMissingEnvVars, warnIfMissingEnvVars } from 'qerrors';
// qerrors Simple Logger
export { simpleLogger, createSimpleWinstonLogger, LOG_LEVELS } from 'qerrors';
// Backward compatibility aliases
export const logEntry = logFunctionEntry;
export const logExit = logFunctionExit;
