/**
 * Enhanced HTTP Utility Functions - Simplified Implementation
 * Comprehensive HTTP response helpers with enhanced features but avoiding complex dependencies
 */

// 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING

import { 
  logger,
  sanitizeString,
  createPerformanceTimer,
  generateUniqueId,
  createTypedError,
  ErrorTypes,
  ErrorFactory
} from './qgenutils-wrapper.js';

// Express types - using generic interfaces for compatibility
interface Response {
  status(code: number): Response;
  json(data: any): Response;
}

interface Request {
  [key: string]: any;
}

// 🚩AI: MUST_UPDATE_IF_EXPRESS_RESPONSE_FORMAT_CHANGES
const validateResponseObject = (res: Response): void => {
  if (!res || typeof res !== 'object') throw createTypedError('Invalid response object: must be an object', ErrorTypes.VALIDATION, 'INVALID_RESPONSE_OBJECT');
  if (typeof res.status !== 'function') throw createTypedError('Invalid response object: missing status() method', ErrorTypes.VALIDATION, 'MISSING_STATUS_METHOD');
  if (typeof res.json !== 'function') throw createTypedError('Invalid response object: missing json() method', ErrorTypes.VALIDATION, 'MISSING_JSON_METHOD');
};

const validateExpressResponse = (res: Response): void => {
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
    throw new Error('Invalid Express response object provided');
  }
};

const sendErrorResponse = (res: Response, statusCode: number, message: string, error: Error | null = null): Response => {
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
      (response.error as any).errorId = generateRequestId();
    }
    
    return res.status(statusCode).json(response);
  } catch (err) {
    console.error(`Failed to send ${statusCode} response:`, (err as Error).message);
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

const getErrorType = (statusCode: number): string => {
  const types: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'AUTHENTICATION_ERROR',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  return types[statusCode] || 'ERROR';
};

const getDefaultMessage = (statusCode: number): string => {
  const messages: Record<number, string> = {
    400: 'Bad request',
    401: 'Authentication required',
    404: 'Resource not found',
    409: 'Resource conflict',
    500: 'Internal server error',
    503: 'Service temporarily unavailable'
  };
  return messages[statusCode] || 'An error occurred';
};

const sanitizeResponseMessage = (message: string, fallback: string): string => {
  try {
    if (typeof message === 'string' && message.trim()) return sanitizeString(message.trim()) || fallback;
    if (typeof message === 'string' && !message.trim()) return message.trim() || fallback;
    if (message != null) {
      const str = String(message).trim();
      return str || fallback;
    }
    return fallback;
  } catch (error) {
    console.warn('Response message sanitization failed, using fallback', {
      originalMessage: typeof message === 'string' ? message.substring(0, 100) : 'non-string',
      fallback,
      error: (error as Error).message
    });
    return fallback;
  }
};

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const generateRequestId = (): string => {
  return generateUniqueId();
};

const sendNotFound = (res: Response, message?: string): Response => {
  return sendErrorResponse(res, 404, message || 'Resource not found');
};

const sendConflict = (res: Response, message?: string): Response => {
  return sendErrorResponse(res, 409, message || 'Resource conflict');
};

const sendInternalServerError = (res: Response, message?: string): Response => {
  return sendErrorResponse(res, 500, message || 'Internal server error');
};

const sendServiceUnavailable = (res: Response, message?: string): Response => {
  return sendErrorResponse(res, 503, message || 'Service temporarily unavailable');
};

const sendValidationError = (res: Response, message: string, details?: any): Response => {
  const response = {
    error: {
      type: 'VALIDATION_ERROR',
      message: sanitizeResponseMessage(message, 'Validation failed'),
      timestamp: getTimestamp(),
      requestId: generateRequestId(),
      details: details || null
    }
  };
  
  return res.status(400).json(response);
};

const sendAuthError = (res: Response, message?: string): Response => {
  const requestId = generateRequestId();
  try {
    validateResponseObject(res);
    
    const response = {
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeResponseMessage(message || 'Authentication required', 'Authentication required'),
        timestamp: getTimestamp(),
        requestId
      }
    };
    
    return res.status(401).json(response);
  } catch (error) {
    console.error('Failed to send authentication error response', {
      requestId,
      originalMessage: message,
      statusCode: 401,
      error: (error as Error).message,
      stack: (error as Error).stack,
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

export {
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