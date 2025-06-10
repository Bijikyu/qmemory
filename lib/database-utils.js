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
  console.log('ensureMongoDB is running'); // Entry logging allows tracking when DB checks begin
  
  // Log current connection state for debugging and monitoring purposes
  // readyState values: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  // This logging is crucial for diagnosing connectivity issues in cloud environments
  console.log(`Checking database availability - connection state: ${mongoose.connection.readyState}`);

  try {
    // Check if MongoDB connection is in ready state (1 = connected)
    // We use readyState !== 1 instead of === 0 to catch all non-ready states
    // This is a fast, non-blocking check that uses existing connection information
    if (mongoose.connection.readyState !== 1) {
      // Send 503 Service Unavailable instead of 500 because DB unavailability is a service issue, not a code error
      // Use centralized HTTP utility for consistent error responses across the entire application
      sendServiceUnavailable(res, 'Database functionality unavailable');
      console.log('Database check failed - connection not ready');
      console.log('ensureMongoDB is returning false'); // Exit logging helps trace function flow
      return false; // Early return prevents unnecessary DB operations when connection is not ready
    }

    console.log('Database check passed - connection ready');
    console.log('ensureMongoDB is returning true'); // Success path logging for monitoring
    return true; // Connection verified - safe to proceed with database operations
  } catch (error) {
    // Handle unexpected errors during connection state checking
    // This catch block protects against rare cases where connection object is corrupted or undefined
    // Without this, a null connection could crash the entire request handler
    console.error('Database availability check error:', error);

    // Send 500 Internal Server Error for unexpected errors during the check itself
    // Use centralized HTTP utility for consistent error responses and proper status codes
    sendInternalServerError(res, 'Error checking database connection');
    console.log('ensureMongoDB is returning false'); // Error path logging for debugging
    return false; // Fail-safe: assume DB unavailable when check itself fails
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
  console.log('ensureUnique is running'); // Entry logging to track uniqueness validation attempts
  
  // Log the query for debugging and monitoring duplicate attempt patterns
  // JSON.stringify ensures complex queries are readable in logs for troubleshooting
  console.log(`ensureUnique is checking query: ${JSON.stringify(query)}`);

  try {
    // Use findOne for efficiency - we only need to know if ANY matching document exists
    // findOne() stops at first match, making it faster than find() which returns all matches
    // This is critical for performance when checking uniqueness in large collections
    const existing = await model.findOne(query);

    if (existing) {
      // Send 409 Conflict status code - the standard HTTP response for duplicate resource attempts
      // Use centralized HTTP utility for consistent conflict responses across all endpoints
      sendConflict(res, duplicateMsg);
      console.log('ensureUnique found duplicate');
      console.log('ensureUnique is returning false'); // Exit logging indicates duplicate found
      return false; // Return false to signal duplicate exists - caller should stop processing
    }

    console.log('ensureUnique passed - no duplicates');
    console.log('ensureUnique is returning true'); // Success logging confirms uniqueness
    return true; // Return true signals safe to proceed with document creation/update
  } catch (error) {
    // Re-throw database errors to be handled by calling function
    // This design allows higher-level functions to decide how to handle specific DB errors
    // Examples: connection errors, validation errors, timeout errors
    console.error('ensureUnique error', error); // Error logging for debugging DB issues
    // No exit logging here because function throws rather than returns
    throw error; // Propagate error to caller for appropriate error handling context
  }
}

// Export functions using object shorthand for clean module interface
// This pattern provides a consistent export structure across all utility modules
module.exports = {
  ensureMongoDB, // validates DB availability
  ensureUnique   // checks for duplicate docs
};
