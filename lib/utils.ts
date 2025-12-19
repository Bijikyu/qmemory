/**
 * Basic Utility Functions
 * Simple helper functions for common operations
 */

// Type definitions
export type KeyExtractor<T> = (item: T) => string | number | symbol;

export const greet = (name: unknown): string => {
    console.log(`greet is running with ${name}`);
    const safeName = typeof name !== 'string' ? String(name) : name;
    const msg = `Hello, ${safeName}!`;
    console.log(`greet is returning ${msg}`);
    return msg;
};

export const add = (a: number, b: number): number => {
    console.log(`add is running with ${a}, ${b}`);
    if (typeof a !== 'number' || typeof b !== 'number')
        throw new TypeError('Both parameters must be numbers for arithmetic operations');
    const sum = a + b;
    console.log(`add is returning ${sum}`);
    return sum;
};

export const isEven = (num: number): boolean => {
    console.log(`isEven is running with ${num}`);
    if (typeof num !== 'number' || !Number.isInteger(num))
        throw new TypeError('Parameter must be an integer for even/odd calculation');
    const result = num % 2 === 0;
    console.log(`isEven is returning ${result}`);
    return result;
};

export const dedupeByFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
    if (!items?.length)
        return [];
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

export const dedupeByLowercaseFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
    if (!items?.length)
        return [];
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

export const dedupeByLast = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
    if (!items?.length)
        return [];
    const map = new Map<ReturnType<KeyExtractor<T>>, T>();
    for (const item of items)
        map.set(keyExtractor(item), item);
    return Array.from(map.values());
};

export const dedupe = <T>(items: T[]): T[] => (!items?.length ? [] : [...new Set(items)]);
