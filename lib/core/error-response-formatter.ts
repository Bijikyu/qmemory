/**
 * Error Response Formatters
 * Standardized response creation for different error types
 */

import { Response } from 'express';
import type { ErrorContext, ErrorResponse, StandardResponse } from './error-handler-types.js';
import { getTimestamp } from '../common-patterns';

export class ErrorResponseFormatter {
  /**
   * Create base error response structure
   * Extracts common pattern used across all error formatters
   */
  private static createBaseErrorResponse(
    type: string,
    message: string,
    context?: ErrorContext,
    details?: unknown
  ): ErrorResponse {
    return {
      error: {
        type,
        message,
        timestamp: getTimestamp(),
        requestId: context?.requestId,
        ...(details && { details }),
      },
    };
  }

  /**
   * Format database error response
   */
  static formatDatabaseError(
    error: unknown,
    operation: string,
    context?: ErrorContext
  ): ErrorResponse {
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Database operation failed'
        : error instanceof Error
          ? error.message
          : 'Unknown database error';

    const details =
      process.env.NODE_ENV !== 'production'
        ? {
            operation,
            originalError: error instanceof Error ? error.stack : String(error),
          }
        : undefined;

    return ErrorResponseFormatter.createBaseErrorResponse(
      'DATABASE_ERROR',
      message,
      context,
      details
    );
  }

  /**
   * Format validation error response
   */
  static formatValidationError(error: Error, context?: ErrorContext): ErrorResponse {
    const message =
      process.env.NODE_ENV === 'production' ? 'Invalid input provided' : error.message;
    return ErrorResponseFormatter.createBaseErrorResponse('VALIDATION_ERROR', message, context);
  }

  /**
   * Format authentication error response
   */
  static formatAuthError(error: Error, context?: ErrorContext): ErrorResponse {
    return ErrorResponseFormatter.createBaseErrorResponse(
      'AUTH_ERROR',
      'Authentication required',
      context
    );
  }

  /**
   * Format not found error response
   */
  static formatNotFoundError(resource: string, context?: ErrorContext): ErrorResponse {
    return ErrorResponseFormatter.createBaseErrorResponse(
      'NOT_FOUND',
      `${resource} not found`,
      context
    );
  }

  /**
   * Format conflict error response
   */
  static formatConflictError(message: string, context?: ErrorContext): ErrorResponse {
    return ErrorResponseFormatter.createBaseErrorResponse('CONFLICT', message, context);
  }

  /**
   * Format internal server error response
   */
  static formatInternalError(
    error: unknown,
    operation: string,
    context?: ErrorContext
  ): ErrorResponse {
    const message =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Unknown error';

    const details =
      process.env.NODE_ENV !== 'production'
        ? {
            operation,
            originalError: error instanceof Error ? error.stack : String(error),
          }
        : undefined;

    return ErrorResponseFormatter.createBaseErrorResponse(
      'INTERNAL_ERROR',
      message,
      context,
      details
    );
  }

  /**
   * Create standard success response
   */
  static createSuccessResponse<T>(data?: T, context?: ErrorContext): StandardResponse<T> {
    return {
      success: true,
      data,
      timestamp: getTimestamp(),
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
      timestamp: getTimestamp(),
      requestId: context?.requestId,
    };
  }
}
