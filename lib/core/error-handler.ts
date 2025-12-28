/**
 * Error Handling Framework
 * Centralized error handling to eliminate duplicate error patterns
 */

import { Response } from 'express';
import { UnifiedLogger } from './logger.js';

export interface ErrorContext {
  operation?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
}

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
  timestamp: string;
  requestId?: string;
}

export class ErrorHandler {
  private static logger = UnifiedLogger.getInstance();

  /**
   * Handle database errors with consistent response format
   */
  static handleDatabaseError(
    error: unknown,
    operation: string,
    res?: Response,
    context?: ErrorContext
  ): ErrorResponse {
    const logContext = {
      operation,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      ...context,
    };

    this.logger.logError(
      `Database operation failed in ${operation}`,
      error instanceof Error ? error : new Error(String(error)),
      logContext
    );

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

    if (res) {
      res.status(500).json(errorResponse);
    }

    return errorResponse;
  }

  /**
   * Handle validation errors with consistent response format
   */
  static handleValidationError(
    error: Error,
    res?: Response,
    context?: ErrorContext
  ): ErrorResponse {
    const logContext = {
      operation: 'validation',
      validationError: error.message,
      ...context,
    };

    this.logger.logError('Validation failed', error, logContext);

    const errorResponse: ErrorResponse = {
      error: {
        type: 'VALIDATION_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Invalid input provided' : error.message,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    if (res) {
      res.status(400).json(errorResponse);
    }

    return errorResponse;
  }

  /**
   * Handle authentication/authorization errors
   */
  static handleAuthError(error: Error, res?: Response, context?: ErrorContext): ErrorResponse {
    const logContext = {
      operation: 'authentication',
      authError: error.message,
      ...context,
    };

    this.logger.logError('Authentication failed', error, logContext);

    const errorResponse: ErrorResponse = {
      error: {
        type: 'AUTH_ERROR',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    if (res) {
      res.status(401).json(errorResponse);
    }

    return errorResponse;
  }

  /**
   * Handle not found errors
   */
  static handleNotFoundError(
    resource: string,
    res?: Response,
    context?: ErrorContext
  ): ErrorResponse {
    const logContext = {
      operation: 'find',
      resource,
      ...context,
    };

    this.logger.logWarn(`Resource not found: ${resource}`, logContext);

    const errorResponse: ErrorResponse = {
      error: {
        type: 'NOT_FOUND',
        message: `${resource} not found`,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    if (res) {
      res.status(404).json(errorResponse);
    }

    return errorResponse;
  }

  /**
   * Handle conflict errors
   */
  static handleConflictError(
    message: string,
    res?: Response,
    context?: ErrorContext
  ): ErrorResponse {
    const logContext = {
      operation: 'conflict',
      conflictMessage: message,
      ...context,
    };

    this.logger.logWarn(`Conflict: ${message}`, logContext);

    const errorResponse: ErrorResponse = {
      error: {
        type: 'CONFLICT',
        message,
        timestamp: new Date().toISOString(),
        requestId: context?.requestId,
      },
    };

    if (res) {
      res.status(409).json(errorResponse);
    }

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
   * Create standard error response
   */
  static createStandardResponse<T = any>(
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

  /**
   * Handle generic errors with context
   */
  static handleError(
    error: unknown,
    operation: string,
    res?: Response,
    context?: ErrorContext
  ): ErrorResponse {
    const logContext = {
      operation,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      ...context,
    };

    this.logger.logError(
      `Operation failed in ${operation}`,
      error instanceof Error ? error : new Error(String(error)),
      logContext
    );

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

    if (res) {
      res.status(500).json(errorResponse);
    }

    return errorResponse;
  }
}
