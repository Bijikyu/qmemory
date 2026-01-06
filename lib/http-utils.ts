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

export const validateResponseObject = (res: any): void => {
  validateResponse(res, 'validateResponseObject');
};

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

const createErrorResponse = (
  statusCode: number,
  message: unknown,
  requestId: string
): ErrorEnvelope => {
  const errorId = generateUniqueId();
  return {
    error: {
      type: getErrorType(statusCode as KnownStatusCode),
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

const getErrorType = (statusCode: KnownStatusCode): HttpErrorType =>
  errorTypeMap[statusCode] ?? 'ERROR';
const getDefaultMessage = (statusCode: KnownStatusCode): string =>
  defaultMessageMap[statusCode] ?? 'An error occurred';

const sendErrorResponse = (
  res: Response,
  statusCode: KnownStatusCode,
  message: unknown,
  error: Error | null = null
): Response<ErrorEnvelope> => {
  const requestId = generateUniqueId();

  try {
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

    const errorId = error ? generateUniqueId() : undefined;
    const response = createErrorResponse(statusCode, message, requestId);

    return res.status(statusCode).json(response);
  } catch (err) {
    logger.error('Failed to send error response', {
      statusCode,
      hasError: error !== undefined,
      errorType:
        error && typeof error === 'object' && 'type' in error ? (error as any).type : undefined,
      responseSent: false,
    });

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

const sendNotFound = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 404, message ?? 'Resource not found');
const sendConflict = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 409, message ?? 'Resource conflict');
const sendInternalServerError = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 500, message ?? 'Internal server error');
const sendServiceUnavailable = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 503, message ?? 'Service temporarily unavailable');
const sendBadRequest = (res: Response, message?: unknown): Response<ErrorEnvelope> =>
  sendErrorResponse(res, 400, message ?? 'Bad request');

const sendValidationError = (
  res: Response,
  message: unknown,
  details?: unknown
): Response<ErrorEnvelope> => {
  const response: ErrorEnvelope = {
    error: {
      type: 'VALIDATION_ERROR',
      message: sanitizeString(message as string) || 'Validation failed',
      timestamp: getTimestamp(),
      requestId: generateUniqueId(),
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
  const requestId = generateUniqueId();
  try {
    const response: ErrorEnvelope = {
      error: {
        type: 'AUTHENTICATION_ERROR',
        message: sanitizeString((message as string) ?? 'Authentication required'),
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

const sendTooManyRequests = (
  res: Response,
  message: string = 'Rate limit exceeded',
  rateLimitInfo?: unknown
): Response<ErrorEnvelope> => {
  const requestId = generateUniqueId();
  try {
    const response: ErrorEnvelope & { rateLimit?: unknown } = {
      error: {
        type: 'ERROR',
        message: sanitizeString(message),
        timestamp: getTimestamp(),
        requestId,
      },
    };

    if (rateLimitInfo) {
      response.rateLimit = rateLimitInfo;
    }

    return res.status(429).json(response);
  } catch (error) {
    logger.error('Failed to send rate limit response', {
      requestId,
      originalMessage: message,
      statusCode: 429,
      error: (error as Error).message,
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
  sendTooManyRequests,
  sanitizeString,
  getTimestamp,
  generateUniqueId,
  isValidString,
  isValidObject,
  ErrorTypes,
  ErrorFactory,
  createTypedError,
};
