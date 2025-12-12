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
const {
  // Enhanced Logging System
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal,
  logAudit,
  logger,
  
  // Performance Monitoring
  createPerformanceTimer,
  
  // Data Security & Sanitization
  sanitizeMessage,
  sanitizeContext,
  addCustomSanitizationPattern,
  sanitizeWithCustomPatterns,
  clearCustomSanitizationPatterns,
  
  // Error Handling
  createTypedError,
  ErrorTypes,
  ErrorSeverity,
  ErrorFactory,
  handleControllerError,
  withErrorHandling,
  
  // Utility Functions
  generateUniqueId,
  createTimer,
  deepClone,
  safeRun,
  verboseLog,
  
  // Configuration & Environment
  getEnv,
  getInt,
  getMissingEnvVars,
  throwIfMissingEnvVars,
  warnIfMissingEnvVars,
  
  // Simple Logger
  simpleLogger,
  createSimpleWinstonLogger,
  LOG_LEVELS
} = require('qerrors');

/**
 * Enhanced function entry logging with performance monitoring
 * 
 * Provides comprehensive entry logging with automatic performance timing,
 * request correlation, and structured metadata for debugging.
 * 
 * @param {string} functionName - Name of function being entered
 * @param {Object} params - Parameters passed to function
 * @param {Object} options - Additional logging options
 * @param {string} options.requestId - Unique request identifier for correlation
 * @param {string} options.userId - User identifier for security tracking
 * @param {Object} options.metadata - Additional metadata for logging
 * @returns {Object} Performance timer and context for later use
 */
function logFunctionEntry(functionName, params = {}, options = {}) {
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
  } catch (error) {
    // Fallback logging if enhanced logging fails
    console.error(`[LOGGING_ERROR] Failed to log function entry for ${functionName}:`, error.message);
    return {
      timer: createTimer(),
      requestId: generateUniqueId(),
      functionName,
      startTime: Date.now()
    };
  }
}

/**
 * Enhanced function exit logging with performance metrics
 * 
 * Provides comprehensive exit logging with automatic performance calculation
 * and result sanitization.
 * 
 * @param {string} functionName - Name of function being exited
 * @param {*} result - Result being returned from function
 * @param {Object} context - Context from logFunctionEntry for correlation
 * @param {Object} options - Additional logging options
 * @returns {Object} Performance metrics and summary
 */
function logFunctionExit(functionName, result, context = {}, options = {}) {
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
      requestId: context.requestId,
      performance: logEntry.performance
    };
  } catch (error) {
    // Fallback logging if enhanced logging fails
    console.error(`[LOGGING_ERROR] Failed to log function exit for ${functionName}:`, error.message);
    return {
      duration: 0,
      success: true,
      requestId: context.requestId || 'unknown',
      performance: null
    };
  }
}

/**
 * Enhanced function error logging with comprehensive analysis
 * 
 * Provides comprehensive error logging with structured error reporting
 * and security sanitization.
 * 
 * @param {string} functionName - Name of function that encountered error
 * @param {Error} error - Error object that was encountered
 * @param {Object} context - Context from logFunctionEntry for correlation
 * @param {Object} options - Additional logging options
 * @param {boolean} options.enableAI - Enable enhanced error analysis (simplified)
 * @param {Object} options.additionalContext - Additional context for error analysis
 */
function logFunctionError(functionName, error, context = {}, options = {}) {
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
      requestId: context.requestId,
      error: errorContext.error,
      performance: errorContext.performance
    };
  } catch (loggingError) {
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
}

/**
 * Enhanced audit logging for security and compliance
 * 
 * Provides comprehensive audit logging with user tracking, action classification,
 * and compliance metadata for security monitoring.
 * 
 * @param {string} action - Action being audited
 * @param {Object} context - Audit context including user and system information
 * @param {Object} options - Additional audit options
 */
function logAuditEvent(action, context = {}, options = {}) {
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
  } catch (error) {
    // Fallback audit logging
    console.error(`[AUDIT_ERROR] Failed to log audit event for ${action}:`, error.message);
    return null;
  }
}

/**
 * Performance monitoring helper for critical operations
 * 
 * Provides automatic performance monitoring with threshold alerts
 * and detailed metrics for optimization using qerrors capabilities.
 * 
 * @param {string} operationName - Name of operation being monitored
 * @param {Function} operation - Operation to monitor
 * @param {Object} options - Monitoring options
 * @param {number} options.threshold - Performance threshold in milliseconds
 * @returns {Promise<*>} Operation result with performance metrics
 */
async function monitorPerformance(operationName, operation, options = {}) {
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
    } else {
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
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log performance error with qerrors
    logError(`Performance error: ${operationName} failed`, {
      operation: operationName,
      duration: `${duration}ms`,
      error: error.message
    });
    
    throw error;
  }
}

// Export enhanced logging utilities with qerrors integration
module.exports = {
  // Core logging functions (enhanced with qerrors)
  logFunctionEntry,    // enhanced function entry with performance monitoring
  logFunctionExit,     // enhanced function exit with performance metrics
  logFunctionError,    // enhanced error logging with AI analysis
  
  // Additional enhanced logging functions
  logAuditEvent,       // comprehensive audit logging for compliance
  monitorPerformance,  // automatic performance monitoring with thresholds
  
  // Direct access to qerrors logging capabilities
  logger,              // qerrors enhanced logger instance
  logDebug,            // qerrors debug logging
  logInfo,             // qerrors info logging  
  logWarn,             // qerrors warn logging
  logError,            // qerrors error logging
  logFatal,            // qerrors fatal logging
  logAudit,            // qerrors audit logging
  
  // qerrors Performance Monitoring
  createPerformanceTimer,  // qerrors performance timer
  
  // qerrors Data Security & Sanitization
  sanitizeMessage,         // qerrors message sanitization
  sanitizeContext,         // qerrors context sanitization
  addCustomSanitizationPattern,    // qerrors custom sanitization patterns
  sanitizeWithCustomPatterns,      // qerrors enhanced sanitization
  clearCustomSanitizationPatterns, // qerrors pattern management
  
  // qerrors Utility Functions
  generateUniqueId,    // qerrors unique ID generation
  createTimer,        // qerrors timer utility
  deepClone,          // qerrors deep cloning
  safeRun,            // qerrors safe execution
  verboseLog,         // qerrors conditional logging
  
  // qerrors Error Handling
  createTypedError,    // qerrors typed error creation
  ErrorTypes,         // qerrors error type constants
  ErrorSeverity,      // qerrors severity levels
  ErrorFactory,       // qerrors error factory
  handleControllerError, // qerrors controller error handling
  withErrorHandling,  // qerrors async operation wrapper
  
  // qerrors Configuration & Environment
  getEnv,             // qerrors environment getter
  getInt,             // qerrors integer parsing
  getMissingEnvVars,  // qerrors environment validation
  throwIfMissingEnvVars, // qerrors required environment validation
  warnIfMissingEnvVars,  // qerrors optional environment validation
  
  // qerrors Simple Logger
  simpleLogger,       // qerrors simple logger
  createSimpleWinstonLogger, // qerrors logger factory
  LOG_LEVELS,         // qerrors log level constants
  
  // Backward compatibility aliases
  logEntry: logFunctionEntry,
  logExit: logFunctionExit,
  logError: logFunctionError
};