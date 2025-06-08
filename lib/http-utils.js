
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
  // Set 404 status and send JSON response in one operation
  // JSON format ensures consistent API responses and easy client parsing
  // Custom message allows specific context (e.g., "User not found", "Document not found")
  res.status(404).json({ message });
}

// Export using object shorthand for clean module interface
// This pattern allows for easy extension with additional HTTP utilities
// while maintaining a simple import structure for consumers
module.exports = {
  sendNotFound
};
