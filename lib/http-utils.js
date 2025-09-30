/**
 * HTTP Utility Functions
 * Common HTTP response helpers for Express applications
 *
 * Centralizes HTTP response handling to ensure consistency across the
 * application and reduce boilerplate. Now integrates qgenutils for
 * environment-aware logging and robust input sanitization.
 *
 * Design philosophy:
 * - Centralize common response patterns to avoid duplication
 * - Provide consistent error message formats across the API
 * - Simplify controller logic by abstracting HTTP response details
 * - Enable easy modification of response formats in a single location
 */

const { sanitizeString, isValidString, logger } = require('./qgenutils-wrapper');

/**
 * Validates Express response object for HTTP utility functions
 * 
 * Centralized validation prevents runtime errors when HTTP utilities
 * are called with invalid parameters. This helper ensures all HTTP
 * functions receive valid Express response objects.
 * 
 * @param {Object} res - Express response object to validate
 * @throws {Error} When response object is invalid or missing required methods
 */
function validateResponseObject(res) { // validate object has expected methods for Express
  if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') { // confirm res has status() and json() functions
    throw new Error('Invalid Express response object provided'); // throw explicit error to prevent silent failures
  }
}

/**
 * Sanitizes and formats message with fallback for HTTP responses
 * 
 * Standardizes message handling across all HTTP utilities by trimming
 * whitespace and providing fallback messages when input is invalid.
 * 
 * @param {string} message - Input message to sanitize
 * @param {string} fallback - Default message when input is invalid
 * @returns {string} Sanitized message or fallback
 */
function sanitizeMessage(message, fallback) { // ensure clean error text for responses
  try {
    if (!isValidString || typeof isValidString !== 'function') {
      // Fallback to simple behavior if validation not available
      const str = typeof message === 'string' ? message.trim() : '';
      return str || fallback;
    }

    if (!isValidString(message)) {
      return fallback;
    }

    const sanitized = sanitizeString ? sanitizeString(message) : String(message);
    const trimmed = sanitized.trim();
    return trimmed || fallback;
  } catch (err) {
    // Never throw from sanitization
    logger && logger.warn && logger.warn('sanitizeMessage failed, using fallback', { error: err.message });
    return fallback;
  }
}

/**
 * Generates ISO timestamp for HTTP response consistency
 * 
 * Centralizes timestamp generation to ensure consistent format
 * across all HTTP responses and enable future format changes.
 * 
 * @returns {string} ISO 8601 formatted timestamp
 */
function getTimestamp() { // create consistent timestamp for logs and responses
  return new Date().toISOString(); // ISO format chosen for cross-system compatibility
}

/**
 * Sends a 404 Not Found response with a custom message
 * 
 * This utility standardizes 404 responses across the application,
 * ensuring consistent error formatting and reducing boilerplate in
 * route handlers. It follows REST API conventions by providing
 * both an appropriate status code and descriptive error message.
 * 
 * Design rationale:
 * - Uses 404 status code which is the standard HTTP response for "resource not found"
 * - Provides JSON response format for consistency with API expectations
 * - Accepts custom message to allow context-specific error descriptions
 * - Encapsulates response logic to keep controllers focused on business logic
 * 
 * Usage pattern: This function is typically called when database queries
 * return null/undefined, indicating the requested resource doesn't exist
 * or the user doesn't have permission to access it.
 * 
 * Alternative approaches considered:
 * - Throwing errors instead of direct response: would require additional error handling middleware
 * - Including error codes: adds complexity that may not be needed for simple cases
 * - Template-based messages: more complex but could provide better internationalization
 * 
 * @param {Object} res - Express response object used to send the HTTP response
 * @param {string} message - Custom error message describing what was not found
 */
function sendNotFound(res, message) {
  // Input validation for production safety - ensure valid Express response object
  // This prevents runtime errors when called with invalid parameters
  validateResponseObject(res);
  
  // Send standardized 404 Not Found response with custom message
  // 404 is the correct HTTP status for "resource not found" scenarios
  // This centralizes error response formatting and ensures consistency across all endpoints
  return res.status(404).json({
    message: sanitizeMessage(message, 'Resource not found'), // message gives client context while preventing injection via sanitize
    timestamp: getTimestamp() // timestamp aids log correlation for debugging
  }); // Return response object for method chaining in Express route handlers
}

/**
 * Sends a 409 Conflict response with a custom message
 * 
 * Standardizes conflict responses for duplicate resource creation attempts.
 * Used when uniqueness constraints are violated or resource conflicts occur.
 * 
 * @param {Object} res - Express response object used to send the HTTP response
 * @param {string} message - Custom error message describing the conflict
 */
function sendConflict(res, message) {
  // Input validation for production safety - ensure valid response object
  validateResponseObject(res);
  
  return res.status(409).json({
    message: sanitizeMessage(message, 'Resource conflict'), // message clarifies duplicate or conflicting request
    timestamp: getTimestamp() // timestamp documents when conflict occurred
  }); // Follows same pattern as sendNotFound - now with validation and timestamp
}

/**
 * Sends a 500 Internal Server Error response with a custom message
 * 
 * Standardizes internal server error responses for unexpected failures.
 * Used when server-side problems occur that aren't client-related.
 * 
 * @param {Object} res - Express response object used to send the HTTP response
 * @param {string} message - Custom error message describing the internal error
 */
function sendInternalServerError(res, message) {
  // Input validation for production safety - ensure valid Express response object
  // Critical for preventing crashes when called with malformed parameters
  validateResponseObject(res);
  
  // Log errors for monitoring and debugging - always log 500s for investigation
  // Stack trace included to help identify source of unexpected errors
  // Structured error logging without leaking details to clients
  if (logger && logger.error) {
    logger.error('Internal server error', {
      message: isValidString && isValidString(message) ? sanitizeMessage(message, 'Internal server error') : 'Internal server error',
      timestamp: getTimestamp(),
      stack: new Error().stack
    });
  }
  
  return res.status(500).json({
    message: sanitizeMessage(message, 'Internal server error'), // message keeps user informed without leaking server internals
    timestamp: getTimestamp() // timestamp records when the error occurred for log lookup
  }); // 500 status indicates server-side failure requiring investigation
}

/**
 * Sends a 503 Service Unavailable response with a custom message
 * 
 * Standardizes service unavailable responses for dependency failures.
 * Used when external services (like databases) are temporarily unavailable.
 * 
 * @param {Object} res - Express response object used to send the HTTP response
 * @param {string} message - Custom error message describing the unavailable service
 */
function sendServiceUnavailable(res, message) {
  // Input validation for production safety - ensure valid Express response object
  // Essential for preventing failures when dependencies are down
  validateResponseObject(res);
  
  // Log service unavailable events for monitoring and alerting
  // WARN level appropriate for dependency issues that require attention
  if (logger && logger.warn) {
    logger.warn('Service unavailable', {
      message: isValidString && isValidString(message) ? sanitizeMessage(message, 'Service temporarily unavailable') : 'Service temporarily unavailable',
      timestamp: getTimestamp()
    });
  }
  
  return res.status(503).json({
    message: sanitizeMessage(message, 'Service temporarily unavailable'), // message informs client of temporary outage without internals
    timestamp: getTimestamp(), // timestamp helps track service downtime periods
    retryAfter: '300' // Retry-After header value indicates when the client may retry
  }); // 503 status indicates temporary service disruption, not permanent failure
}

// Export using object shorthand for clean module interface
// This pattern allows for easy extension with additional HTTP utilities
// while maintaining a simple import structure for consumers
module.exports = {
  sendNotFound,           // helper for 404 responses
  sendConflict,           // helper for 409 responses
  sendInternalServerError, // helper for 500 responses
  sendServiceUnavailable,  // helper for 503 responses
  
  // Utility functions that apps might find useful for building custom HTTP helpers
  validateResponseObject, // validates Express response objects
  sanitizeMessage,        // sanitizes error messages for safe client responses
  getTimestamp           // generates consistent ISO timestamp strings
};
