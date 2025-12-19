/**
 * Enhanced HTTP Utility Functions - Simplified Implementation
 * Comprehensive HTTP response helpers with enhanced features but avoiding complex dependencies
 */
// 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
import { sanitizeString, createPerformanceTimer, generateUniqueId, createTypedError, ErrorTypes, ErrorFactory } from './qgenutils-wrapper.js';

type HttpErrorType =
  | 'BAD_REQUEST'
  | 'AUTHENTICATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'ERROR';

type KnownStatusCode = 400 | 401 | 404 | 409 | 500 | 503;

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

// 🚩AI: MUST_UPDATE_IF_EXPRESS_RESPONSE_FORMAT_CHANGES
/**
 * Validates that an incoming response object exposes the Express API surface.
 * @param res - Candidate Express response.
 * @throws Returns typed validation errors when methods are missing to keep callers honest.
 */
const validateResponseObject = (res: unknown): asserts res is Response => {
  if (!res || typeof res !== 'object') {
    throw createTypedError('Invalid response object: must be an object', ErrorTypes.VALIDATION, 'INVALID_RESPONSE_OBJECT'); // Guard against undefined or primitives to prevent runtime crashes
  }
  if (typeof (res as Response).status !== 'function') {
    throw createTypedError('Invalid response object: missing status() method', ErrorTypes.VALIDATION, 'MISSING_STATUS_METHOD'); // We rely on status for HTTP status codes, so fail fast
  }
  if (typeof (res as Response).json !== 'function') {
    throw createTypedError('Invalid response object: missing json() method', ErrorTypes.VALIDATION, 'MISSING_JSON_METHOD'); // JSON transport is required for deterministic responses
  }
};

/**
 * Narrowing helper for legacy callers that expect a basic runtime check.
 * @param res - Candidate Express response.
 * @throws Throws generic Error for compatibility with older code paths.
 */
const validateExpressResponse = (res: unknown): asserts res is Response => {
  if (!res || typeof (res as Response).status !== 'function' || typeof (res as Response).json !== 'function') {
    throw new Error('Invalid Express response object provided'); // Maintain backward compatibility with plain Error consumers
  }
};

/**
 * Sends a structured error response with consistent formatting.
 * @param res - Express response to write the payload to.
 * @param statusCode - HTTP status describing the error semantics.
 * @param message - Human readable message (falls back to canonical text).
 * @param error - Optional error instance for logging correlation.
 * @returns Express response containing the payload for chaining.
 */
const sendErrorResponse = (
  res: Response,
  statusCode: KnownStatusCode,
  message: unknown,
  error: Error | null = null,
): Response<ErrorEnvelope> => {
  const requestId = generateRequestId(); // Generate deterministic request id so downstream logs correlate
  try {
    validateResponseObject(res); // Ensure we only use fully featured Express responses
    const response: ErrorEnvelope = {
      error: {
        type: getErrorType(statusCode), // Map status to semantic error category for clients
        message: sanitizeResponseMessage(message, getDefaultMessage(statusCode)), // Provide sanitized messaging to avoid disclosure
        timestamp: getTimestamp(), // Include timestamp for temporal tracing
        requestId, // Echo the correlation id for clients
      },
    };
    if (error) {
      response.error.errorId = generateRequestId(); // Attach secondary id when we have an originating exception for log lookup
    }
    return res.status(statusCode).json(response); // Send deterministic structure to the caller
  } catch (err) {
    console.error(`Failed to send ${statusCode} response:`, (err as Error).message); // Log failure so we know when serialization breaks
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId: generateUniqueId(),
      },
    }); // Fall back to guarded 500 ensuring we never leak internal state
  }
};

const errorTypeMap: Record<KnownStatusCode, HttpErrorType> = {
  400: 'BAD_REQUEST',
  401: 'AUTHENTICATION_ERROR',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Derives a stable error type from a status code.
 * @param statusCode - HTTP status.
 * @returns Known error classification string for clients.
 */
const getErrorType = (statusCode: KnownStatusCode): HttpErrorType => {
  return errorTypeMap[statusCode] ?? 'ERROR'; // Provide deterministic fallback so consumers always receive a value
};

const defaultMessageMap: Record<KnownStatusCode, string> = {
  400: 'Bad request',
  401: 'Authentication required',
  404: 'Resource not found',
  409: 'Resource conflict',
  500: 'Internal server error',
  503: 'Service temporarily unavailable',
};

/**
 * Supplies a canonical message when callers omit details.
 * @param statusCode - HTTP status used to select the default text.
 */
const getDefaultMessage = (statusCode: KnownStatusCode): string => {
  return defaultMessageMap[statusCode] ?? 'An error occurred'; // Prevent undefined strings in clients by falling back
};

/**
 * Sanitizes potentially unsafe messages before they reach clients.
 * @param message - Arbitrary message (stringable).
 * @param fallback - Safe message if sanitization fails.
 * @returns Cleaned message suitable for client consumption.
 */
const sanitizeResponseMessage = (message: unknown, fallback: string): string => {
  try {
    if (typeof message === 'string' && message.trim()) {
      return sanitizeString(message.trim()) || fallback; // Remove unsafe characters using shared sanitizer while preserving input intent
    }
    if (typeof message === 'string' && !message.trim()) {
      return message.trim() || fallback; // Preserve intentional blank strings to avoid surprising clients
    }
    if (message != null) {
      const str = String(message).trim(); // Coerce other primitives without leaking object structures
      return str || fallback; // Ensure we never return empty payload
    }
    return fallback; // Absent message resolves to standard copy
  } catch (error) {
    console.warn('Response message sanitization failed, using fallback', {
      originalMessage: typeof message === 'string' ? message.substring(0, 100) : 'non-string',
      fallback,
      error: (error as Error).message,
    }); // Emit warning so operators can trace sanitization issues
    return fallback; // Maintain resilience even when sanitizer breaks
  }
};

/**
 * Produces an ISO timestamp for response payloads.
 */
const getTimestamp = (): string => {
  return new Date().toISOString(); // Use ISO format to simplify lexical sorting and timezone handling
};

/**
 * Generates correlation ids using the shared utility.
 */
const generateRequestId = (): string => {
  return generateUniqueId(); // Delegate to central generator to keep ids uniform across services
};

/**
 * Sends a 404 payload with consistent formatting.
 */
const sendNotFound = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 404, message ?? 'Resource not found'); // Provide optional custom message while retaining default
};

/**
 * Sends a 409 payload with consistent formatting.
 */
const sendConflict = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 409, message ?? 'Resource conflict'); // Use helper to eliminate duplicated logic
};

/**
 * Sends a 500 payload with consistent formatting.
 */
const sendInternalServerError = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 500, message ?? 'Internal server error'); // Reuse general helper for maintainability
};

/**
 * Sends a 503 payload with consistent formatting.
 */
const sendServiceUnavailable = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 503, message ?? 'Service temporarily unavailable'); // Keep clients informed of transient outages
};

/**
 * Sends a 400 validation error payload including optional details.
 */
const sendValidationError = (
  res: Response,
  message: unknown,
  details?: unknown,
): Response<ErrorEnvelope> => {
  const response: ErrorEnvelope = {
    error: {
      type: 'VALIDATION_ERROR',
      message: sanitizeResponseMessage(message, 'Validation failed'),
      timestamp: getTimestamp(),
      requestId: generateRequestId(),
      details: details ?? null,
    },
  }; // Build explicit envelope to avoid mutation surprises
  return res.status(400).json(response); // Provide deterministic 400 response for validation failures
};

/**
 * Sends a 401 authentication error payload with hardened error logging.
 */
const sendAuthError = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  const requestId = generateRequestId(); // Issue new request id for auth failures to aid auditing
  try {
    validateResponseObject(res); // Confirm Express compatibility before writing
    const response: ErrorEnvelope = {
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeResponseMessage(message ?? 'Authentication required', 'Authentication required'),
        timestamp: getTimestamp(),
        requestId,
      },
    }; // Align payload with other helpers for predictability
    return res.status(401).json(response); // Respond with 401 to trigger client auth flows
  } catch (error) {
    console.error('Failed to send authentication error response', {
      requestId,
      originalMessage: message,
      statusCode: 401,
      error: (error as Error).message,
      stack: (error as Error).stack,
      securityEvent: true,
    }); // Escalate logging because auth errors can signal security issues
    return res.status(500).json({
      error: {
        type: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your request',
        timestamp: getTimestamp(),
        requestId,
      },
    }); // Fail securely instead of leaking objects from the error path
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
  ErrorFactory,
};
