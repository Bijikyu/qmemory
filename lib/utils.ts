/**
 * Basic Utility Functions
 * Simple helper functions for common operations
 */

/**
 * Callback signature used to extract unique keys from collection items.
 */
export type KeyExtractor<T> = (item: T) => string | number | symbol;

/**
 * Produces a friendly greeting while coercing non-string input safely.
 *
 * @param name - Raw identifier or label to greet.
 * @returns Greeting sentence including the provided name.
 */
export const greet = (name: unknown): string => {
  console.log(`greet is running with ${name}`);
  const safeName = typeof name === 'string' ? name : String(name);
  const msg = `Hello, ${safeName}!`;
  console.log(`greet is returning ${msg}`);
  return msg;
};

/**
 * Adds two numeric operands with strict type validation.
 *
 * @param a - First operand for addition.
 * @param b - Second operand for addition.
 * @returns Arithmetic sum of the provided operands.
 */
export const add = (a: number, b: number): number => {
  console.log(`add is running with ${a}, ${b}`);
  if (typeof a !== 'number' || typeof b !== 'number')
    throw new TypeError('Both parameters must be numbers for arithmetic operations');
  const sum = a + b;
  console.log(`add is returning ${sum}`);
  return sum;
};

/**
 * Determines whether a numeric input is even, enforcing integer-only usage.
 *
 * @param num - Integer candidate to evaluate for even parity.
 * @returns True when the value is even, otherwise false.
 */
export const isEven = (num: number): boolean => {
  console.log(`isEven is running with ${num}`);
  if (typeof num !== 'number' || !Number.isInteger(num))
    throw new TypeError('Parameter must be an integer for even/odd calculation');
  const result = num % 2 === 0;
  console.log(`isEven is returning ${result}`);
  return result;
};

/**
 * Deduplicates a collection by keeping the first occurrence of each key.
 *
 * @param items - Collection to deduplicate.
 * @param keyExtractor - Function that returns a unique key for each item.
 * @returns New array containing only the first occurrence for each key.
 */
export const dedupeByFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
  if (!items?.length) return [];
  const seen = new Set<ReturnType<KeyExtractor<T>>>();
  const result: T[] = [];
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
 * @param items - Collection to deduplicate.
 * @param keyExtractor - Function supplying keys used for comparison.
 * @returns Array containing the first entry for each normalized key.
 */
export const dedupeByLowercaseFirst = <T>(
  items: T[],
  keyExtractor: KeyExtractor<T>
): T[] => {
  if (!items?.length) return [];
  const seen = new Set<string | number | symbol>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyExtractor(item);
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
 * @param items - Collection that may contain duplicate keys.
 * @param keyExtractor - Function that derives keys for comparison.
 * @returns Array preserving only the last value associated with each key.
 */
export const dedupeByLast = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
  if (!items?.length) return [];
  const map = new Map<ReturnType<KeyExtractor<T>>, T>();
  for (const item of items) map.set(keyExtractor(item), item);
  return Array.from(map.values());
};

/**
 * Deduplicates an array using strict equality comparison for values.
 *
 * @param items - Collection of primitive or reference values to deduplicate.
 * @returns Array containing only the first occurrence of each unique value.
 */
export const dedupe = <T>(items: T[]): T[] => (!items?.length ? [] : [...new Set(items)]);
