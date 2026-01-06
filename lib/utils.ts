import { createLogger } from './core/centralized-logger';
import { assert } from './core/centralized-errors';

export type KeyExtractor<T> = (item: T) => string | number | symbol;
const logger = createLogger('Utils');

export const greet = (name: unknown): string => {
  logger.functionEntry('greet', { name });
  const safeName = typeof name === 'string' ? name : String(name);
  const msg = `Hello, ${safeName}!`;
  logger.functionReturn('greet', msg);
  return msg;
};

export const add = (a: number, b: number): number => {
  logger.functionEntry('add', { a, b });
  assert.number(a, 'a');
  assert.number(b, 'b');
  const sum = a + b;
  logger.functionReturn('add', sum);
  return sum;
};

export const isEven = (num: number): boolean => {
  logger.functionEntry('isEven', { num });
  assert.integer(num, 'num');
  const result = num % 2 === 0;
  logger.functionReturn('isEven', result);
  return result;
};

/**
 * Generic deduplication function with configurable strategy
 * Extracts common pattern used across all deduplication functions
 */
const dedupeByWithStrategy = <T>(
  items: T[],
  keyExtractor: KeyExtractor<T>,
  strategy: 'first' | 'last' | 'lowercase-first' = 'first'
): T[] => {
  if (!items?.length) return [];

  if (strategy === 'last') {
    const map = new Map<ReturnType<KeyExtractor<T>>, T>();
    for (const item of items) {
      const key = keyExtractor(item);
      map.set(key, item);
    }
    return Array.from(map.values());
  }

  // For 'first' and 'lowercase-first' strategies
  const seen = new Set<string | number | symbol>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyExtractor(item);
    const normalizedKey =
      strategy === 'lowercase-first' && typeof key === 'string' ? key.toLowerCase() : key;
    if (!seen.has(normalizedKey)) {
      seen.add(normalizedKey);
      result.push(item);
    }
  }
  return result;
};

export const dedupeByFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] =>
  dedupeByWithStrategy(items, keyExtractor, 'first');

export const dedupeByLowercaseFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] =>
  dedupeByWithStrategy(items, keyExtractor, 'lowercase-first');

export const dedupeByLast = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] =>
  dedupeByWithStrategy(items, keyExtractor, 'last');

export const dedupeBy = <T>(
  items: T[],
  keyExtractor: KeyExtractor<T>,
  strategy: 'first' | 'last' | 'lowercase-first' = 'first'
): T[] => dedupeByWithStrategy(items, keyExtractor, strategy);

export const dedupe = <T>(items: T[]): T[] =>
  items && items.length ? Array.from(new Set(items)) : [];
