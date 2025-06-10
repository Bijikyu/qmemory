
/**
 * Logging Utility Functions
 * Centralized logging patterns for consistent debugging and monitoring
 * 
 * This module standardizes logging across all functions to provide consistent
 * debugging information and reduce code duplication. It implements common
 * logging patterns used throughout the application.
 * 
 * Design principles:
 * - Consistent log format across all modules
 * - Centralized control over logging behavior
 * - Easy to modify logging implementation (e.g., add log levels, external logging)
 * - Minimal overhead when logging is disabled
 * 
 * Usage patterns:
 * - Function entry: Log when function starts with parameters
 * - Function exit: Log when function completes with result
 * - Function error: Log when function encounters errors
 */

/**
 * Logs function entry with parameters
 * 
 * Provides consistent entry logging for debugging function calls
 * and tracking parameter values across the application.
 * Production-ready with configurable logging levels.
 * 
 * @param {string} functionName - Name of the function being entered
 * @param {Object} params - Parameters passed to the function
 */
function logFunctionEntry(functionName, params = {}) {
  // Only log in development mode to avoid production noise
  if (process.env.NODE_ENV === 'development') {
    const paramStr = Object.entries(params)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(', ');
    
    console.log(`[DEBUG] ${functionName} started with ${paramStr}`); // Entry log for debugging
  }
}

/**
 * Logs function exit with result
 * 
 * Provides consistent exit logging for debugging function results
 * and tracking return values across the application.
 * Production-ready with safe result serialization.
 * 
 * @param {string} functionName - Name of the function being exited
 * @param {*} result - Result being returned from the function
 */
function logFunctionExit(functionName, result) {
  // Only log in development mode to avoid production noise
  if (process.env.NODE_ENV === 'development') {
    const resultStr = typeof result === 'object' ? 
      JSON.stringify(result, null, 2) : 
      String(result);
    
    console.log(`[DEBUG] ${functionName} completed with result: ${resultStr}`); // Exit log tracks return values
  }
}

/**
 * Logs function errors with context
 * 
 * Provides consistent error logging for debugging failures
 * and tracking error patterns across the application.
 * Production-ready with structured error information.
 * 
 * @param {string} functionName - Name of the function that encountered error
 * @param {Error} error - Error object that was encountered
 */
function logFunctionError(functionName, error) {
  // Always log errors regardless of environment - critical for debugging
  console.error(`[ERROR] ${functionName} failed:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString()
  }); // Structured error log for troubleshooting
}

module.exports = {
  logFunctionEntry, // log when a function begins
  logFunctionExit,  // log what a function returns
  logFunctionError  // log unexpected errors
};
