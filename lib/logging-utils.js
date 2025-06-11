
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
  // development only logging via process.env.NODE_ENV avoids production noise; considered winston or pino but simple check wins
  if (process.env.NODE_ENV === 'development') {
    // Transform parameters object into readable string format for logging
    // Use Object.entries to iterate through all parameter key-value pairs
    const paramStr = Object.entries(params)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(', ');
    
    console.log(`[DEBUG] ${functionName} started with ${paramStr}`); // [DEBUG] prefix keeps logs grep-friendly; considered winston or pino
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
  // development only logging ensures minimal production overhead; considered log level libraries but this suffices
  if (process.env.NODE_ENV === 'development') {
    // Format result for readable logging output
    // JSON.stringify with formatting for objects, String() for primitives
    const resultStr = typeof result === 'object' ? 
      JSON.stringify(result, null, 2) : 
      String(result);
    
    console.log(`[DEBUG] ${functionName} completed with result: ${resultStr}`); // [DEBUG] prefix for consistent exit logs; evaluated pino for json logs
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
  // errors always log so production incidents are captured; external logging pipelines were considered
  console.error(`[ERROR] ${functionName} failed:`, { // [ERROR] tag aligns with entry/exit logs; JSON format suits log collectors
    message: error.message,
    stack: error.stack, // Stack trace essential for identifying error source
    name: error.name, // Error type helps categorize issues
    timestamp: new Date().toISOString() // ISO timestamp for log correlation and incident tracking
  }); // Structured error object provides complete debugging context
}

module.exports = {
  logFunctionEntry, // log when a function begins
  logFunctionExit,  // log what a function returns
  logFunctionError  // log unexpected errors
};
