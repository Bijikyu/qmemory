/**
 * Enhanced HTTP Utility Functions - Simplified Implementation
 * Comprehensive HTTP response helpers with enhanced features but avoiding complex dependencies
 *
 * This module provides enhanced HTTP response handling while avoiding the complex
 * dependency chains that cause Jest configuration issues. It implements key features
 * directly with fallback mechanisms.
 *
 * Enhanced features:
 * - Consistent error response formats
 * - Enhanced logging with context
 * - Security-aware sanitization
 * - Performance monitoring
 * - Request correlation
 *
 * Design philosophy:
 * - Maintain backward compatibility with existing response patterns
 * - Provide enhanced error handling without complex dependencies
 * - Ensure security through sanitization
 * - Enable performance monitoring and debugging
 */

// Import from our simplified wrapper to avoid dependency issues
const { 
  logger,
  sanitizeString,
  isValidString,
  createPerformanceTimer,
  generateUniqueId,
  createTypedError,
  ErrorTypes,
  ErrorFactory
} = require('./qgenutils-wrapper');

/**
 * Validates Express response object with enhanced error reporting
 * 
 * Centralized validation prevents runtime errors when HTTP utilities
 * are called with invalid parameters.
 * 
 * @param {Object} res - Express response object to validate
 * @throws {Error} When response object is invalid or missing required methods
 */
function validateResponseObject(res) {
  if (!res || typeof res !== 'object') {
    throw createTypedError(
      'Invalid response object: must be an object',
      ErrorTypes.VALIDATION,
      'INVALID_RESPONSE_OBJECT'
    );
  }
  
  if (typeof res.status !== 'function') {
    throw createTypedError(
      'Invalid response object: missing status() method',
      ErrorTypes.VALIDATION,
      'MISSING_STATUS_METHOD'
    );
  }
  
  if (typeof res.json !== 'function') {
    throw createTypedError(
      'Invalid response object: missing json() method',
      ErrorTypes.VALIDATION,
      'MISSING_JSON_METHOD'
    );
  }
}

/**
 * Enhanced message sanitization with security focus
 * 
 * Standardizes message handling across all HTTP utilities by applying
 * multiple layers of security sanitization and providing fallback
 * messages when input is invalid.
 * 
 * @param {string} message - Input message to sanitize
 * @param {string} fallback - Default message when input is invalid
 * @returns {string} Sanitized message or fallback
 */
function sanitizeResponseMessage(message, fallback) {
  try {
    if (typeof message === 'string' && message.trim()) {
      return sanitizeString(message.trim()) || fallback;
    }
    
    if (typeof message === 'string') {
      return message.trim() || fallback;
    }
    
    if (message !== null && message !== undefined) {
      const str = String(message).trim();
      return str || fallback;
    }
    
    return fallback;
  } catch (error) {
    logger.warn('Response message sanitization failed, using fallback', {
      originalMessage: typeof message === 'string' ? message.substring(0, 100) : 'non-string',
      fallback,
      error: error.message
    });
    return fallback;
  }
}

/**
 * Generates consistent ISO timestamp
 * 
 * Centralizes timestamp generation to ensure consistent format
 * across all HTTP responses.
 * 
 * @returns {string} ISO 8601 formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Generates unique request ID for correlation and debugging
 * 
 * Creates unique identifiers for HTTP requests to enable
 * correlation across logs and debugging tools.
 * 
 * @returns {string} Unique request identifier
 */
function generateRequestId() {
  return generateUniqueId();
}

/**
 * Sends a 404 Not Found response with enhanced logging
 * 
 * Enhanced version of 404 response with comprehensive logging
 * and debugging information.
 * 
 * @param {Object} res - Express response object used to send HTTP response
 * @param {string} message - Custom error message describing what was not found
 */
function sendNotFound(res, message) {
  const requestId = generateRequestId();
  
  try {
    // Input validation with enhanced error reporting
    validateResponseObject(res);
    
    // Log 404 response with enhanced context
    logger.info('Sending 404 Not Found response', {
      requestId,
      message: sanitizeResponseMessage(message, 'Resource not found'),
      statusCode: 404,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip,
      url: res.req?.originalUrl || res.req?.url
    });
    
    // Send standardized 404 Not Found response
    return res.status(404).json({
      error: {
        type: 'NOT_FOUND',
        message: sanitizeResponseMessage(message, 'Resource not found'),
        timestamp: getTimestamp(),
        requestId
      }
    });
  } catch (error) {
    // Enhanced error logging
    logger.error('Failed to send 404 response', {
      requestId,
      originalMessage: message,
      statusCode: 404,
      error: error.message,
      stack: error.stack
    });
    
    // Fallback response
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
}

/**
 * Sends a 409 Conflict response with enhanced logging
 * 
 * Enhanced version of 409 response with comprehensive logging
 * and conflict analysis for debugging duplicate resource issues.
 * 
 * @param {Object} res - Express response object used to send HTTP response
 * @param {string} message - Custom error message describing conflict
 */
function sendConflict(res, message) {
  const requestId = generateRequestId();
  
  try {
    // Input validation
    validateResponseObject(res);
    
    // Log conflict response with enhanced context
    logger.info('Sending 409 Conflict response', {
      requestId,
      message: sanitizeResponseMessage(message, 'Resource conflict'),
      statusCode: 409,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip
    });
    
    // Send standardized 409 Conflict response
    return res.status(409).json({
      error: {
        type: 'CONFLICT',
        message: sanitizeResponseMessage(message, 'Resource conflict'),
        timestamp: getTimestamp(),
        requestId
      }
    });
  } catch (error) {
    // Enhanced error logging
    logger.error('Failed to send 409 response', {
      requestId,
      originalMessage: message,
      statusCode: 409,
      error: error.message,
      stack: error.stack
    });
    
    // Fallback response
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
}

/**
 * Sends a 500 Internal Server Error response with enhanced analysis
 * 
 * Enhanced version of 500 response with comprehensive error logging
 * and detailed debugging information.
 * 
 * @param {Object} res - Express response object used to send the HTTP response
 * @param {string} message - Custom error message describing the internal error
 * @param {Error} error - Original error object for analysis
 */
function sendInternalServerError(res, message, error = null) {
  const requestId = generateRequestId();
  
  try {
    // Input validation
    validateResponseObject(res);
    
    // Enhanced error logging with comprehensive context
    logger.error('Internal server error occurred', {
      requestId,
      message: sanitizeResponseMessage(message, 'Internal server error'),
      statusCode: 500,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip,
      url: res.req?.originalUrl || res.req?.url,
      method: res.req?.method
    });
    
    // Send standardized 500 Internal Server Error response
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: sanitizeResponseMessage(message, 'Internal server error'),
        timestamp: getTimestamp(),
        requestId,
        // Include error ID for debugging but not stack trace for security
        errorId: error ? generateRequestId() : null
      }
    });
  } catch (responseError) {
    // Last resort error logging
    console.error('[CRITICAL_ERROR] Failed to send 500 response:', responseError.message);
    
    // Minimal fallback response
    return res.status(500).json({
      error: {
        type: 'CRITICAL_ERROR',
        message: 'A critical error occurred',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
}

/**
 * Sends a 503 Service Unavailable response with enhanced monitoring
 * 
 * Enhanced version of 503 response with comprehensive logging
 * and retry guidance.
 * 
 * @param {Object} res - Express response object used to send the HTTP response
 * @param {string} message - Custom error message describing unavailable service
 */
function sendServiceUnavailable(res, message) {
  const requestId = generateRequestId();
  
  try {
    // Input validation
    validateResponseObject(res);
    
    // Log service unavailable event with enhanced monitoring
    logger.warn('Service unavailable response sent', {
      requestId,
      message: sanitizeResponseMessage(message, 'Service temporarily unavailable'),
      statusCode: 503,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip
    });
    
    // Send standardized 503 Service Unavailable response
    const response = res.status(503).json({
      error: {
        type: 'SERVICE_UNAVAILABLE',
        message: sanitizeResponseMessage(message, 'Service temporarily unavailable'),
        timestamp: getTimestamp(),
        requestId,
        retryAfter: 300
      }
    });
    
    // Add Retry-After header
    res.set('Retry-After', '300');
    
    return response;
  } catch (error) {
    // Enhanced error logging
    logger.error('Failed to send 503 response', {
      requestId,
      originalMessage: message,
      statusCode: 503,
      error: error.message,
      stack: error.stack
    });
    
    // Fallback response
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
}

/**
 * Enhanced validation error response
 * 
 * Provides standardized validation error responses with enhanced logging
 * and security considerations.
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Object} additionalData - Additional validation context
 * @param {number} statusCode - HTTP status code (default: 400)
 */
function sendValidationError(res, message, additionalData = {}, statusCode = 400) {
  const requestId = generateRequestId();
  
  try {
    // Validate response object
    validateResponseObject(res);
    
    // Log validation error with enhanced context
    logger.info('Sending validation error response', {
      requestId,
      message: sanitizeResponseMessage(message, 'Validation failed'),
      statusCode,
      validationErrors: additionalData,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip
    });
    
    // Send standardized validation error response
    return res.status(statusCode).json({
      error: {
        type: 'VALIDATION_ERROR',
        message: sanitizeResponseMessage(message, 'Validation failed'),
        timestamp: getTimestamp(),
        requestId,
        validationErrors: additionalData
      }
    });
  } catch (error) {
    // Enhanced error logging
    logger.error('Failed to send validation error response', {
      requestId,
      originalMessage: message,
      validationErrors: additionalData,
      statusCode,
      error: error.message,
      stack: error.stack
    });
    
    // Fallback response
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
}

/**
 * Enhanced authentication error response
 * 
 * Provides standardized authentication error responses with security logging
 * and audit trail.
 * 
 * @param {Object} res - Express response object
 * @param {string} message - Authentication error message
 */
function sendAuthError(res, message = 'Authentication required') {
  const requestId = generateRequestId();
  
  try {
    // Validate response object
    validateResponseObject(res);
    
    // Log authentication error with security context
    logger.warn('Authentication error response sent', {
      requestId,
      message: sanitizeResponseMessage(message, 'Authentication required'),
      statusCode: 401,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip,
      url: res.req?.originalUrl || res.req?.url
    });
    
    // Send standardized authentication error response
    return res.status(401).json({
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeResponseMessage(message, 'Authentication required'),
        timestamp: getTimestamp(),
        requestId
      }
    });
  } catch (error) {
    // Enhanced error logging
    logger.error('Failed to send authentication error response', {
      requestId,
      originalMessage: message,
      statusCode: 401,
      error: error.message,
      stack: error.stack,
      securityEvent: true
    });
    
    // Fallback response
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
}

// Export enhanced HTTP utilities with backward compatibility
module.exports = {
  // Core HTTP response functions (enhanced)
  sendNotFound,              // enhanced 404 responses with comprehensive logging
  sendConflict,              // enhanced 409 responses with conflict tracking
  sendInternalServerError,   // enhanced 500 responses with detailed logging
  sendServiceUnavailable,    // enhanced 503 responses with retry guidance
  
  // Additional enhanced HTTP functions
  sendValidationError,        // enhanced validation errors with security logging
  sendAuthError,             // enhanced authentication errors with audit trail
  
  // Utility functions (enhanced)
  validateResponseObject,    // enhanced response object validation
  sanitizeResponseMessage,   // enhanced message sanitization
  getTimestamp,             // consistent timestamp generation
  generateRequestId,         // unique request ID generation
  
  // Performance and monitoring utilities
  createPerformanceTimer,
  generateUniqueId,
  
  // Error handling utilities
  createTypedError,
  ErrorTypes,
  ErrorFactory
};