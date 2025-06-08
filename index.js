
/**
 * My NPM Module
 * A simple Node.js module
 */

/**
 * Example function that greets a user
 * @param {string} name - The name to greet
 * @returns {string} A greeting message
 */
function greet(name = 'World') {
  return `Hello, ${name}!`;
}

/**
 * Example function that adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Example function that checks if a number is even
 * @param {number} num - Number to check
 * @returns {boolean} True if even, false if odd
 */
function isEven(num) {
  return num % 2 === 0;
}

// Export functions for use as a module
module.exports = {
  greet,
  add,
  isEven
};
