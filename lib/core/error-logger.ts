/**
 * Error Logging Utilities
 * Reimplemented to use centralized logger - maintains backward compatibility
 */

import { createLogger, type LogContext } from './centralized-logger.js';
import type { ErrorContext } from './error-handler-types.js';

export class ErrorLogger {
  private static logger = createLogger('error-logger');

  /**
   * Log error with context information
   */
  static logError(message: string, error: Error, context?: ErrorContext): void {
    const logContext: LogContext = {
      operation: context?.operation || 'unknown',
      errorType: error.constructor.name,
      ...context,
    };

    this.logger.error(message, logContext);
  }

  /**
   * Log warning with context information
   */
  static logWarning(message: string, context?: ErrorContext): void {
    const logContext: LogContext = {
      operation: context?.operation || 'unknown',
      ...context,
    };

    this.logger.warn(message, logContext);
  }
}
