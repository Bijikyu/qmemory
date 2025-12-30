/**
 * Enhanced HTTP Utility Functions - Simplified Implementation
 * Comprehensive HTTP response helpers with enhanced features but avoiding complex dependencies
 */
// 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
import {
  sanitizeString,
  createPerformanceTimer,
  generateUniqueId,
  createTypedError,
  ErrorTypes,
  ErrorFactory,
} from './simple-wrapper.js';
import qerrors from 'qerrors';

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
// Cache for validated response objects to improve performance
const validatedResponseCache = new WeakSet<Response>();

/**
 * Validates that an incoming response object exposes the Express API surface.
 * Uses caching to avoid repeated validation for better scalability.
 * @param res - Candidate Express response.
 * @throws Returns typed validation errors when methods are missing to keep callers honest.
 */
function validateResponseObject(res: unknown): asserts res is Response {
  // Fast path: return if already validated
  if (validatedResponseCache.has(res as Response)) {
    return;
  }

  if (!res || typeof res !== 'object') {
    throw createTypedError(
      'Invalid response object: must be an object',
      ErrorTypes.VALIDATION,
      'INVALID_RESPONSE_OBJECT'
    );
  }

  const responseObj = res as Response;
  if (typeof responseObj.status !== 'function') {
    throw createTypedError(
      'Invalid response object: missing status() method',
      ErrorTypes.VALIDATION,
      'MISSING_STATUS_METHOD'
    );
  }
  if (typeof responseObj.json !== 'function') {
    throw createTypedError(
      'Invalid response object: missing json() method',
      ErrorTypes.VALIDATION,
      'MISSING_JSON_METHOD'
    );
  }
  if (typeof responseObj.send !== 'function') {
    throw createTypedError(
      'Invalid response object: missing send() method',
      ErrorTypes.VALIDATION,
      'MISSING_SEND_METHOD'
    );
  }

  // Cache the validated response for future use
  validatedResponseCache.add(responseObj);
}

// Reusable error response template to reduce object allocation
const createErrorResponse = (
  statusCode: KnownStatusCode,
  message: unknown,
  requestId: string,
  errorId?: string
): ErrorEnvelope => ({
  error: {
    type: getErrorType(statusCode),
    message: sanitizeResponseMessage(message, getDefaultMessage(statusCode)),
    timestamp: getTimestamp(),
    requestId,
    ...(errorId && { errorId }),
  },
});

/**
 * Sends a structured error response with consistent formatting.
 * Optimized for scalability with reduced object allocation.
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
  error: Error | null = null
): Response<ErrorEnvelope> => {
  const requestId = generateRequestId();
  try {
    validateResponseObject(res);

    const errorId = error ? generateRequestId() : undefined;
    const response = createErrorResponse(statusCode, message, requestId, errorId);

    return res.status(statusCode).json(response);
  } catch (err) {
    qerrors.qerrors(err as Error, 'http-utils.sendErrorResponse', {
      statusCode,
      hasError: error !== undefined,
      errorType:
        error && typeof error === 'object' && 'type' in error ? (error as any).type : undefined,
      responseSent: false,
    });

    // Fallback response with minimal allocation
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

const errorTypeMap: Record<KnownStatusCode, HttpErrorType> = {
  400: 'BAD_REQUEST',
  401: 'AUTHENTICATION_ERROR',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

// Simple rate limiting for API scalability
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries periodically - store timer reference for cleanup
    this.cleanupTimer = setInterval(() => this.cleanup(), this.windowMs);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.requests.get(identifier);
    if (!timestamps) {
      timestamps = [];
      this.requests.set(identifier, timestamps);
    }

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
    this.requests.set(identifier, validTimestamps);

    // Check if under the limit
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    // Add current request timestamp
    validTimestamps.push(now);
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }

  /**
   * Cleanup method to prevent memory leaks
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.requests.clear();
  }

export const checkRateLimit = (identifier: string): boolean => {
  return rateLimiter.isAllowed(identifier);
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
    qerrors.qerrors(error as Error, 'http-utils.sanitizeResponseMessage', {
      messageType: typeof message,
      hasFallback: fallback !== undefined,
      messageLength: typeof message === 'string' ? message.length : undefined,
    });
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
 * Sends a 400 bad request payload with consistent formatting.
 */
const sendBadRequest = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 400, message ?? 'Bad request'); // Provide clear feedback for malformed requests
};

/**
 * Sends a 400 validation error payload including optional details.
 */
const sendValidationError = (
  res: Response,
  message: unknown,
  details?: unknown
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
 * Sends a 200 success payload with consistent formatting.
 */
const sendSuccess = (
  res: Response,
  message: string,
  data?: unknown
): Response<{ message: string; timestamp: string; data?: unknown }> => {
  const payload = {
    message: sanitizeResponseMessage(message, 'Operation completed successfully'),
    timestamp: getTimestamp(),
    ...(data !== undefined && { data }),
  };
  return res.status(200).json(payload);
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
        message: sanitizeResponseMessage(
          message ?? 'Authentication required',
          'Authentication required'
        ),
        timestamp: getTimestamp(),
        requestId,
      },
    }; // Align payload with other helpers for predictability
    return res.status(401).json(response); // Respond with 401 to trigger client auth flows
  } catch (error) {
    qerrors.qerrors(error as Error, 'http-utils.sendAuthenticationErrorResponse', {
      statusCode: 401,
      hasMessage: message !== undefined,
      hasRequestId: requestId !== undefined,
      securityEvent: true,
    });
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
  sendBadRequest,
  sendValidationError,
  sendSuccess,
  sendAuthError,
  sendErrorResponse,
  validateResponseObject,
  sanitizeResponseMessage,
  getTimestamp,
  generateRequestId,
};
