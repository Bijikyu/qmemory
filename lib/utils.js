
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
  // Input validation for production safety - prevent type coercion issues
  // Convert non-string inputs to strings to handle numbers, objects, etc. gracefully
  if (typeof name !== 'string') {
    name = String(name); // String() constructor safely converts any value to string
  }
  
  return `Hello, ${name}!`; // Template literal is cleaner and safer than string concatenation
} // Returns greeting using provided name - now production-ready with validation

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
  // Type validation for production safety - ensure numeric operations
  // Strict number check prevents unexpected type coercion (e.g., '1' + 2 = '12')
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both parameters must be numbers for arithmetic operations');
  }
  
  return a + b; // JavaScript addition handles both integers and floating-point numbers correctly
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
  // Type validation and integer check for reliable modulo operation
  // Number.isInteger() ensures we reject floats which don't have meaningful even/odd classification
  if (typeof num !== 'number' || !Number.isInteger(num)) {
    throw new TypeError('Parameter must be an integer for even/odd calculation');
  }
  
  return num % 2 === 0; // Modulo operation correctly handles both positive and negative integers
}

module.exports = {
  greet, // create greeting strings
  add,   // sum two numbers
  isEven // check numerical parity
};
