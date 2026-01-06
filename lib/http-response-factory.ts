/**
 * HTTP Response Factory
 *
 * Purpose: Eliminates duplicate HTTP response patterns across the codebase.
 * Addresses the "HTTP Error Response Structure Pattern" (30+ occurrences)
 * and "Express Response Validation Pattern" (20+ occurrences) identified in wet-code analysis.
 *
 * Design Principles:
 * - Consistent HTTP response formats
 * - Express.js integration
 * - Type-safe response handling
 * - Standardized error structures
 */

import type { Response } from 'express';
import { createModuleUtilities, validateResponse } from './common-patterns';
import { generateUniqueId } from './simple-wrapper';

// Standard error response structure
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    timestamp: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

// Standard success response structure
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// Response factory
export const createResponseFactory = (module: string) => {
  const utils = createModuleUtilities(module);

  // Generate unique request ID
  const generateRequestId = (): string => {
    return generateUniqueId();
  };

  // Validate Express response object using common utility
  const validateResponse = (res: Response): void => {
    utils.validateResponse(res, 'validateResponse');
    // Additional check for json method
    if (typeof res.json !== 'function') {
      throw new Error('Express response object missing json() method');
    }
  };

  // Create standardized error response
  const createErrorResponse = (
    type: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    requestId?: string
  ): ErrorResponse => {
    return {
      error: {
        type,
        message,
        timestamp: new Date().toISOString(),
        requestId: requestId || generateRequestId(),
        details,
      },
    };
  };

  // Create standardized success response
  const createSuccessResponse = <T>(data: T, requestId?: string): SuccessResponse<T> => {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
    };
  };

  // Send error response
  const sendError = (
    res: Response,
    type: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    functionName: string = 'sendError'
  ): Response => {
    utils.debugLog(`Sending ${type} error`, { type, message, statusCode, details });

    validateResponse(res);
    const errorResponse = createErrorResponse(type, message, statusCode, details);

    return res.status(statusCode).json(errorResponse);
  };

  // Send success response
  const sendSuccess = <T>(
    res: Response,
    data: T,
    statusCode: number = 200,
    functionName: string = 'sendSuccess'
  ): Response => {
    utils.debugLog('Sending success response', { statusCode });

    validateResponse(res);
    const successResponse = createSuccessResponse(data);

    return res.status(statusCode).json(successResponse);
  };

  // Common error responses
  const errors = {
    // Validation error (400)
    validation: (
      res: Response,
      message: string = 'Invalid input',
      details?: Record<string, unknown>
    ) => sendError(res, 'VALIDATION_ERROR', message, 400, details, 'validation'),

    // Unauthorized error (401)
    unauthorized: (res: Response, message: string = 'Unauthorized') =>
      sendError(res, 'UNAUTHORIZED', message, 401, undefined, 'unauthorized'),

    // Forbidden error (403)
    forbidden: (res: Response, message: string = 'Forbidden') =>
      sendError(res, 'FORBIDDEN', message, 403, undefined, 'forbidden'),

    // Not found error (404)
    notFound: (res: Response, message: string = 'Resource not found') =>
      sendError(res, 'NOT_FOUND', message, 404, undefined, 'notFound'),

    // Conflict error (409)
    conflict: (res: Response, message: string = 'Resource conflict') =>
      sendError(res, 'CONFLICT', message, 409, undefined, 'conflict'),

    // Internal server error (500)
    internal: (
      res: Response,
      message: string = 'Internal server error',
      details?: Record<string, unknown>
    ) => sendError(res, 'INTERNAL_ERROR', message, 500, details, 'internal'),

    // Database error (500)
    database: (
      res: Response,
      message: string = 'Database operation failed',
      details?: Record<string, unknown>
    ) => sendError(res, 'DATABASE_ERROR', message, 500, details, 'database'),

    // Service unavailable (503)
    serviceUnavailable: (res: Response, message: string = 'Service temporarily unavailable') =>
      sendError(res, 'SERVICE_UNAVAILABLE', message, 503, undefined, 'serviceUnavailable'),
  };

  // Common success responses
  const successes = {
    // OK response (200)
    ok: <T>(res: Response, data: T) => sendSuccess(res, data, 200, 'ok'),

    // Created response (201)
    created: <T>(res: Response, data: T) => sendSuccess(res, data, 201, 'created'),

    // No content response (204)
    noContent: (res: Response) => {
      utils.debugLog('Sending no content response');
      validateResponse(res);
      return res.status(204).send();
    },

    // Accepted response (202)
    accepted: <T>(res: Response, data: T) => sendSuccess(res, data, 202, 'accepted'),
  };

  return {
    utils,
    generateRequestId,
    validateResponse,
    createErrorResponse,
    createSuccessResponse,
    sendError,
    sendSuccess,
    errors,
    successes,
  };
};

// Export types
export type ResponseFactory = ReturnType<typeof createResponseFactory>;
