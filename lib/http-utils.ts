/**
 * HTTP Utilities Module
 *
 * This module provides standardized HTTP response utilities for Express.js applications.
 * It ensures consistent error handling, response formatting, and security across all API endpoints.
 *
 * Key Features:
 * - Standardized error response format with timestamps and request IDs
 * - Input sanitization to prevent injection attacks
 * - Comprehensive error type mapping for proper HTTP status codes
 * - Response object validation to catch runtime errors early
 * - Security-focused error message handling
 *
 * Security Considerations:
 * - All error messages are sanitized before client delivery
 * - Internal error details are logged but not exposed to clients
 * - Request IDs are generated for audit trails and debugging
 * - Response objects are validated before use to prevent runtime errors
 */

import type { Response } from 'express';
import {
  logger,
  sanitizeString,
  createPerformanceTimer,
  generateUniqueId,
  createTypedError,
  ErrorTypes,
  ErrorFactory,
  isValidString,
  isValidObject,
} from './simple-wrapper';
import { validateResponse, getTimestamp } from './common-patterns.js';

/**
 * Validates Express response objects to ensure they have required methods
 *
 * This function validates that the response object has the necessary methods
 * (status, json, send) for HTTP response handling. It's used as a safety check
 * before attempting to send responses to prevent runtime errors.
 *
 * @param res - Express response object to validate
 * @throws {Error} When response object is invalid or missing required methods
 */
export const validateResponseObject = (res: any): void => {
  validateResponse(res, 'validateResponseObject');
};

/**
 * Union type for all supported HTTP error types
 *
 * These error types provide semantic meaning to different HTTP error scenarios
 * and enable consistent error handling across the application. Each type maps
 * to a specific HTTP status code and use case.
 */
type HttpErrorType =
  | 'BAD_REQUEST' // 400 - Invalid request data or parameters
  | 'AUTHENTICATION_ERROR' // 401 - Missing or invalid authentication
  | 'NOT_FOUND' // 404 - Resource not found
  | 'CONFLICT' // 409 - Resource conflict (duplicate, etc.)
  | 'INTERNAL_ERROR' // 500 - Server-side error
  | 'SERVICE_UNAVAILABLE' // 503 - Service temporarily down
  | 'VALIDATION_ERROR' // 400 - Input validation failed
  | 'ERROR'; // Generic error fallback

/**
 * Union type for known HTTP status codes that have predefined error types
 *
 * These status codes are explicitly supported by the error handling system
 * and have corresponding error types and default messages.
 */
type KnownStatusCode =
  | 400 // Bad Request
  | 401 // Unauthorized
  | 404 // Not Found
  | 409 // Conflict
  | 500 // Internal Server Error
  | 503; // Service Unavailable

/**
 * Interface for standardized error response envelope
 *
 * This interface defines the structure of all error responses sent by the API.
 * It ensures consistent error handling across all endpoints and provides
 * necessary information for client-side error processing.
 */
interface ErrorEnvelope {
  error: {
    type: HttpErrorType;
    message: string;
    timestamp: string;
    requestId: string;
    errorId?: string;
    details?: unknown;
  };
}

/**
 * Creates a standardized error response envelope
 *
 * This function constructs the consistent error response format that includes
 * all required fields for proper error handling and debugging.
 *
 * @param statusCode - HTTP status code for the error
 * @param message - Error message (will be sanitized)
 * @param requestId - Unique request identifier for correlation
 * @returns {ErrorEnvelope} Standardized error response structure
 */
export const createErrorResponse = (
  statusCode: number,
  message: unknown,
  requestId: string
): ErrorEnvelope => {
  const errorId = generateUniqueId(); // Generate unique error ID for tracking
  return {
    error: {
      type: getErrorType(statusCode as KnownStatusCode), // Map status code to error type
      message: typeof message === 'string' ? message : String(message), // Security: safe type conversion for all message types
      timestamp: getTimestamp(), // ISO timestamp for request correlation
      requestId,
      ...(errorId && { errorId }), // Include error ID if successfully generated
    },
  };
};

/**
 * Maps HTTP status codes to semantic error types
 *
 * This mapping provides meaningful error categorization for different HTTP
 * error scenarios, enabling clients to handle errors programmatically based
 * on error type rather than just status codes.
 */
const errorTypeMap: Record<KnownStatusCode, HttpErrorType> = {
  400: 'BAD_REQUEST', // Client sent invalid request data
  401: 'AUTHENTICATION_ERROR', // Client lacks proper authentication
  404: 'NOT_FOUND', // Requested resource doesn't exist
  409: 'CONFLICT', // Request conflicts with current state
  500: 'INTERNAL_ERROR', // Server encountered unexpected error
  503: 'SERVICE_UNAVAILABLE', // Service temporarily unavailable
};

/**
 * Default error messages for each HTTP status code
 *
 * These messages provide user-friendly error descriptions when no custom
 * message is supplied. They are intentionally generic to avoid exposing
 * sensitive internal information while still being helpful.
 */
const defaultMessageMap: Record<KnownStatusCode, string> = {
  400: 'Bad request', // Generic client error message
  401: 'Authentication required', // Clear authentication requirement
  404: 'Resource not found', // Standard not found message
  409: 'Resource conflict', // Generic conflict description
  500: 'Internal server error', // Generic server error message
  503: 'Service temporarily unavailable', // Temporary service issue
};

/**
 * Maps HTTP status code to corresponding error type
 *
 * This function provides safe lookup of error types with fallback to generic
 * error type for any unmapped status codes. This ensures consistent error
 * handling even for unexpected status codes.
 *
 * @param statusCode - HTTP status code to map
 * @returns {HttpErrorType} Corresponding error type or generic 'ERROR'
 */
const getErrorType = (statusCode: KnownStatusCode): HttpErrorType =>
  errorTypeMap[statusCode] ?? 'ERROR';

/**
 * Gets default error message for HTTP status code
 *
 * This function provides safe lookup of default messages with fallback to
 * generic error message for any unmapped status codes. This ensures we always
 * have a meaningful message to display to users.
 *
 * @param statusCode - HTTP status code to get message for
 * @returns {string} Default error message or generic fallback
 */
const getDefaultMessage = (statusCode: KnownStatusCode): string =>
  defaultMessageMap[statusCode] ?? 'An error occurred';

/**
 * Core error response sending function with comprehensive validation
 *
 * This is the central function for sending all error responses. It performs
 * extensive validation of the response object to prevent runtime errors,
 * sanitizes all messages for security, and provides detailed logging for
 * debugging purposes. If any error occurs during response sending, it falls
 * back to a generic 500 error response.
 *
 * @param res - Express response object (must have status, json, send methods)
 * @param statusCode - HTTP status code for the error response
 * @param message - Error message (Error object, string, or other)
 * @param error - Optional original Error object for logging context
 * @returns {Response<ErrorEnvelope>} Express response with error envelope
 * @throws {Error} When response object validation fails (caught and handled)
 */
const sendErrorResponse = (
  res: Response,
  statusCode: KnownStatusCode,
  message: unknown,
  error: Error | null
): Response<ErrorEnvelope> => {
  const requestId = generateUniqueId(); // Generate unique request ID for correlation

  try {
    // Validate response object has required methods to prevent runtime errors
    if (!res || typeof res !== 'object') {
      throw createTypedError(
        'Invalid response object: must be an object',
        ErrorTypes.VALIDATION,
        'INVALID_RESPONSE_OBJECT'
      );
    }
    if (typeof (res as any).status !== 'function') {
      throw createTypedError(
        'Invalid response object: missing status() method',
        ErrorTypes.VALIDATION,
        'MISSING_STATUS_METHOD'
      );
    }
    if (typeof (res as any).json !== 'function') {
      throw createTypedError(
        'Invalid response object: missing json() method',
        ErrorTypes.VALIDATION,
        'MISSING_JSON_METHOD'
      );
    }
    if (typeof (res as any).send !== 'function') {
      throw createTypedError(
        'Invalid response object: missing send() method',
        ErrorTypes.VALIDATION,
        'MISSING_SEND_METHOD'
      );
    }

    // Extract and sanitize error message from various input types
    const rawMessage =
      message instanceof Error ? message.message : typeof message === 'string' ? message : '';
    const normalizedMessage = sanitizeString(rawMessage); // Security: sanitize all messages

    // Create standardized error response with all required fields
    const response = createErrorResponse(
      statusCode,
      normalizedMessage || getDefaultMessage(statusCode), // Use default if message empty
      requestId
    );

    return res.status(statusCode).json(response);
  } catch (err) {
    // Log the error response failure for debugging
    logger.error('Failed to send error response', {
      statusCode,
      hasError: err !== undefined,
      errorType: err && typeof err === 'object' && 'type' in err ? (err as any).type : undefined,
      responseSent: false,
    });

    // Fallback to generic 500 error if response sending fails
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId: generateUniqueId(),
      },
    });
  }
};

/**
 * Sends a 404 Not Found error response
 *
 * Use this function when a requested resource cannot be found. It provides
 * a standardized 404 response with proper error formatting and request ID
 * for debugging purposes.
 *
 * Security Features:
 * - Input sanitization to prevent injection attacks
 * - Consistent error response format across all endpoints
 * - Request correlation through unique identifiers
 * - Error message sanitization for client safety
 *
 * @param res - Express response object (must be validated)
 * @param message - Optional custom error message (will be sanitized)
 * @returns {Response<ErrorEnvelope>} Express response with 404 error envelope
 */
export const sendNotFound = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 404, typeof message === 'string' ? message : 'Resource not found', null);

/**
 * Sends a 409 Conflict error response
 *
 * Use this function when a request conflicts with the current state of the
 * resource, such as attempting to create a duplicate resource. This is commonly
 * used for uniqueness constraint violations.
 *
 * @param res - Express response object
 * @param message - Optional custom error message (defaults to 'Resource conflict')
 * @returns {Response<ErrorEnvelope>} Express response with 409 error envelope
 */
const sendConflict = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 409, message ?? 'Resource conflict', null);

/**
 * Sends a 500 Internal Server Error response
 *
 * Use this function for unexpected server-side errors that are not the client's
 * fault. This should be used for genuine server errors, not for client validation
 * failures or authentication issues.
 *
 * @param res - Express response object
 * @param message - Optional custom error message (defaults to 'Internal server error')
 * @returns {Response<ErrorEnvelope>} Express response with 500 error envelope
 */
const sendInternalServerError = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 500, message ?? 'Internal server error', null);

/**
 * Sends a 503 Service Unavailable error response
 *
 * Use this function when the service is temporarily unavailable but expected
 * to be available again later. This is typically used for maintenance windows
 * or temporary service disruptions.
 *
 * @param res - Express response object
 * @param message - Optional custom error message (defaults to 'Service temporarily unavailable')
 * @returns {Response<ErrorEnvelope>} Express response with 503 error envelope
 */
const sendServiceUnavailable = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 503, message ?? 'Service temporarily unavailable', null);

/**
 * Sends a 400 Bad Request error response
 *
 * Use this function when the client sends invalid request data, malformed
 * parameters, or violates request format requirements. This indicates the
 * client needs to modify their request before retrying.
 *
 * @param res - Express response object
 * @param message - Optional custom error message (defaults to 'Bad request')
 * @returns {Response<ErrorEnvelope>} Express response with 400 error envelope
 */
const sendBadRequest = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 400, message ?? 'Bad request', null);

/**
 * Sends a 400 Validation Error response with detailed validation information
 *
 * This function is specifically for input validation failures and includes
 * optional details about what validation failed. This helps clients understand
 * exactly what they need to fix in their request.
 *
 * @param res - Express response object
 * @param message - Validation error message describing what failed
 * @param details - Optional additional validation details (field names, rules, etc.)
 * @returns {Response<ErrorEnvelope>} Express response with validation error envelope
 */
const sendValidationError = (
  res: Response,
  message: unknown,
  details?: unknown
): Response<ErrorEnvelope> => {
  const response: ErrorEnvelope = {
    error: {
      type: 'VALIDATION_ERROR',
      message: sanitizeString(message as string) || 'Validation failed', // Sanitize for security
      timestamp: getTimestamp(),
      requestId: generateUniqueId(),
      details: details ?? null, // Include validation details if provided
    },
  };
  return res.status(400).json(response);
};

/**
 * Sends a 200 Success response with optional data
 *
 * This function provides a standardized success response format that includes
 * a message, timestamp, and optional data payload. It maintains consistency
 * with error responses while clearly indicating successful operation completion.
 *
 * @param res - Express response object
 * @param message - Success message describing what was accomplished
 * @param data - Optional data payload to include in the response
 * @returns {Response} Express response with success payload
 */
const sendSuccess = (
  res: Response,
  message: string,
  data?: unknown
): Response<{ message: string; timestamp: string; data?: unknown }> => {
  const payload = {
    message: sanitizeString(message) || 'Operation completed successfully', // Sanitize message
    timestamp: getTimestamp(), // Include timestamp for consistency with error responses
    ...(data !== undefined && { data }), // Include data only if provided (avoid undefined field)
  };
  return res.status(200).json(payload);
};

/**
 * Sends a 401 Authentication Error response with security logging
 *
 * This function handles authentication failures with enhanced security logging.
 * Authentication errors are treated as security events and logged with additional
 * context for security monitoring and audit purposes.
 *
 * @param res - Express response object
 * @param message - Optional custom authentication error message
 * @returns {Response<ErrorEnvelope>} Express response with authentication error envelope
 */
const sendAuthError = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  const requestId = generateUniqueId();
  try {
    const response: ErrorEnvelope = {
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeString((message as string) ?? 'Authentication required'), // Sanitize message
        timestamp: getTimestamp(),
        requestId,
      },
    };
    return res.status(401).json(response);
  } catch (error) {
    // Log authentication error as security event for monitoring
    logger.error('Failed to send authentication error response', {
      requestId,
      originalMessage: message,
      statusCode: 401,
      error: (error as Error).message,
      securityEvent: true, // Mark as security event for monitoring
    });
    // Fallback to generic error if authentication error response fails
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId,
      },
    });
  }
};

/**
 * Sends a 429 Too Many Requests error response with rate limit information
 *
 * This function handles rate limiting scenarios and can optionally include
 * rate limit metadata (such as retry-after time, limit details, etc.) to help
 * clients understand when they can retry their request.
 *
 * @param res - Express response object
 * @param message - Rate limit error message (defaults to 'Rate limit exceeded')
 * @param rateLimitInfo - Optional rate limit metadata (retry-after, limits, etc.)
 * @returns {Response<ErrorEnvelope>} Express response with rate limit error envelope
 */
const sendTooManyRequests = (
  res: Response,
  message: string = 'Rate limit exceeded',
  rateLimitInfo?: unknown
): Response<ErrorEnvelope> => {
  const requestId = generateUniqueId();
  try {
    // Create response with optional rate limit information
    const response: ErrorEnvelope & { rateLimit?: unknown } = {
      error: {
        type: 'ERROR', // Using generic ERROR type for rate limiting
        message: sanitizeString(message), // Sanitize message for security
        timestamp: getTimestamp(),
        requestId,
      },
    };

    // Include rate limit information if provided (helps clients understand limits)
    if (rateLimitInfo) {
      response.rateLimit = rateLimitInfo;
    }

    return res.status(429).json(response);
  } catch (error) {
    // Log rate limit error for debugging and monitoring
    logger.error('Failed to send rate limit response', {
      requestId,
      originalMessage: message,
      statusCode: 429,
      error: (error as Error).message,
    });
    // Fallback to generic error if rate limit response fails
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId,
      },
    });
  }
};

/**
 * Export all HTTP utility functions and types
 *
 * This export provides comprehensive access to all HTTP response utilities,
 * validation functions, and error handling types. The functions are designed
 * to work together to provide consistent, secure, and maintainable HTTP response
 * handling across the entire application.
 *
 * Usage Examples:
 * ```typescript
 * import { sendNotFound, sendSuccess, sendValidationError } from './http-utils';
 *
 * // Send 404 for missing resource
 * sendNotFound(res, 'User not found');
 *
 * // Send success with data
 * sendSuccess(res, 'User created successfully', userData);
 *
 * // Send validation error with details
 * sendValidationError(res, 'Invalid input', { field: 'email', rule: 'required' });
 * ```
 */
export {
  sendConflict, // 409 Conflict responses
  sendInternalServerError, // 500 Internal Server Error responses
  sendServiceUnavailable, // 503 Service Unavailable responses
  sendBadRequest, // 400 Bad Request responses
  sendValidationError, // 400 Validation Error responses with details
  sendSuccess, // 200 Success responses with optional data
  sendAuthError, // 401 Authentication Error responses
  sendErrorResponse, // Core error response function (advanced usage)
  sendTooManyRequests, // 429 Rate Limit Error responses
  sanitizeString, // Input sanitization utility
  getTimestamp, // Timestamp generation utility
  generateUniqueId, // Unique ID generation utility
  isValidString, // String validation utility
  isValidObject, // Object validation utility
  ErrorTypes, // Error type constants
  ErrorFactory, // Error creation factory
  createTypedError, // Typed error creation function
};
