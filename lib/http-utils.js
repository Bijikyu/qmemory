
/**
 * HTTP Utility Functions
 * Common HTTP response helpers for Express applications
 */

/**
 * Sends a 404 Not Found response with a message
 * @param {Object} res - Express response object
 * @param {string} message - Error message to send
 */
function sendNotFound(res, message) {
  res.status(404).json({ message });
}

module.exports = {
  sendNotFound
};
