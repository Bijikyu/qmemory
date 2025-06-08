
/**
 * My NPM Module
 * A simple Node.js module with database utilities
 */

const mongoose = require('mongoose');

/**
 * Example function that greets a user
 * @param {string} name - The name to greet
 * @returns {string} A greeting message
 */
function greet(name = 'World') {
  return `Hello, ${name}!`;
}

/**
 * Example function that adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Example function that checks if a number is even
 * @param {number} num - Number to check
 * @returns {boolean} True if even, false if odd
 */
function isEven(num) {
  return num % 2 === 0;
}

/**
 * Database availability validation utility
 * 
 * This function checks the MongoDB connection state before allowing operations
 * that require database access. It provides graceful degradation by responding
 * with appropriate HTTP errors when the database is unavailable.
 * 
 * Connection state validation: Uses Mongoose connection readyState to determine
 * if the database is ready for operations. State 1 indicates a successful
 * connection, while other states represent disconnected, connecting, or error states.
 * 
 * Design rationale: Prevents database operations from failing with unclear errors
 * by checking connectivity upfront. This approach provides better user experience
 * and clearer error messages when database issues occur.
 * 
 * Error handling strategy: Sends appropriate HTTP status codes (503 for service
 * unavailable, 500 for unexpected errors) to inform clients about the specific
 * nature of the database issue.
 * 
 * @param {Object} res - Express response object for sending database error responses
 * @returns {boolean} Boolean indicating whether database is available for operations
 * 
 * Side effects: Sends HTTP error responses when database is unavailable
 * Usage pattern: Controllers should check this before database operations
 */
function ensureMongoDB(res) {
  console.log(`Checking database availability - connection state: ${mongoose.connection.readyState}`);
  
  try {
    // Check if MongoDB connection is in ready state (1 = connected)
    // Other states: 0 = disconnected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      // Send HTTP 503 Service Unavailable for database connectivity issues
      res.status(503).json({ message: 'Database functionality unavailable' });
      console.log('Database check failed - connection not ready');
      return false;
    }
    
    console.log('Database check passed - connection ready');
    return true;
  } catch (error) {
    // Handle unexpected errors during connection state checking
    console.error('Database availability check error:', error);
    
    // Send HTTP 500 Internal Server Error for unexpected database issues
    res.status(500).json({ message: 'Error checking database connection' });
    return false;
  }
}

// Export functions for use as a module
module.exports = {
  greet,
  add,
  isEven,
  ensureMongoDB
};
