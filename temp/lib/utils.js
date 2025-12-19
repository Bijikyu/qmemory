/**
 * Basic Utility Functions
 * Simple helper functions for common operations
 */
export const greet = (name) => {
    console.log(`greet is running with ${name}`);
    const safeName = typeof name !== 'string' ? name : String(name);
    const msg = `Hello, ${safeName}!`;
    console.log(`greet is returning ${msg}`);
    return msg;
};
export const add = (a, b) => {
    console.log(`add is running with ${a}, ${b}`);
    if (typeof a !== 'number' || typeof b !== 'number')
        throw new TypeError('Both parameters must be numbers for arithmetic operations');
    const sum = a + b;
    console.log(`add is returning ${sum}`);
    return sum;
};
export const isEven = (num) => {
    console.log(`isEven is running with ${num}`);
    if (typeof num !== 'number' || !Number.isInteger(num))
        throw new TypeError('Parameter must be an integer for even/odd calculation');
    const result = num % 2 === 0;
    console.log(`isEven is returning ${result}`);
    return result;
};
export const dedupeByFirst = (items, keyExtractor) => {
    if (!items?.length)
        return [];
    const seen = new Set(), result = [];
    for (const item of items) {
        const key = keyExtractor(item);
        !seen.has(key) && (seen.add(key), result.push(item));
    }
    return result;
};
export const dedupeByLowercaseFirst = (items, keyExtractor) => {
    if (!items?.length)
        return [];
    const seen = new Set(), result = [];
    for (const item of items) {
        const key = keyExtractor(item);
        const normalizedKey = typeof key === 'string' ? key.toLowerCase() : key;
        !seen.has(normalizedKey) && (seen.add(normalizedKey), result.push(item));
    }
    return result;
};
export const dedupeByLast = (items, keyExtractor) => {
    if (!items?.length)
        return [];
    const map = new Map();
    for (const item of items)
        map.set(keyExtractor(item), item);
    return Array.from(map.values());
};
export const dedupe = (items) => (!items?.length ? [] : [...new Set(items)]);
