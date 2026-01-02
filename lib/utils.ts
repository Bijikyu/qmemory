/**
 * Basic Utility Functions
 * Simple helper functions for common operations
 */

import { createLogger } from './core/centralized-logger';
import { assert, ErrorFactory } from './core/centralized-errors';
import { validate } from './core/centralized-validation';

/**
 * Callback signature used to extract unique keys from collection items.
 */
export type KeyExtractor<T> = (item: T) => string | number | symbol;

// Create module-specific logger
const logger = createLogger('Utils');

/**
 * Produces a friendly greeting while coercing non-string input safely.
 *
 * This function demonstrates type-safe input handling by converting any input
 * to a string representation before formatting it into a greeting. It's designed
 * to be robust against various input types including null, undefined, numbers,
 * and objects.
 *
 * @param name - Raw identifier or label to greet. Can be any type.
 * @returns Greeting sentence including the provided name as a string.
 *
 * @example
 * ```typescript
 * greet('Alice') // Returns: "Hello, Alice!"
 * greet(123)     // Returns: "Hello, 123!"
 * greet(null)    // Returns: "Hello, null!"
 * ```
 */
export const greet = (name: unknown): string => {
  logger.functionEntry('greet', { name });
  // Type-safe conversion: ensure we always have a string representation
  const safeName = typeof name === 'string' ? name : String(name);
  const msg = `Hello, ${safeName}!`;
  logger.functionReturn('greet', msg);
  return msg;
};

/**
 * Adds two numeric operands with strict type validation.
 *
 * This function performs arithmetic addition with runtime type checking to ensure
 * both operands are numbers. It throws a TypeError for invalid inputs rather than
 * performing implicit type coercion, which helps catch programming errors early.
 *
 * @param a - First operand for addition. Must be a valid number.
 * @param b - Second operand for addition. Must be a valid number.
 * @returns Arithmetic sum of the provided operands.
 *
 * @throws {TypeError} When either parameter is not a number.
 *
 * @example
 * ```typescript
 * add(2, 3)    // Returns: 5
 * add(-1, 4)   // Returns: 3
 * add(0.5, 1.5) // Returns: 2
 * add('2', 3)  // Throws TypeError
 * ```
 */
export const add = (a: number, b: number): number => {
  logger.functionEntry('add', { a, b });
  // Runtime validation: ensure both parameters are numbers before arithmetic
  assert.number(a, 'a');
  assert.number(b, 'b');
  const sum = a + b;
  logger.functionReturn('add', sum);
  return sum;
};

/**
 * Determines whether a numeric input is even, enforcing integer-only usage.
 *
 * This function checks if a number is even by using the modulo operator.
 * It strictly requires integer inputs because the concept of "even" and "odd"
 * only applies to whole numbers in mathematics. Floating-point numbers are
 * rejected to prevent ambiguous results.
 *
 * @param num - Integer candidate to evaluate for even parity. Must be an integer.
 * @returns True when the value is even, otherwise false.
 *
 * @throws {TypeError} When the parameter is not an integer.
 *
 * @example
 * ```typescript
 * isEven(2)    // Returns: true
 * isEven(3)    // Returns: false
 * isEven(0)    // Returns: true
 * isEven(-4)   // Returns: true
 * isEven(2.5)  // Throws TypeError
 * ```
 */
export const isEven = (num: number): boolean => {
  logger.functionEntry('isEven', { num });
  // Validate integer input: even/odd only makes sense for whole numbers
  assert.integer(num, 'num');
  const result = num % 2 === 0;
  logger.functionReturn('isEven', result);
  return result;
};

/**
 * Deduplicates a collection by keeping the first occurrence of each key.
 *
 * This function removes duplicate items from an array based on a key extraction
 * function. It preserves the first occurrence of each unique key and discards
 * subsequent duplicates. The algorithm uses a Set for O(1) key lookup performance.
 *
 * @param items - Collection to deduplicate. Empty array returns empty array.
 * @param keyExtractor - Function that returns a unique key for each item.
 * @returns New array containing only the first occurrence for each key.
 *
 * @example
 * ```typescript
 * const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Alice2'}];
 * dedupeByFirst(users, user => user.id); // Returns first two items, keeps first Alice
 * ```
 */
export const dedupeByFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
  if (!items?.length) return [];
  const seen = new Set<ReturnType<KeyExtractor<T>>>();
  const result: T[] = [];
  // Iterate through items, adding only the first occurrence of each key
  for (const item of items) {
    const key = keyExtractor(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

/**
 * Deduplicates a collection using case-insensitive keys while keeping first matches.
 *
 * This function removes duplicates based on case-insensitive string comparison.
 * String keys are converted to lowercase before comparison, while non-string keys
 * are compared as-is. This is useful for deduppling case-insensitive identifiers
 * like usernames, email addresses, or tags.
 *
 * @param items - Collection to deduplicate. Empty array returns empty array.
 * @param keyExtractor - Function supplying keys used for comparison.
 * @returns Array containing the first entry for each normalized key.
 *
 * @example
 * ```typescript
 * const items = [{name: 'Alice'}, {name: 'alice'}, {name: 'Bob'}];
 * dedupeByLowercaseFirst(items, item => item.name); // Returns first Alice and Bob
 * ```
 */
export const dedupeByLowercaseFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
  if (!items?.length) return [];
  const seen = new Set<string | number | symbol>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyExtractor(item);
    // Normalize string keys to lowercase for case-insensitive comparison
    const normalizedKey = typeof key === 'string' ? key.toLowerCase() : key;
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      result.push(item);
    }
  }
  return result;
};

/**
 * Deduplicates a collection retaining the last occurrence of each unique key.
 *
 * This function removes duplicates by keeping only the last occurrence of each key.
 * It uses a Map data structure which automatically overwrites previous values
 * when the same key is encountered, ensuring the last occurrence is preserved.
 *
 * @param items - Collection that may contain duplicate keys.
 * @param keyExtractor - Function that derives keys for comparison.
 * @returns Array preserving only the last value associated with each key.
 *
 * @example
 * ```typescript
 * const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}, {id: 1, name: 'Alice2'}];
 * dedupeByLast(users, user => user.id); // Returns Bob and Alice2 (last Alice)
 * ```
 */
export const dedupeByLast = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
  if (!items?.length) return [];
  const map = new Map<ReturnType<KeyExtractor<T>>, T>();
  // Map automatically keeps the last value for each key
  for (const item of items) map.set(keyExtractor(item), item);
  return Array.from(map.values());
};

/**
 * Deduplicates an array using strict equality comparison for values.
 *
 * This function removes duplicates from an array using JavaScript's Set constructor,
 * which provides O(1) lookup for existing values. It works with both primitive types
 * (numbers, strings, booleans) and object references (though object references are
 * compared by reference, not by value).
 *
 * @param items - Collection of primitive or reference values to deduplicate.
 * @returns Array containing only the first occurrence of each unique value.
 *
 * @example
 * ```typescript
 * dedupe([1, 2, 2, 3, 1])        // Returns: [1, 2, 3]
 * dedupe(['a', 'b', 'a'])       // Returns: ['a', 'b']
 * dedupe([true, false, true])    // Returns: [true, false]
 * ```
 */
export const dedupe = <T>(items: T[]): T[] => (!items?.length ? [] : Array.from(new Set(items)));
