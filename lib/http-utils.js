/**
 * HTTP Utility Functions
 * Common HTTP response helpers for Express applications
 * 
 * This module centralizes HTTP response handling to ensure consistency
 * across the application and reduce boilerplate code in route handlers.
 * By standardizing response formats, we improve API consistency and
 * make error handling more predictable for API consumers.
 * 
 * Design philosophy:
 * - Centralize common response patterns to avoid duplication
 * - Provide consistent error message formats across the API
 * - Simplify controller logic by abstracting HTTP response details
 * - Enable easy modification of response formats in a single location
 * 
 * Future extensions could include:
 * - Additional status code helpers (sendBadRequest, sendUnauthorized, etc.)
 * - Response formatting middleware
 * - Logging integration for error tracking
 */

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
  // Send standardized 404 Not Found response with custom message
  // This centralizes error response formatting and ensures consistency
  return res.status(404).json({ message: message }); // Returns res for chaining
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
  return res.status(409).json({ message: message }); // Follows same pattern as sendNotFound
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
  return res.status(500).json({ message: message }); // Indicates unexpected failure to client
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
  return res.status(503).json({ message: message }); // For dependency outages or maintenance
}

// Export using object shorthand for clean module interface
// This pattern allows for easy extension with additional HTTP utilities
// while maintaining a simple import structure for consumers
module.exports = {
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable
};