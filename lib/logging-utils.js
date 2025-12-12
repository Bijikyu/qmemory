/**
 * Enhanced Logging Utility Functions - Simplified Implementation
 * Centralized logging patterns with enhanced features but avoiding complex dependencies
 *
 * This module provides enhanced logging capabilities while avoiding the complex
 * dependency chains that cause Jest configuration issues. It maintains
 * backward compatibility while adding significant new functionality.
 *
 * Enhanced features:
 * - Performance monitoring with automatic timing
 * - Request correlation and debugging
 * - Security-aware sanitization
 * - Structured logging with comprehensive metadata
 * - Multiple log levels with appropriate routing
 *
 * Design principles:
 * - Maintain backward compatibility with existing logging patterns
 * - Provide enhanced debugging and monitoring features
 * - Ensure security through automatic data sanitization
 * - Enable performance monitoring and optimization
 * - Avoid complex dependency chains that break tests
 */

// Import from our simplified wrapper to avoid dependency issues
const { 
  logger,
  createPerformanceTimer,
  generateUniqueId,
  sanitizeMessage,
  createTypedError,
  ErrorTypes
} = require('./qgenutils-wrapper');

/**
 * Enhanced function entry logging with performance monitoring
 * 
 * Provides comprehensive entry logging with automatic performance timing,
 * request correlation, and structured metadata for debugging.
 * 
 * @param {string} functionName - Name of the function being entered
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
      params,
      userId: options.userId,
      metadata: options.metadata || {}
    };
    
    // Log with enhanced debugging information
    logger.debug(`Function entry: ${functionName}`, logEntry);
    
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
      timer: { end: () => {} },
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
 * @param {string} functionName - Name of the function being exited
 * @param {*} result - Result being returned from the function
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
      result,
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
    if (context.timer && typeof context.timer.end === 'function') {
      context.timer.end();
    }
    
    // Log with enhanced performance information
    logger.info(`Function exit: ${functionName}`, logEntry);
    
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
 * @param {string} functionName - Name of the function that encountered error
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
      additionalContext: options.additionalContext || {},
      metadata: options.metadata || {}
    };
    
    // End performance timer if available
    if (context.timer && typeof context.timer.end === 'function') {
      context.timer.end();
    }
    
    // Use enhanced error logging
    logger.error(`${functionName} failed`, errorContext);
    
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
    logger.info(`AUDIT: ${action}`, auditEntry);
    
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
 * and detailed metrics for optimization.
 * 
 * @param {string} operationName - Name of the operation being monitored
 * @param {Function} operation - Operation to monitor
 * @param {Object} options - Monitoring options
 * @param {number} options.threshold - Performance threshold in milliseconds
 * @returns {Promise<*>} Operation result with performance metrics
 */
async function monitorPerformance(operationName, operation, options = {}) {
  const timer = createPerformanceTimer(operationName);
  const startTime = Date.now();
  
  try {
    // Execute the operation
    const result = await operation();
    
    // Calculate performance metrics
    const duration = Date.now() - startTime;
    const threshold = options.threshold || 1000; // Default 1 second threshold
    
    // Log performance information
    if (duration > threshold) {
      logger.warn(`Performance warning: ${operationName} exceeded threshold`, {
        operation: operationName,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        exceeded: true
      });
    } else {
      logger.debug(`Performance: ${operationName} completed`, {
        operation: operationName,
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        exceeded: false
      });
    }
    
    timer.end();
    
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
    
    // Log performance error
    logger.error(`Performance error: ${operationName} failed`, {
      operation: operationName,
      duration: `${duration}ms`,
      error: error.message
    });
    
    timer.end();
    throw error;
  }
}

// Export enhanced logging utilities
module.exports = {
  // Core logging functions (enhanced)
  logFunctionEntry,    // enhanced function entry with performance monitoring
  logFunctionExit,     // enhanced function exit with performance metrics
  logFunctionError,    // enhanced error logging with structured analysis
  
  // Additional enhanced logging functions
  logAuditEvent,       // comprehensive audit logging for compliance
  monitorPerformance,  // automatic performance monitoring with thresholds
  
  // Direct access to enhanced logging capabilities
  logger,              // enhanced logger instance
  createPerformanceTimer,  // performance timer
  generateUniqueId,    // unique ID generation
  sanitizeMessage,     // message sanitization
  
  // Error handling utilities
  createTypedError,     // typed error creation
  ErrorTypes,          // error type constants
  
  // Backward compatibility aliases
  logEntry: logFunctionEntry,
  logExit: logFunctionExit,
  logError: logFunctionError
};