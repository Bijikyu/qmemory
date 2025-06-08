
/**
 * Database Utility Functions
 * MongoDB and Mongoose helper functions
 */

const mongoose = require('mongoose');

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

/**
 * Checks if a document with the given query exists
 * @param {Object} model - Mongoose model
 * @param {Object} query - Query to check for uniqueness
 * @param {Object} res - Express response object
 * @param {string} duplicateMsg - Message to send if duplicate found
 * @returns {boolean} True if unique, false if duplicate exists
 */
async function ensureUnique(model, query, res, duplicateMsg) {
  console.log(`ensureUnique is checking query: ${JSON.stringify(query)}`);
  try {
    const existing = await model.findOne(query);
    if (existing) {
      res.status(409).json({ message: duplicateMsg });
      console.log('ensureUnique found duplicate');
      return false;
    }
    console.log('ensureUnique passed - no duplicates');
    return true;
  } catch (error) {
    console.error('ensureUnique error', error);
    throw error;
  }
}

module.exports = {
  ensureMongoDB,
  ensureUnique
};
