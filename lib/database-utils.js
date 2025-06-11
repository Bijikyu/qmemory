/**
 * Database Utility Functions
 * MongoDB and Mongoose helper functions
 * 
 * This module provides essential database connectivity and validation utilities
 * that ensure robust database operations throughout the application. These functions
 * implement defensive programming principles by validating database state before
 * operations and providing consistent error handling patterns.
 * 
 * Key design principles:
 * - Fail fast: Check database connectivity before attempting operations
 * - Consistent error responses: Standardize HTTP responses for database issues
 * - Separation of concerns: Keep database validation separate from business logic
 * - Graceful degradation: Provide meaningful errors when database is unavailable
 * 
 * These utilities are particularly important in cloud environments where database
 * connectivity can be intermittent, and in development environments where the
 * database might not always be running.
 */

// Mongoose provides the connection state monitoring we need for database validation
const mongoose = require('mongoose'); // access connection state
const { sendServiceUnavailable, sendInternalServerError, sendConflict } = require('./http-utils'); // HTTP response helpers

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
 * Alternative approaches considered:
 * - Ping the database: More thorough but adds latency to every request
 * - Middleware approach: Would require Express integration, reducing flexibility
 * - Connection pooling checks: More complex and may not be necessary for simple cases
 * 
 * Trade-offs:
 * - Performance: Fast check using existing connection state vs. actual database ping
 * - Accuracy: Connection state might be stale, but actual operations will catch real issues
 * - Simplicity: Simple boolean return allows easy integration into existing code
 * 
 * @param {Object} res - Express response object for sending database error responses
 * @returns {boolean} Boolean indicating whether database is available for operations
 * 
 * Side effects: Sends HTTP error responses when database is unavailable
 * Usage pattern: Controllers should check this before database operations
 */
function ensureMongoDB(res) {
  console.log('ensureMongoDB is running'); // entry log for tracing calls
  
  // Log current connection state for debugging and monitoring purposes
  // readyState values: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  // This logging is crucial for diagnosing connectivity issues in cloud environments
  console.log(`Checking database availability - connection state: ${mongoose.connection.readyState}`); // records state for debugging

  try {
    // Check if MongoDB connection is in ready state (1 = connected)
    // We use readyState !== 1 instead of === 0 to catch all non-ready states
    // This is a fast, non-blocking check that uses existing connection information
    if (mongoose.connection.readyState !== 1) { // quick readyState check over ping prioritizes speed but may miss stale connections
      sendServiceUnavailable(res, 'Database functionality unavailable'); // send 503 when DB not ready
      console.log('Database check failed - connection not ready'); // log failure path
      console.log('ensureMongoDB is returning false'); // trace unsuccessful return
      return false; // stop DB operations when connection not ready
    }

    console.log('Database check passed - connection ready'); // log success path
    console.log('ensureMongoDB is returning true'); // trace successful return
    return true; // allow calling code to use DB
  } catch (error) {
    console.error('Database availability check error:', error); // log unexpected failure

    sendInternalServerError(res, 'Error checking database connection'); // respond with 500 on check error
    console.log('ensureMongoDB is returning false'); // trace error return
    return false; // fail safe when check throws
  }
}

/**
 * Document uniqueness validation utility
 * 
 * This function checks if a document matching the given query already exists
 * in the database, preventing duplicate records and enforcing business rules.
 * It's commonly used before creating new documents or updating existing ones
 * where uniqueness constraints need to be maintained.
 * 
 * Design rationale:
 * - Prevents race conditions by checking immediately before operations
 * - Provides consistent HTTP 409 Conflict responses for duplicate attempts
 * - Centralizes uniqueness logic to avoid duplication across controllers
 * - Returns boolean for easy integration into conditional logic
 * 
 * Performance considerations:
 * - Uses findOne() which stops at first match, more efficient than find()
 * - Query should include indexed fields for optimal performance
 * - Consider database-level unique constraints for critical uniqueness requirements
 * 
 * Race condition handling:
 * - This check + insert pattern has an inherent race condition window
 * - For critical uniqueness, consider using database unique indexes or upsert operations
 * - Current approach balances simplicity with adequate protection for most use cases
 * 
 * @param {Object} model - Mongoose model to query against
 * @param {Object} query - MongoDB query object to check for existing documents
 * @param {Object} res - Express response object for sending duplicate error responses
 * @param {string} duplicateMsg - Custom message to send when duplicate is found
 * @returns {Promise<boolean>} Promise resolving to true if unique, false if duplicate exists
 */
async function ensureUnique(model, query, res, duplicateMsg) {
  console.log('ensureUnique is running'); // entry log for uniqueness checks
  
  // Log the query for debugging and monitoring duplicate attempt patterns
  // JSON.stringify ensures complex queries are readable in logs for troubleshooting
  console.log(`ensureUnique is checking query: ${JSON.stringify(query)}`); // log query for audit

  try {
    // Use findOne for efficiency - we only need to know if ANY matching document exists
    // findOne() stops at first match, making it faster than find() which returns all matches
    // This is critical for performance when checking uniqueness in large collections
    const existing = await model.findOne(query); // fast check may race; index enforcement would be safer

    if (existing) {
      // Send 409 Conflict status code - the standard HTTP response for duplicate resource attempts
      // Use centralized HTTP utility for consistent conflict responses across all endpoints
      sendConflict(res, duplicateMsg); // respond 409 for duplicates
      console.log('ensureUnique found duplicate'); // log detection
      console.log('ensureUnique is returning false'); // trace duplicate return
      return false; // caller should abort create/update
    }

    console.log('ensureUnique passed - no duplicates'); // log success state
    console.log('ensureUnique is returning true'); // trace success return
    return true; // safe to continue with unique data
  } catch (error) {
    console.error('ensureUnique error', error); // log DB error
    throw error; // let caller decide handling
  }
}

// Export functions using object shorthand for clean module interface
// This pattern provides a consistent export structure across all utility modules
module.exports = {
  ensureMongoDB, // validates DB availability
  ensureUnique   // checks for duplicate docs
};
