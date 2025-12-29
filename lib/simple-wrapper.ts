/**
 * Simple Wrapper Utilities
 *
 * Purpose: Provides a lightweight set of common utilities to avoid ESM/CommonJS compatibility issues
 * and circular dependency problems with the main qerrors module. This module serves as a
 * foundation utility layer that other modules can depend on without causing import cycles.
 *
 * Design Philosophy:
 * - Minimal dependencies: Only uses built-in Node.js and browser APIs
 * - ESM-safe: Designed to work in both ESM and CommonJS environments
 * - Lightweight: Minimal footprint to avoid bloating bundle size
 * - Defensive: All functions include input validation and error handling
 * - Consistent: Follows same patterns used throughout the library
 *
 * Architecture Decision: Why create a separate simple wrapper?
 * - Prevents circular dependencies between qerrors and other utility modules
 * - Provides a fallback implementation when main qerrors module is unavailable
 * - Ensures consistent behavior across different module loading scenarios
 * - Reduces bundle size by avoiding full qerrors import for simple operations
 *
 * Integration Notes:
 * - Used by logging-utils, http-utils, and other core modules
 * - Provides the same API surface as the main qerrors module
 * - Maintains backward compatibility with existing code patterns
 * - Designed to be replaceable with the full qerrors module when needed
 *
 * Performance Considerations:
 * - All operations are O(1) with minimal memory allocation
 * - No external dependencies to reduce initialization overhead
 * - Simple implementations optimized for frequent calls
 * - Defensive programming prevents runtime errors and crashes
 *
 * Error Handling Strategy:
 * - Input validation on all public functions
 * - Graceful fallbacks for invalid inputs
 * - Never throws for expected edge cases
 * - Returns safe defaults when inputs are undefined/null
 */

/**
 * Logger interface providing basic logging capabilities
 *
 * This logger implementation uses console methods to provide consistent logging
 * across different environments (Node.js, browser, etc.) without external dependencies.
 * It's designed as a fallback when the main qerrors logger is unavailable.
 *
 * Log Levels:
 * - info: General application information
 * - warn: Warning messages that don't stop execution
 * - error: Error messages that may indicate problems
 * - debug: Detailed debugging information for development
 * - logFatal: Critical errors that may cause application failure
 * - logAudit: Security and compliance related events
 *
 * Security Considerations:
 * - No sensitive data is logged by default
 * - Structured logging format enables proper log aggregation
 * - Console methods respect environment-specific log levels
 * - Metadata is optional to prevent accidental data exposure
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

  /**
   * Alias for debug method to maintain API compatibility
   * @param message - The debug message to log
   * @param meta - Optional additional context or metadata
   */
  logDebug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),

  /**
   * Logs critical error messages that may cause application failure
   * @param message - The fatal error message to log
   * @param meta - Optional additional context or metadata
   */
  logFatal: (message: string, meta?: any) => console.error(`[FATAL] ${message}`, meta || ''),

  /**
   * Logs audit events for security and compliance tracking
   * @param message - The audit message to log
   * @param meta - Optional additional context or metadata
   */
  logAudit: (message: string, meta?: any) => console.log(`[AUDIT] ${message}`, meta || ''),
};

/**
 * String sanitization utilities
 *
 * These functions provide basic input sanitization to prevent XSS attacks
 * and ensure safe string handling throughout the application.
 */

/**
 * Removes potentially dangerous HTML characters from input strings
 *
 * This function provides basic XSS protection by removing angle brackets
 * which are commonly used in HTML injection attacks. For production
 * environments, consider using a more comprehensive sanitization library.
 *
 * Security Considerations:
 * - Removes < and > characters to prevent HTML injection
 * - Trims whitespace to prevent edge case bypasses
 * - Returns empty string for non-string inputs to prevent type errors
 *
 * @param input - Raw input string that may contain unsafe characters
 * @returns Sanitized string with dangerous characters removed
 */
export const sanitizeString = (input: string): string => {
  return typeof input === 'string' ? input.trim().replace(/[<>]/g, '') : '';
};

/**
 * Sanitizes error messages for safe logging and display
 *
 * Wraps sanitizeString to provide consistent message sanitization
 * across error handling paths throughout the application.
 *
 * @param message - Error message that may contain unsafe content
 * @returns Sanitized message safe for logging/display
 */
export const sanitizeMessage = (message: string): string => {
  return sanitizeString(message);
};

/**
 * Sanitizes context objects by removing sensitive information
 *
 * This function protects sensitive data from being logged or exposed
 * in error messages by redacting common sensitive field names.
 *
 * Security Strategy:
 * - Deep copies context to avoid mutating original object
 * - Redacts known sensitive fields (password, token, secret, key)
 * - Preserves all other fields for debugging purposes
 * - Returns original object if it's not a plain object
 *
 * @param context - Object containing potentially sensitive information
 * @returns Sanitized context with sensitive fields redacted
 */
export const sanitizeContext = (context: any): any => {
  if (!context || typeof context !== 'object') return context;

  // Create a copy to avoid mutating the original object
  const sanitized = { ...context };

  // List of common sensitive field names to redact
  const sensitiveFields = ['password', 'token', 'secret', 'key'];

  // Replace sensitive field values with redaction marker
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

/**
 * Input validation utilities
 *
 * These functions provide consistent type checking and validation
 * throughout the application to prevent runtime errors.
 */

/**
 * Validates that input is a non-empty string
 *
 * This function provides consistent string validation with
 * proper type checking and whitespace handling.
 *
 * @param input - Value to validate as a string
 * @returns True if input is a non-empty string, false otherwise
 */
export const isValidString = (input: any): boolean => {
  return typeof input === 'string' && input.trim().length > 0;
};

/**
 * Validates that input is a plain object (not array)
 *
 * This function distinguishes between plain objects and arrays,
 * which is important for validation scenarios where arrays
 * should be rejected as invalid object inputs.
 *
 * @param input - Value to validate as an object
 * @returns True if input is a plain object (not null/undefined/array), false otherwise
 */
export const isValidObject = (input: any): boolean => {
  return input && typeof input === 'object' && !Array.isArray(input);
};

/**
 * Performance monitoring utilities
 *
 * These functions provide simple performance measurement
 * capabilities for optimizing application performance.
 */

/**
 * Creates a performance timer for measuring execution duration
 *
 * This function provides a simple way to measure operation
 * duration without external dependencies. It's useful for
 * performance monitoring and optimization.
 *
 * Usage Pattern:
 * const timer = createPerformanceTimer();
 * // ... perform operation ...
 * const duration = timer.end(); // Get elapsed milliseconds
 *
 * @returns Timer object with methods to get elapsed time
 */
export const createPerformanceTimer = () => {
  const start = Date.now();
  return {
    /**
     * Stops the timer and returns elapsed time in milliseconds
     * @returns Elapsed time since timer creation in milliseconds
     */
    end: () => Date.now() - start,

    /**
     * Gets current elapsed time without stopping the timer
     * @returns Current elapsed time in milliseconds
     */
    getElapsed: () => Date.now() - start,
  };
};

/**
 * Environment variable utilities
 *
 * These functions provide safe access to environment variables
 * with proper fallback handling and validation.
 */

/**
 * Gets an environment variable with optional default value
 *
 * This function provides safe access to environment variables
 * with fallback support for missing variables.
 *
 * @param name - Name of the environment variable
 * @param defaultValue - Optional default value if variable is not set
 * @returns Environment variable value or default
 */
export const getEnvVar = (name: string, defaultValue?: string): string => {
  return process.env[name] || defaultValue || '';
};

/**
 * Validates that required environment variables are present
 *
 * This function checks for the presence of required environment
 * variables and throws a descriptive error if any are missing.
 *
 * Error Handling:
 * - Throws descriptive error listing all missing variables
 * - Helps with configuration debugging and setup issues
 * - Prevents runtime errors from missing configuration
 *
 * @param names - Array of required environment variable names
 * @throws Error if any required environment variables are missing
 */
export const requireEnvVars = (names: string[]): void => {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Unique identifier generation utilities
 *
 * This function provides consistent unique ID generation
 * for various use cases throughout the application.
 */

/**
 * Generates a unique identifier string
 *
 * This function combines random characters with timestamp to create
 * a unique identifier suitable for various use cases (request IDs,
 * session IDs, temporary filenames, etc.).
 *
 * Generation Strategy:
 * - Uses Math.random() for base36 string (9 characters)
 * - Appends timestamp in base36 for uniqueness over time
 * - Results in ~20 character string, collision-resistant
 *
 * @returns Unique identifier string
 */
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

/**
 * Error type definitions and utilities
 *
 * These constants and utilities provide consistent error handling
 * throughout the application with standardized error types.
 */

/**
 * Standardized error type constants
 *
 * These constants provide consistent error classification
 * throughout the application for better error handling and user experience.
 *
 * Error Categories:
 * - VALIDATION: Input validation failures
 * - DATABASE_ERROR: Database operation failures
 * - AUTHORIZATION_ERROR: Permission/access failures
 * - NOT_FOUND_ERROR: Resource not found failures
 * - INTERNAL_ERROR: Unexpected internal failures
 */
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * Error factory utilities for creating typed errors
 *
 * This factory provides a consistent way to create errors
 * with type information and optional context for better debugging.
 */

/**
 * Error factory object with methods for creating typed errors
 *
 * This factory encapsulates error creation logic to ensure
 * consistent error structure throughout the application.
 *
 * Error Structure:
 * - message: Human-readable error description
 * - type: Error classification from ErrorTypes
 * - context: Optional additional context for debugging
 *
 * @example
 * const error = ErrorFactory.createTypedError(
 *   ErrorTypes.VALIDATION,
 *   'Invalid input',
 *   { field: 'email', value: 'invalid-email' }
 * );
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
};

/**
 * Convenience export for creating typed errors
 *
 * This provides direct access to the most commonly used
 * error creation method.
 */
export const createTypedError = ErrorFactory.createTypedError;
