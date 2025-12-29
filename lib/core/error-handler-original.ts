/**
 * Error Handling Framework Module
 *
 * Purpose: Provides centralized error handling to eliminate duplicate error patterns
 * and ensure consistent error responses across the application. This framework
 * standardizes error formatting, logging, and response structures.
 *
 * Design Philosophy:
 * - Consistent responses: All errors follow the same structure and format
 * - Centralized logging: Single point for error logging and tracking
 * - Context preservation: Maintain request and operation context for debugging
 * - Type safety: TypeScript interfaces ensure consistent error handling
 * - Extensibility: Support for custom error types and additional context
 * - Integration ready: Works seamlessly with Express response handling
 *
 * Integration Notes:
 * - Used throughout application for error handling and response formatting
 * - Integrates with Express middleware for HTTP response handling
 * - Works with UnifiedLogger for centralized error logging
 * - Provides standard error response structure for API consistency
 * - Maintains error context throughout request lifecycle
 *
 * Performance Considerations:
 * - Minimal overhead: Simple object structures and string formatting
 * - Efficient context management: No expensive operations in error paths
 * - Fast response generation: Optimized for API response speed
 * - Memory efficient: Shared error structures prevent object creation overhead
 *
 * Error Handling Strategy:
 * - Standardized error types for consistent client handling
 * - Request ID tracking for debugging and monitoring
 * - Operation context for identifying error sources
 * - Timestamp preservation for temporal analysis
 * - Detailed error information for troubleshooting
 *
 * Architecture Decision: Why create custom error framework?
 * - Express default error handling is inconsistent and lacks context
 * - Need for standardized API error responses across all endpoints
 * - Requirement for centralized error logging and monitoring
 * - Custom error types better match our domain and use cases
 * - Provides foundation for automated error analysis and alerting
 *
 * @author System Architecture Team
 * @version 1.0.0 (Original Implementation)
 */

import { Response } from 'express';
import { UnifiedLogger } from './logger.js';

/**
 * Error context interface
 *
 * Defines the structure of additional context information that can
 * be included with errors to provide debugging and monitoring data.
 * This interface enables rich error context while maintaining flexibility.
 *
 * @interface ErrorContext
 */
export interface ErrorContext {
  operation?: string; // Operation name where error occurred
  userId?: string; // User identifier for user-specific error tracking
  requestId?: string; // Request ID for tracing across services
  [key: string]: unknown; // Additional context data for debugging
}

/**
 * Error response interface
 *
 * Defines the standard structure for error responses sent to clients.
 * This ensures all API errors follow a consistent format and include
 * necessary information for debugging and error handling.
 *
 * @interface ErrorResponse
 */
export interface ErrorResponse {
  error: {
    type: string; // Error type for client-side error categorization
    message: string; // Human-readable error message
    timestamp: string; // ISO timestamp for error occurrence
    requestId?: string; // Request ID for client-server debugging
    details?: any; // Additional error details for complex error scenarios
  };
}

/**
 * Standard response interface
 *
 * Defines the standard structure for all API responses, ensuring
 * consistent format across all endpoints. This interface supports
 * both successful and error responses while maintaining type safety.
 *
 * @interface StandardResponse
 * @template T - Type of success response data
 */
export interface StandardResponse<T = any> {
  success: boolean; // Response success indicator
  data?: T; // Success response payload data
  error?: ErrorResponse['error']; // Error information if success is false
  timestamp: string; // Response timestamp for client-side timing
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
