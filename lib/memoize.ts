/**
 * Memoization Utilities
 *
 * Provides function memoization with TTL and size limits using the existing LRUCache.
 */

import { LRUCache } from './lru-cache';

export interface MemoizeOptions<Args extends unknown[]> {
  maxSize?: number;
  ttl?: number;
  keyGenerator?: (...args: Args) => string;
}

export function memoizeWithTTL<Args extends unknown[], Result>(
  fn: (...args: Args) => Result | Promise<Result>,
  options: MemoizeOptions<Args> = {}
): (...args: Args) => Result | Promise<Result> {
  const { maxSize = 100, ttl = 5000, keyGenerator = (...args) => JSON.stringify(args) } = options;

  const cache = new LRUCache<string, Result>({
    max: maxSize,
    ttl,
  });

  return function (this: unknown, ...args: Args): Result | Promise<Result> {
    const key = keyGenerator(...args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn.apply(this, args);

    if (result && typeof (result as Promise<Result>).then === 'function') {
      return (result as Promise<Result>)
        .then((value) => {
          cache.set(key, value);
          return value;
        })
        .catch((error) => {
          throw error;
        });
    }

    cache.set(key, result as Result);
    return result;
  };
}

export function memoize<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: Omit<MemoizeOptions<Args>, 'ttl'> = {}
): (...args: Args) => Result {
  const { maxSize = 100, keyGenerator = (...args) => JSON.stringify(args) } = options;

  const cache = new LRUCache<string, Result>({
    max: maxSize,
  });

  return function (this: unknown, ...args: Args): Result {
    const key = keyGenerator(...args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

export function createMemoizedFunction<Args extends unknown[], Result>(
  fn: (...args: Args) => Result | Promise<Result>,
  options?: MemoizeOptions<Args>
): (...args: Args) => Result | Promise<Result> {
  return memoizeWithTTL(fn, options);
}
