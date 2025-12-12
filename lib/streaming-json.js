/**
 * JSON Utilities
 * Direct usage of Node.js built-in JSON methods
 * 
 * This module provides direct access to Node.js built-in JSON functionality.
 * Simplified implementation using Node.js built-in methods.
 */

/**
 * Safe JSON parse with error handling
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value on parse failure
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe JSON stringify with error handling
 * 
 * @param {*} obj - Object to serialize
 * @param {number} indent - Indentation spaces
 * @returns {string} JSON string or error representation
 */
function safeJsonStringify(obj, indent = 0) {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return JSON.stringify({
      error: 'Serialization failed',
      message: error.message,
      type: typeof obj
    });
  }
}

module.exports = {
  safeJsonParse,
  safeJsonStringify,
  JSON // Export built-in JSON object for direct access
};
