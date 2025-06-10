
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
  console.log(`greet is running with ${name}`); // log start with name
  console.log(`greet is returning Hello, ${name}!`); // log before return
  return `Hello, ${name}!`; // Simple template literal avoids concat issues
} // Returns greeting using provided name

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
  console.log(`add is running with ${a} and ${b}`); // log start with numbers
  const result = a + b;
  console.log(`add is returning ${result}`); // log before return
  return result; // Uses JS addition which handles floats and ints
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
  console.log(`isEven is running with ${num}`); // log start with number
  const result = num % 2 === 0;
  console.log(`isEven is returning ${result}`); // log before return
  return result; // Modulo check works for negatives and positives
}

module.exports = {
  greet, // create greeting strings
  add,   // sum two numbers
  isEven // check numerical parity
};
