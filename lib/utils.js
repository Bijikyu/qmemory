
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

/**
 * Deduplicates an array by a key extractor, keeping first occurrence
 * 
 * Generic deduplication that preserves insertion order and keeps the first
 * item seen for each unique key. Useful for consolidating data from multiple
 * sources while maintaining precedence.
 * 
 * @template T
 * @param {Array<T>} items - Array of items to deduplicate
 * @param {Function} keyExtractor - Function to extract comparison key from each item
 * @returns {Array<T>} Deduplicated array with first-seen items preserved
 */
function dedupeByFirst(items, keyExtractor) {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyExtractor(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/**
 * Deduplicates an array by lowercase key, keeping first occurrence
 * 
 * Case-insensitive deduplication that normalizes keys to lowercase before
 * comparison. Ideal for email addresses, usernames, and other case-insensitive
 * identifiers where duplicates may differ only in casing.
 * 
 * @template T
 * @param {Array<T>} items - Array of items to deduplicate
 * @param {Function} keyExtractor - Function to extract string key from each item
 * @returns {Array<T>} Deduplicated array with first-seen items preserved
 */
function dedupeByLowercaseFirst(items, keyExtractor) {
  if (!items || !Array.isArray(items)) return [];
  return dedupeByFirst(items, item => {
    const key = keyExtractor(item);
    return typeof key === 'string' ? key.toLowerCase() : key;
  });
}

/**
 * Deduplicates an array by a key extractor, keeping last occurrence
 * 
 * Alternative deduplication that keeps the last item seen for each unique key.
 * Useful when later sources should override earlier ones.
 * 
 * @template T
 * @param {Array<T>} items - Array of items to deduplicate
 * @param {Function} keyExtractor - Function to extract comparison key from each item
 * @returns {Array<T>} Deduplicated array with last-seen items preserved
 */
function dedupeByLast(items, keyExtractor) {
  if (!items || !Array.isArray(items)) return [];
  const map = new Map();
  for (const item of items) {
    const key = keyExtractor(item);
    map.set(key, item);
  }
  return Array.from(map.values());
}

/**
 * Simple array deduplication for primitive values
 * 
 * Removes duplicate primitive values from an array while preserving order.
 * For objects, use dedupeByFirst with a key extractor.
 * 
 * @template T
 * @param {Array<T>} items - Array of primitive values to deduplicate
 * @returns {Array<T>} Deduplicated array
 */
function dedupe(items) {
  if (!items || !Array.isArray(items)) return [];
  return [...new Set(items)];
}

module.exports = {
  greet, // create greeting strings
  add,   // sum two numbers
  isEven, // check numerical parity
  dedupeByFirst, // deduplicate keeping first occurrence
  dedupeByLowercaseFirst, // case-insensitive deduplication
  dedupeByLast, // deduplicate keeping last occurrence
  dedupe // simple primitive deduplication
};
