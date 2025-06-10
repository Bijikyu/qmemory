
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
 * 
 * @param {string} functionName - Name of the function being entered
 * @param {Object} params - Parameters passed to the function
 */
function logFunctionEntry(functionName, params = {}) {
  console.log(`logFunctionEntry is running with ${functionName}`); // log start
  const paramStr = Object.entries(params)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
  
  console.log(`${functionName} is running with ${paramStr}`); // Entry log for debugging
  console.log('logFunctionEntry has run resulting in a final value of undefined'); // log end
}

/**
 * Logs function exit with result
 * 
 * Provides consistent exit logging for debugging function results
 * and tracking return values across the application.
 * 
 * @param {string} functionName - Name of the function being exited
 * @param {*} result - Result being returned from the function
 */
function logFunctionExit(functionName, result) {
  console.log(`logFunctionExit is running with ${functionName}`); // log start
  console.log(`${functionName} is returning ${result}`); // Exit log tracks return values
  console.log('logFunctionExit has run resulting in a final value of undefined'); // log end
}

/**
 * Logs function errors with context
 * 
 * Provides consistent error logging for debugging failures
 * and tracking error patterns across the application.
 * 
 * @param {string} functionName - Name of the function that encountered error
 * @param {Error} error - Error object that was encountered
 */
function logFunctionError(functionName, error) {
  console.log(`logFunctionError is running with ${functionName}`); // log start
  console.error(`${functionName} error`, error); // Error log for troubleshooting
  console.log('logFunctionError has run resulting in a final value of undefined'); // log end
}

module.exports = {
  logFunctionEntry, // log when a function begins
  logFunctionExit,  // log what a function returns
  logFunctionError  // log unexpected errors
};
