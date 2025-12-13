/**
 * Enhanced HTTP Utility Functions - Simplified Implementation
 * Comprehensive HTTP response helpers with enhanced features but avoiding complex dependencies
 */

const { 
  logger,
  sanitizeString,
  createPerformanceTimer,
  generateUniqueId,
  createTypedError,
  ErrorTypes,
  ErrorFactory
} = require('./qgenutils-wrapper');

const validateResponseObject = (res) => {
  if (!res || typeof res !== 'object') throw createTypedError('Invalid response object: must be an object', ErrorTypes.VALIDATION, 'INVALID_RESPONSE_OBJECT');
  if (typeof res.status !== 'function') throw createTypedError('Invalid response object: missing status() method', ErrorTypes.VALIDATION, 'MISSING_STATUS_METHOD');
  if (typeof res.json !== 'function') throw createTypedError('Invalid response object: missing json() method', ErrorTypes.VALIDATION, 'MISSING_JSON_METHOD');
};

const validateExpressResponse = (res) => {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    throw new Error('Invalid Express response object provided');
  }
};

const sendErrorResponse = (res, statusCode, message, error = null) => {
  const requestId = generateRequestId();
  try {
    validateResponseObject(res);
    
    const response = {
      error: {
        type: getErrorType(statusCode),
        message: sanitizeResponseMessage(message, getDefaultMessage(statusCode)),
        timestamp: getTimestamp(),
        requestId
      }
    };
    
    if (error) {
      response.error.errorId = generateRequestId();
    }
    
    return res.status(statusCode).json(response);
  } catch (err) {
    console.error(`Failed to send ${statusCode} response:`, err.message);
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId: generateUniqueId()
      }
    });
  }
};

const getErrorType = (statusCode) => {
  const types = {
    400: 'BAD_REQUEST',
    401: 'AUTHENTICATION_ERROR',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  return types[statusCode] || 'ERROR';
};

const getDefaultMessage = (statusCode) => {
  const messages = {
    400: 'Bad request',
    401: 'Authentication required',
    404: 'Resource not found',
    409: 'Resource conflict',
    500: 'Internal server error',
    503: 'Service temporarily unavailable'
  };
  return messages[statusCode] || 'An error occurred';
};

const sanitizeResponseMessage = (message, fallback) => {
  try {
    if (typeof message === 'string' && message.trim()) return sanitizeString(message.trim()) || fallback;
    if (typeof message === 'string' && !message.trim()) return message.trim() || fallback;
    if (message != null) {
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
};

const getTimestamp = () => new Date().toISOString();
const generateRequestId = () => generateUniqueId();

const sendNotFound = (res, message) => {
  const requestId = generateRequestId();
  try {
    validateResponseObject(res);
    logger.info('Sending 404 Not Found response', {
      requestId,
      message: sanitizeResponseMessage(message, 'Resource not found'),
      statusCode: 404,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip,
      url: res.req?.originalUrl || res.req?.url
    });
    return res.status(404).json({
      error: {
        type: 'NOT_FOUND',
        message: sanitizeResponseMessage(message, 'Resource not found'),
        timestamp: getTimestamp(),
        requestId
      }
    });
  } catch (error) {
    logger.error('Failed to send 404 response', {
      requestId,
      originalMessage: message,
      statusCode: 404,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
};

const sendConflict = (res, message) => {
  const requestId = generateRequestId();
  try {
    validateResponseObject(res);
    logger.info('Sending 409 Conflict response', {
      requestId,
      message: sanitizeResponseMessage(message, 'Resource conflict'),
      statusCode: 409,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip
    });
    return res.status(409).json({
      error: {
        type: 'CONFLICT',
        message: sanitizeResponseMessage(message, 'Resource conflict'),
        timestamp: getTimestamp(),
        requestId
      }
    });
  } catch (error) {
    logger.error('Failed to send 409 response', {
      requestId,
      originalMessage: message,
      statusCode: 409,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
};

const sendInternalServerError = (res, message, error = null) => {
  const requestId = generateRequestId();
  try {
    validateResponseObject(res);
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
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: sanitizeResponseMessage(message, 'Internal server error'),
        timestamp: getTimestamp(),
        requestId,
        errorId: error ? generateRequestId() : null
      }
    });
  } catch (responseError) {
    console.error('[CRITICAL_ERROR] Failed to send 500 response:', responseError.message);
    return res.status(500).json({
      error: {
        type: 'CRITICAL_ERROR',
        message: 'A critical error occurred',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
};

const sendServiceUnavailable = (res, message) => {
  const requestId = generateRequestId();
  
  try {
    validateResponseObject(res);
    
    logger.warn('Service unavailable response sent', {
      requestId,
      message: sanitizeResponseMessage(message, 'Service temporarily unavailable'),
      statusCode: 503,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip
    });
    
    const response = res.status(503).json({
      error: {
        type: 'SERVICE_UNAVAILABLE',
        message: sanitizeResponseMessage(message, 'Service temporarily unavailable'),
        timestamp: getTimestamp(),
        requestId,
        retryAfter: 300
      }
    });
    
    res.set('Retry-After', '300');
    
    return response;
  } catch (error) {
    logger.error('Failed to send 503 response', {
      requestId,
      originalMessage: message,
      statusCode: 503,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
};

const sendValidationError = (res, message, additionalData = {}, statusCode = 400) => {
  const requestId = generateRequestId();
  
  try {
    validateResponseObject(res);
    
    logger.info('Sending validation error response', {
      requestId,
      message: sanitizeResponseMessage(message, 'Validation failed'),
      statusCode,
      validationErrors: additionalData,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip
    });
    
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
    logger.error('Failed to send validation error response', {
      requestId,
      originalMessage: message,
      validationErrors: additionalData,
      statusCode,
      error: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
};

const sendAuthError = (res, message = 'Authentication required') => {
  const requestId = generateRequestId();
  
  try {
    validateResponseObject(res);
    
    logger.warn('Authentication error response sent', {
      requestId,
      message: sanitizeResponseMessage(message, 'Authentication required'),
      statusCode: 401,
      userAgent: res.req?.get('User-Agent'),
      ip: res.req?.ip,
      url: res.req?.originalUrl || res.req?.url
    });
    
    return res.status(401).json({
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeResponseMessage(message, 'Authentication required'),
        timestamp: getTimestamp(),
        requestId
      }
    });
  } catch (error) {
    logger.error('Failed to send authentication error response', {
      requestId,
      originalMessage: message,
      statusCode: 401,
      error: error.message,
      stack: error.stack,
      securityEvent: true
    });
    
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId
      }
    });
  }
};

module.exports = {
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  sendValidationError,
  sendAuthError,
  validateResponseObject,
  validateExpressResponse,
  sendErrorResponse,
  sanitizeResponseMessage,
  getTimestamp,
  generateRequestId,
  createPerformanceTimer,
  generateUniqueId,
  createTypedError,
  ErrorTypes,
  ErrorFactory
};