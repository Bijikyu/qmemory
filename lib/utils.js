
/**
 * Basic Utility Functions
 * Simple helper functions for common operations
 * 
 * This module provides fundamental utility functions that can be used across
 * the application. These functions handle basic operations like string formatting,
 * mathematical calculations, and data validation.
 * 
 * Design philosophy:
 * - Pure functions with no side effects for predictable behavior
 * - Simple implementations that are easy to test and understand
 * - Reusable functions that reduce code duplication
 */

/**
 * Creates a greeting message with the provided name
 * 
 * Simple string formatting function that creates standardized greeting messages.
 * Useful for user interfaces, email templates, and API responses.
 * 
 * @param {string} name - Name to include in the greeting
 * @returns {string} Formatted greeting message
 */
function greet(name) {
  console.log(`greet is running with ${name}`); // trace function usage for debugging
  if (typeof name !== 'string') { // validate parameter type to avoid unexpected coercion
    name = String(name); // cast value to string for consistent processing
  }
  const msg = `Hello, ${name}!`; // template literal provides safe, readable interpolation
  console.log(`greet is returning ${msg}`); // log result before returning for auditability
  return msg; // return greeting message
} // function completes

/**
 * Adds two numbers together
 * 
 * Basic arithmetic function for mathematical operations.
 * Handles both integers and floating-point numbers.
 * 
 * @param {number} a - First number to add
 * @param {number} b - Second number to add
 * @returns {number} Sum of the two numbers
 */
function add(a, b) {
  console.log(`add is running with ${a}, ${b}`); // trace call parameters
  if (typeof a !== 'number' || typeof b !== 'number') { // strict type check avoids coercion bugs
    throw new TypeError('Both parameters must be numbers for arithmetic operations'); // explicit error when validation fails
  }
  const sum = a + b; // perform numeric addition on validated inputs
  console.log(`add is returning ${sum}`); // log computed sum for debug purposes
  return sum; // return arithmetic result
}

/**
 * Checks if a number is even
 * 
 * Mathematical utility for determining if a number is divisible by 2.
 * Useful for pagination, alternating row styling, and data processing.
 * 
 * @param {number} num - Number to check
 * @returns {boolean} True if number is even, false otherwise
 */
function isEven(num) {
  console.log(`isEven is running with ${num}`); // trace invocation for debugging
  if (typeof num !== 'number' || !Number.isInteger(num)) { // validate integer input for meaningful parity check
    throw new TypeError('Parameter must be an integer for even/odd calculation'); // throw clear error on invalid input
  }
  const result = num % 2 === 0; // compute parity using modulo operator
  console.log(`isEven is returning ${result}`); // log boolean result for debugging
  return result; // return parity status
}

module.exports = {
  greet, // create greeting strings
  add,   // sum two numbers
  isEven // check numerical parity
};
