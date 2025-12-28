/**
 * Error Response Formatters
 * Standardized response creation for different error types
 */

import { Response } from 'express';
import type { ErrorContext, ErrorResponse, StandardResponse } from './error-handler-types.js';

export class ErrorResponseFormatter {
  /**
   * Format database error response
   */
  static formatDatabaseError(
    error: unknown,
    operation: string,
    context?: ErrorContext
  ): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        type: 'DATABASE_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Database operation failed'
            : error instanceof Error
              ? error.message
              : 'Unknown database error',
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
        details:
          process.env.NODE_ENV !== 'production'
            ? {
                operation,
                originalError: error instanceof Error ? error.stack : String(error),
              }
            : undefined,
      },
    };

    return errorResponse;
  }

  /**
   * Format validation error response
   */
  static formatValidationError(error: Error, context?: ErrorContext): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        type: 'VALIDATION_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Invalid input provided' : error.message,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    return errorResponse;
  }

  /**
   * Format authentication error response
   */
  static formatAuthError(error: Error, context?: ErrorContext): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        type: 'AUTH_ERROR',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    return errorResponse;
  }

  /**
   * Format not found error response
   */
  static formatNotFoundError(resource: string, context?: ErrorContext): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        type: 'NOT_FOUND',
        message: `${resource} not found`,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    return errorResponse;
  }

  /**
   * Format conflict error response
   */
  static formatConflictError(message: string, context?: ErrorContext): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        type: 'CONFLICT',
        message,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    return errorResponse;
  }

  /**
   * Format internal server error response
   */
  static formatInternalError(
    error: unknown,
    operation: string,
    context?: ErrorContext
  ): ErrorResponse {
    const errorResponse: ErrorResponse = {
      error: {
        type: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error instanceof Error
              ? error.message
              : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
        details:
          process.env.NODE_ENV !== 'production'
            ? {
                operation,
                originalError: error instanceof Error ? error.stack : String(error),
              }
            : undefined,
      },
    };

    return errorResponse;
  }

  /**
   * Create standard success response
   */
  static createSuccessResponse<T>(data?: T, context?: ErrorContext): StandardResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
    };
  }

  /**
   * Create standard response
   */
  static createStandardResponse<T>(
    success: boolean,
    data?: T,
    error?: ErrorResponse['error'],
    context?: ErrorContext
  ): StandardResponse<T> {
    return {
      success,
      data,
      error,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId,
    };
  }
}
