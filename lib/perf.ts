/**
 * Cache performance counters indexed by cache name.
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  keys: number;
}

/**
 * Aggregate view of cache metrics per cache instance.
 */
export interface AllCacheMetrics {
  [cacheName: string]: CacheMetrics;
}

const cacheMetrics = new Map<string, CacheMetrics>();

/**
 * Increments the hit counter for the specified cache.
 *
 * @param cacheName - Logical name of the monitored cache.
 */
export const incCacheHit = (cacheName: string): void => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName)!;
  metrics.hits++;
  console.log(`[DEBUG] Cache hit for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
};

/**
 * Increments the miss counter for the specified cache.
 *
 * @param cacheName - Logical name of the monitored cache.
 */
export const incCacheMiss = (cacheName: string): void => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName)!;
  metrics.misses++;
  console.log(
    `[DEBUG] Cache miss for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`
  );
};

/**
 * Records the number of keys currently stored in the cache.
 *
 * @param cacheName - Logical name of the monitored cache.
 * @param keyCount - Number of keys tracked.
 */
export const setCacheKeys = (cacheName: string, keyCount: number): void => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName)!;
  metrics.keys = keyCount;
  console.log(`[DEBUG] Cache ${cacheName} now has ${keyCount} keys`);
};

/**
 * Retrieves metrics for a specific cache or all caches.
 *
 * @param cacheName - Optional cache name filter.
 * @returns Metrics snapshot for the requested cache(s).
 */
export const getCacheMetrics = (cacheName?: string): CacheMetrics | AllCacheMetrics => {
  if (cacheName) return cacheMetrics.get(cacheName) || { hits: 0, misses: 0, keys: 0 };
  const allMetrics: AllCacheMetrics = {};
  for (const [name, metrics] of Array.from(cacheMetrics)) allMetrics[name] = { ...metrics };
  return allMetrics;
};

/**
 * Clears metrics counters either for a specific cache or globally.
 *
 * @param cacheName - Optional cache name to reset individually.
 */
export const resetCacheMetrics = (cacheName?: string): void => {
  if (cacheName) {
    if (cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  } else {
    cacheMetrics.clear();
  }
};
