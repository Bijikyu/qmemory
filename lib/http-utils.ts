/**
 * HTTP Utility Functions - Fixed Version
 *
 * Scalable HTTP utility functions using simple-wrapper.ts exports
 * to avoid the file corruption issues in the previous implementation.
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

// Reusable error response template to reduce object allocation
const createErrorResponse = (
  statusCode: number,
  message: unknown,
  requestId: string
): ErrorEnvelope => {
  const errorId = generateRequestId();
  return {
    error: {
      type: getErrorType(statusCode),
      message: message as string,
      timestamp: getTimestamp(),
      requestId,
      ...(errorId && { errorId }),
    },
  };
};

const errorTypeMap: Record<KnownStatusCode, HttpErrorType> = {
  400: 'BAD_REQUEST',
  401: 'AUTHENTICATION_ERROR',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

const defaultMessageMap: Record<KnownStatusCode, string> = {
  400: 'Bad request',
  401: 'Authentication required',
  404: 'Resource not found',
  409: 'Resource conflict',
  500: 'Internal server error',
  503: 'Service temporarily unavailable',
};

const getErrorType = (statusCode: KnownStatusCode): HttpErrorType => {
  return errorTypeMap[statusCode] ?? 'ERROR';
};

const getDefaultMessage = (statusCode: KnownStatusCode): string => {
  return defaultMessageMap[statusCode] ?? 'An error occurred';
};

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const generateRequestId = (): string => {
  return generateUniqueId();
};

/**
 * Sends a structured error response with consistent formatting.
 */
const sendErrorResponse = (
  res: Response,
  statusCode: KnownStatusCode,
  message: unknown,
  error: Error | null = null
): Response<ErrorEnvelope> => {
  const requestId = generateRequestId();

  try {
    // Validate response object
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

    const errorId = error ? generateRequestId() : undefined;
    const response = createErrorResponse(statusCode, message, requestId, errorId);

    return res.status(statusCode).json(response);
  } catch (err) {
    logger.error('Failed to send error response', {
      statusCode,
      hasError: error !== undefined,
      errorType:
        error && typeof error === 'object' && 'type' in error ? (error as any).type : undefined,
      responseSent: false,
    });

    // Fallback response
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

// HTTP response utility functions
const sendNotFound = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 404, message ?? 'Resource not found');
};

const sendConflict = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 409, message ?? 'Resource conflict');
};

const sendInternalServerError = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 500, message ?? 'Internal server error');
};

const sendServiceUnavailable = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 503, message ?? 'Service temporarily unavailable');
};

const sendBadRequest = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  return sendErrorResponse(res, 400, message ?? 'Bad request');
};

const sendValidationError = (
  res: Response,
  message: unknown,
  details?: unknown
): Response<ErrorEnvelope> => {
  const response: ErrorEnvelope = {
    error: {
      type: 'VALIDATION_ERROR',
      message: sanitizeString(message) || 'Validation failed',
      timestamp: getTimestamp(),
      requestId: generateRequestId(),
      details: details ?? null,
    },
  };
  return res.status(400).json(response);
};

const sendSuccess = (
  res: Response,
  message: string,
  data?: unknown
): Response<{ message: string; timestamp: string; data?: unknown }> => {
  const payload = {
    message: sanitizeString(message) || 'Operation completed successfully',
    timestamp: getTimestamp(),
    ...(data !== undefined && { data }),
  };
  return res.status(200).json(payload);
};

const sendAuthError = (res: Response, message?: unknown): Response<ErrorEnvelope> => {
  const requestId = generateRequestId();
  try {
    const response: ErrorEnvelope = {
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeString(message ?? 'Authentication required'),
        timestamp: getTimestamp(),
        requestId,
      },
    };
    return res.status(401).json(response);
  } catch (error) {
    logger.error('Failed to send authentication error response', {
      requestId,
      originalMessage: message,
      statusCode: 401,
      error: (error as Error).message,
      securityEvent: true,
    });
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
  sanitizeString,
  getTimestamp,
  generateRequestId,
  isValidString,
  isValidObject,
  ErrorTypes,
  ErrorFactory,
  createTypedError,
};
