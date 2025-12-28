/**
 * Refactored Error Handler
 * Coordinated error handling with separated concerns
 */

import { Response } from 'express';
import type { ErrorContext, ErrorResponse, StandardResponse } from './error-handler-types.js';
import { ErrorLogger } from './error-logger.js';
import { ErrorResponseFormatter } from './error-response-formatter.js';

/**
 * Orchestrated error handler - coordinates logging, formatting, and response
 */
export class ErrorHandler {
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

    ErrorLogger.logError(
      `Database operation failed in ${operation}`,
      error instanceof Error ? error : new Error(String(error)),
      logContext
    );

    const errorResponse = ErrorResponseFormatter.formatDatabaseError(error, operation, context);

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

    ErrorLogger.logError('Validation failed', error, logContext);

    const errorResponse = ErrorResponseFormatter.formatValidationError(error, context);

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

    ErrorLogger.logError('Authentication failed', error, logContext);

    const errorResponse = ErrorResponseFormatter.formatAuthError(error, context);

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

    ErrorLogger.logWarning(`Resource not found: ${resource}`, logContext);

    const errorResponse = ErrorResponseFormatter.formatNotFoundError(resource, context);

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

    ErrorLogger.logWarning(`Conflict: ${message}`, logContext);

    const errorResponse = ErrorResponseFormatter.formatConflictError(message, context);

    if (res) {
      res.status(409).json(errorResponse);
    }

    return errorResponse;
  }

  /**
   * Create standard success response
   */
  static createSuccessResponse<T>(data?: T, context?: ErrorContext): StandardResponse<T> {
    return ErrorResponseFormatter.createSuccessResponse(data, context);
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
    return ErrorResponseFormatter.createStandardResponse(success, data, error, context);
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

    ErrorLogger.logError(
      `Operation failed in ${operation}`,
      error instanceof Error ? error : new Error(String(error)),
      logContext
    );

    const errorResponse = ErrorResponseFormatter.formatInternalError(error, operation, context);

    if (res) {
      res.status(500).json(errorResponse);
    }

    return errorResponse;
  }
}
