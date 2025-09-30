
/**
 * Logging Utility Functions
 * Centralized logging patterns for consistent debugging and monitoring
 *
 * Integrated with qgenutils.logger (Winston-based) to provide structured,
 * environment-aware logging with optional daily rotation. Debug-level logs
 * are suppressed in production by default while error/info remain visible.
 *
 * Design principles:
 * - Consistent log format across all modules
 * - Centralized control over logging behavior
 * - Easy to modify logging implementation
 * - Minimal overhead in production (debug hidden by level)
 *
 * Usage patterns:
 * - Function entry: Log when function starts with parameters
 * - Function exit: Log when function completes with result
 * - Function error: Log when function encounters errors
 */

const { logger } = require('./qgenutils-wrapper');

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
  try {
    logger.debug(`Function entry: ${functionName}`, { params });
  } catch (_) {
    // No-op on logging failure to avoid impacting app flow
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
  try {
    logger.debug(`Function exit: ${functionName}`, { result });
  } catch (_) {
    // No-op on logging failure
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
  try {
    logger.error(`${functionName} failed`, {
      message: error && error.message,
      stack: error && error.stack,
      name: error && error.name,
      timestamp: new Date().toISOString()
    });
  } catch (_) {
    // As a last resort, avoid throwing from logging
  }
}

module.exports = {
  logFunctionEntry, // log when a function begins
  logFunctionExit,  // log what a function returns
  logFunctionError  // log unexpected errors
};
