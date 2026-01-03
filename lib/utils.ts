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

export const dedupeByLowercaseFirst = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
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

export const dedupeByLast = <T>(items: T[], keyExtractor: KeyExtractor<T>): T[] => {
  if (!items?.length) return [];
  const map = new Map<ReturnType<KeyExtractor<T>>, T>();
  for (const item of items) map.set(keyExtractor(item), item);
  return Array.from(map.values());
};

export const dedupe = <T>(items: T[]): T[] =>
  items && items.length ? Array.from(new Set(items)) : [];
