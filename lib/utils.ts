/**
 * Basic Utilities Module
 *
 * This module provides fundamental utility functions for common operations
 * including string manipulation, mathematical operations, type checking,
 * and array deduplication. These utilities are designed to be simple,
 * reliable, and well-documented for consistent usage across the application.
 *
 * Key Features:
 * - Type-safe mathematical operations with validation
 * - String manipulation and greeting utilities
 * - Comprehensive array deduplication strategies
 * - Input validation and error handling
 * - Detailed logging for debugging and monitoring
 *
 * Design Principles:
 * - Functions are pure and side-effect free where possible
 * - Comprehensive input validation prevents runtime errors
 * - Multiple deduplication strategies for different use cases
 * - Consistent error handling and logging patterns
 */

import { createLogger } from './core/centralized-logger';
import { assert } from './core/centralized-errors';

/**
 * Type definition for key extraction functions
 *
 * This type defines functions that extract keys from items for deduplication
 * purposes. The key can be a string, number, or symbol, providing flexibility
 * for different data structures and identification strategies.
 *
 * @template T - Type of the item to extract key from
 */
export type KeyExtractor<T> = (item: T) => string | number | symbol;

// Create module-specific logger for consistent debugging
const logger = createLogger('Utils');

/**
 * Creates a greeting message with the provided name
 *
 * This function generates a friendly greeting message by safely converting
 * the input to a string and formatting it into a standard greeting pattern.
 * It includes comprehensive input validation and logging for debugging purposes.
 *
 * Input Handling:
 * - Accepts any type of input (unknown)
 * - Safely converts non-string inputs to string representation
 * - Handles null and undefined inputs gracefully
 * - Provides consistent output format
 *
 * @param name - Name to include in the greeting (any type accepted)
 * @returns {string} Formatted greeting message "Hello, [name]!"
 */
export const greet = (name: unknown): string => {
  logger.functionEntry('greet', { name });

  // Safely convert input to string, handling all types including null/undefined
  const safeName = typeof name === 'string' ? name : String(name);

  // Create standard greeting format
  const msg = `Hello, ${safeName}!`;

  logger.functionReturn('greet', msg);
  return msg;
};

/**
 * Adds two numbers together with comprehensive validation
 *
 * This function performs basic arithmetic addition with strict type validation
 * to ensure both parameters are valid numbers. It includes input validation,
 * error handling, and detailed logging for debugging and monitoring.
 *
 * Validation:
 * - Both parameters must be valid numbers
 * - Uses centralized assertion for consistent error handling
 * - Prevents NaN and Infinity results through validation
 *
 * @param a - First number to add (must be valid number)
 * @param b - Second number to add (must be valid number)
 * @returns {number} The sum of the two numbers
 * @throws {AssertionError} When either parameter is not a valid number
 */
export const add = (a: number, b: number): number => {
  logger.functionEntry('add', { a, b });

  // Validate both parameters are numbers using centralized assertion
  assert.number(a, 'a');
  assert.number(b, 'b');

  // Perform the addition operation
  const sum = a + b;

  logger.functionReturn('add', sum);
  return sum;
};

/**
 * Checks if an integer is even
 *
 * This function determines whether a given integer is even by checking
 * if it's divisible by 2 without remainder. It includes strict validation
 * to ensure the input is a valid integer, providing reliable results for
 * mathematical operations and conditional logic.
 *
 * Mathematical Logic:
 * - Uses modulo operator (%) to check divisibility
 * - Returns true if num % 2 === 0 (even)
 * - Returns false if num % 2 === 1 (odd)
 * - Validates input is integer to prevent floating-point issues
 *
 * @param num - Integer to check for evenness
 * @returns {boolean} True if the number is even, false if odd
 * @throws {AssertionError} When the input is not a valid integer
 */
export const isEven = (num: number): boolean => {
  logger.functionEntry('isEven', { num });

  // Validate input is integer to prevent floating-point precision issues
  assert.integer(num, 'num');

  // Check if number is divisible by 2 without remainder
  const result = num % 2 === 0;

  logger.functionReturn('isEven', result);
  return result;
};

/**
 * Generic deduplication function with configurable strategy
 *
 * This function provides flexible array deduplication based on extracted keys
 * with multiple strategies for handling duplicates. It serves as the core
 * implementation for all deduplication utilities, extracting common patterns
 * and ensuring consistent behavior across different use cases.
 *
 * Deduplication Strategies:
 * - 'first': Keep the first occurrence of each key (default)
 * - 'last': Keep the last occurrence of each key
 * - 'lowercase-first': Case-insensitive deduplication keeping first occurrence
 *
 * Performance Characteristics:
 * - 'first' and 'lowercase-first': O(n) time, O(n) space (Set-based)
 * - 'last': O(n) time, O(n) space (Map-based)
 * - All strategies provide linear time complexity
 *
 * @template T - Type of items in the array
 * @param items - Array of items to deduplicate (empty array returns empty)
 * @param keyExtractor - Function to extract comparison key from each item
 * @param strategy - Deduplication strategy (default: 'first')
 * @returns {T[]} Deduplicated array with chosen strategy applied
 */
const dedupeByWithStrategy = <T>(
  items: T[],
  keyExtractor: KeyExtractor<T>,
  strategy: 'first' | 'last' | 'lowercase-first' = 'first'
): T[] => {
  // Handle empty or null input arrays gracefully
  if (!items?.length) return [];

  // 'last' strategy: Keep the most recent occurrence of each key
  if (strategy === 'last') {
    const map = new Map<ReturnType<KeyExtractor<T>>, T>();
    for (const item of items) {
      const key = keyExtractor(item);
      map.set(key, item); // Overwrites previous entries, keeping last
    }
    return Array.from(map.values());
  }

  // 'first' and 'lowercase-first' strategies: Keep first occurrence
  const seen = new Set<string | number | symbol>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyExtractor(item);
    // Apply case normalization for lowercase-first strategy
    const normalizedKey =
      strategy === 'lowercase-first' && typeof key === 'string' ? key.toLowerCase() : key;

    // Only add item if we haven't seen this key before
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      result.push(item);
    }
  }
  return result;
};

/**
 * Deduplicates array keeping first occurrence of each key
 *
 * This function removes duplicate items from an array based on extracted keys,
 * keeping the first occurrence of each unique key. It's commonly used when
 * you want to preserve the original order while removing duplicates.
 *
 * @template T - Type of items in the array
 * @param items - Array of items to deduplicate
 * @param keyExtractor - Function to extract comparison key from each item
 * @returns {T[]} Deduplicated array with first occurrences preserved
 */
export const dedupeByFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] =>
  dedupeByWithStrategy(items, keyExtractor, 'first');

/**
 * Deduplicates array with case-insensitive comparison keeping first occurrence
 *
 * This function removes duplicate items from an array using case-insensitive
 * string comparison for keys, keeping the first occurrence of each unique key.
 * It's useful for deduplicating string-based data where case should be ignored.
 *
 * @template T - Type of items in the array
 * @param items - Array of items to deduplicate
 * @param keyExtractor - Function to extract comparison key from each item
 * @returns {T[]} Deduplicated array with case-insensitive first occurrences preserved
 */
export const dedupeByLowercaseFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] =>
  dedupeByWithStrategy(items, keyExtractor, 'lowercase-first');

/**
 * Deduplicates array keeping last occurrence of each key
 *
 * This function removes duplicate items from an array based on extracted keys,
 * keeping the last occurrence of each unique key. It's commonly used when
 * you want the most recent data when duplicates exist.
 *
 * @template T - Type of items in the array
 * @param items - Array of items to deduplicate
 * @param keyExtractor - Function to extract comparison key from each item
 * @returns {T[]} Deduplicated array with last occurrences preserved
 */
export const dedupeByLast = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] =>
  dedupeByWithStrategy(items, keyExtractor, 'last');

/**
 * Flexible deduplication function with configurable strategy
 *
 * This function provides a flexible interface for array deduplication with
 * configurable strategy selection. It's the main entry point for
 * strategy-based deduplication when you need to specify the behavior.
 *
 * @template T - Type of items in the array
 * @param items - Array of items to deduplicate
 * @param keyExtractor - Function to extract comparison key from each item
 * @param strategy - Deduplication strategy (default: 'first')
 * @returns {T[]} Deduplicated array with chosen strategy applied
 */
export const dedupeBy = <T>(
  items: T[],
  keyExtractor: KeyExtractor<T>,
  strategy: 'first' | 'last' | 'lowercase-first' = 'first'
): T[] => dedupeByWithStrategy(items, keyExtractor, strategy);

/**
 * Simple deduplication using native Set (for primitive values)
 *
 * This function provides basic deduplication for arrays containing primitive
 * values (strings, numbers, booleans, symbols) using JavaScript's native Set.
 * It's the most efficient deduplication method for simple value types.
 *
 * Performance: O(n) time complexity with highly optimized native Set operations
 *
 * @template T - Type of primitive values in the array
 * @param items - Array of primitive values to deduplicate
 * @returns {T[]} Deduplicated array with unique values preserved
 */
export const dedupe = <T>(items: T[]): T[] =>
  items && items.length ? Array.from(new Set(items)) : [];
