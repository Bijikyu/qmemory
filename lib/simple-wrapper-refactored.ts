/**
 * Logger interface providing basic logging capabilities
 *
 * This module provides consistent logging across different environments.
 * Single Responsibility: Logging functionality
 */
export const logger = {
  /**
   * Logs informational messages with optional metadata
   * @param message - The message to log
   * @param meta - Optional additional context or metadata
   */
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),

  /**
   * Logs warning messages with optional metadata
   * @param message - The warning message to log
   * @param meta - Optional additional context or metadata
   */
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),

  /**
   * Logs error messages with optional metadata
   * @param message - The error message to log
   * @param meta - Optional additional context or metadata
   */
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),

  /**
   * Logs debug messages with optional metadata
   * @param message - The debug message to log
   * @param meta - Optional additional context or metadata
   */
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

/**
 * Error type classifications for consistent error handling
 */
export const ErrorTypes = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Error factory for creating typed errors with context
 */
export const ErrorFactory = {
  /**
   * Creates a typed error with optional context
   * @param type - Error type classification
   * @param message - Human-readable error message
   * @param context - Optional additional context for debugging
   * @returns Error object with type and context attached
   */
  createTypedError: (type: string, message: string, context?: any): Error => {
    const error = new Error(message) as any;
    error.type = type;
    error.context = context;
    return error;
  },

  /**
   * Convenience export for creating typed errors
   */
  createTypedError: ErrorFactory.createTypedError,
};
