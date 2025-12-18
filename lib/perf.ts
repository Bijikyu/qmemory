interface CacheMetrics {
  hits: number;
  misses: number;
  keys: number;
}

const cacheMetrics = new Map<string, CacheMetrics>();

const incCacheHit = (cacheName: string): void => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName)!;
  metrics.hits++;
  console.log(`[DEBUG] Cache hit for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
};

const incCacheMiss = (cacheName: string): void => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName)!;
  metrics.misses++;
  console.log(`[DEBUG] Cache miss for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
};

const setCacheKeys = (cacheName: string, keyCount: number): void => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName)!;
  metrics.keys = keyCount;
  console.log(`[DEBUG] Cache ${cacheName} now has ${keyCount} keys`);
};

const getCacheMetrics = (cacheName?: string): CacheMetrics | Record<string, CacheMetrics> => {
  if (cacheName) return cacheMetrics.get(cacheName) || { hits: 0, misses: 0, keys: 0 };
  
  const allMetrics: Record<string, CacheMetrics> = {};
  for (const [name, metrics] of Array.from(cacheMetrics)) allMetrics[name] = { ...metrics };
  return allMetrics;
};

const resetCacheMetrics = (cacheName?: string): void => {
  if (cacheName) {
    if (cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  } else {
    cacheMetrics.clear();
  }
};

export { incCacheHit, incCacheMiss, setCacheKeys, getCacheMetrics, resetCacheMetrics };