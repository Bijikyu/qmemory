/**
 * Cache Performance Monitoring
 * Lightweight cache hit/miss tracking and key count monitoring
 * 
 * This module provides simple cache performance monitoring functions that can be used
 * by various cache implementations to track hits, misses, and key counts for optimization.
 */

// In-memory cache performance metrics storage
const cacheMetrics = new Map();

/**
 * Increment cache hit counter for a named cache
 * @param {string} cacheName - Name of the cache instance
 */
function incCacheHit(cacheName) {
  if (!cacheMetrics.has(cacheName)) {
    cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  }
  
  const metrics = cacheMetrics.get(cacheName);
  metrics.hits++;
  
  console.log(`[DEBUG] Cache hit for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
}

/**
 * Increment cache miss counter for a named cache
 * @param {string} cacheName - Name of the cache instance
 */
function incCacheMiss(cacheName) {
  if (!cacheMetrics.has(cacheName)) {
    cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  }
  
  const metrics = cacheMetrics.get(cacheName);
  metrics.misses++;
  
  console.log(`[DEBUG] Cache miss for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
}

/**
 * Set the current key count for a named cache
 * @param {string} cacheName - Name of the cache instance
 * @param {number} keyCount - Current number of keys in the cache
 */
function setCacheKeys(cacheName, keyCount) {
  if (!cacheMetrics.has(cacheName)) {
    cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
  }
  
  const metrics = cacheMetrics.get(cacheName);
  metrics.keys = keyCount;
  
  console.log(`[DEBUG] Cache ${cacheName} now has ${keyCount} keys`);
}

/**
 * Get performance metrics for a specific cache or all caches
 * @param {string} [cacheName] - Optional cache name, if not provided returns all metrics
 * @returns {Object} Cache metrics
 */
function getCacheMetrics(cacheName) {
  if (cacheName) {
    return cacheMetrics.get(cacheName) || { hits: 0, misses: 0, keys: 0 };
  }
  
  const allMetrics = {};
  for (const [name, metrics] of cacheMetrics) {
    allMetrics[name] = { ...metrics };
  }
  return allMetrics;
}

/**
 * Reset metrics for a specific cache or all caches
 * @param {string} [cacheName] - Optional cache name, if not provided resets all metrics
 */
function resetCacheMetrics(cacheName) {
  if (cacheName) {
    if (cacheMetrics.has(cacheName)) {
      cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
    }
  } else {
    cacheMetrics.clear();
  }
}

module.exports = {
  incCacheHit,
  incCacheMiss,
  setCacheKeys,
  getCacheMetrics,
  resetCacheMetrics
};