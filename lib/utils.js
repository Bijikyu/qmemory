
/**
 * Basic Utility Functions
 * General-purpose helper functions
 * 
 * This module contains simple, reusable utility functions that demonstrate
 * the module's capabilities and provide common functionality. These functions
 * are intentionally simple to serve as examples and building blocks for
 * more complex operations.
 * 
 * Design rationale: These basic utilities serve multiple purposes:
 * 1. Demonstrate the module's functionality to new users
 * 2. Provide simple, testable examples of function structure
 * 3. Offer commonly needed operations without external dependencies
 * 4. Establish patterns for function documentation and error handling
 */

/**
 * Example function that greets a user
 * 
 * This function demonstrates basic string manipulation and default parameter
 * handling. It serves as a simple example of the module's functionality
 * and provides a template for other string-based utilities.
 * 
 * Design decisions:
 * - Uses default parameter syntax for cleaner code than conditional assignment
 * - Returns a string rather than logging directly for better composability
 * - Template literal provides cleaner syntax than string concatenation
 * 
 * @param {string} name - The name to greet. Defaults to 'World' for universal greeting
 * @returns {string} A greeting message in the format "Hello, {name}!"
 */
function greet(name = 'World') {
  // Template literal provides readable string interpolation
  // Default parameter ensures function always works without conditional logic
  return `Hello, ${name}!`;
}

/**
 * Example function that adds two numbers
 * 
 * This function demonstrates basic arithmetic operations and serves as
 * an example of mathematical utilities. While simple, it establishes
 * patterns for parameter validation and mathematical operations.
 * 
 * Design considerations:
 * - No type checking is performed to keep the function simple and rely on JavaScript's
 *   dynamic typing. In production code, parameter validation might be added.
 * - Direct return keeps the function pure and easily testable
 * - Could be extended to handle arrays or variable arguments for more complex use cases
 * 
 * @param {number} a - First number to add
 * @param {number} b - Second number to add  
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  // Simple addition operation - relies on JavaScript's type coercion
  // Could add type checking: if (typeof a !== 'number' || typeof b !== 'number') throw new Error(...)
  return a + b;
}

/**
 * Example function that checks if a number is even
 * 
 * This function demonstrates boolean logic and modulo operations.
 * It provides a common mathematical utility while serving as an
 * example of predicate functions that return boolean values.
 * 
 * Implementation rationale:
 * - Uses modulo operator (%) which is the standard mathematical approach
 * - Returns boolean directly rather than using conditional statements for conciseness
 * - Works with any numeric input including negative numbers and floats
 *   (though intended primarily for integers)
 * 
 * Alternative approaches considered:
 * - Bitwise AND with 1: (num & 1) === 0, but less readable for general audiences
 * - Math.floor approach for floats, but adds complexity for marginal benefit
 * 
 * @param {number} num - Number to check for evenness
 * @returns {boolean} True if the number is even (divisible by 2), false if odd
 */
function isEven(num) {
  // Modulo operation: even numbers have remainder 0 when divided by 2
  // This approach works for negative numbers and maintains mathematical correctness
  return num % 2 === 0;
}

// Export functions using object shorthand syntax for clean module interface
// This pattern allows selective importing: const { greet } = require('./utils')
// while maintaining the ability to import all functions if needed
module.exports = {
  greet,
  add,
  isEven
};
