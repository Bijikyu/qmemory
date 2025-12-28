/**
 * Error Logging Utilities
 * Centralized logging functionality for error tracking and debugging
 */

import { UnifiedLogger } from './logger.js';
import type { ErrorContext } from './error-handler-types.js';

export class ErrorLogger {
  private static logger = UnifiedLogger.getInstance();

  /**
   * Log error with context information
   */
  static logError(message: string, error: Error, context?: ErrorContext): void {
    const logContext = {
      operation: context?.operation || 'unknown',
      errorType: error.constructor.name,
      ...context,
    };

    ErrorLogger.logger.logError(message, error, logContext);
  }

  /**
   * Log warning with context information
   */
  static logWarning(message: string, context?: ErrorContext): void {
    const logContext = {
      operation: context?.operation || 'unknown',
      ...context,
    };

    ErrorLogger.logger.logWarn(message, logContext);
  }
}
