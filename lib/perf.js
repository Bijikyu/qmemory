const cacheMetrics = new Map();

const incCacheHit = (cacheName) => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName);
  metrics.hits++;
  console.log(`[DEBUG] Cache hit for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
};

const incCacheMiss = (cacheName) => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName);
  metrics.misses++;
  console.log(`[DEBUG] Cache miss for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
};

const setCacheKeys = (cacheName, keyCount) => {
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  const metrics = cacheMetrics.get(cacheName);
  metrics.keys = keyCount;
  console.log(`[DEBUG] Cache ${cacheName} now has ${keyCount} keys`);
};

const getCacheMetrics = (cacheName) => {
  if (cacheName) return cacheMetrics.get(cacheName) || { hits: 0, misses: 0, keys: 0 };
  
  const allMetrics = {};
  for (const [name, metrics] of cacheMetrics) allMetrics[name] = { ...metrics };
  return allMetrics;
};

const resetCacheMetrics = (cacheName) => {
  if (cacheName) {
    if (cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  } else {
    cacheMetrics.clear();
  }
};

module.exports = { incCacheHit, incCacheMiss, setCacheKeys, getCacheMetrics, resetCacheMetrics };