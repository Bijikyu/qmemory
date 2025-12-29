/**
 * Cache Performance Metrics Module
 *
 * Purpose: Provides lightweight performance monitoring for cache operations throughout
 * the application. This module tracks cache hit rates, miss rates, and key
 * counts to help optimize caching strategies and identify performance bottlenecks.
 *
 * Design Philosophy:
 * - Minimal overhead: Simple in-memory tracking with O(1) operations
 * - Real-time monitoring: Immediate feedback on cache performance
 * - Global tracking: Monitor all cache instances in one place
 * - Debug-friendly: Console logging for development and debugging
 * - Zero dependencies: No external dependencies or complex setup
 * - Type safety: TypeScript interfaces for compile-time guarantees
 *
 * Integration Notes:
 * - Used throughout application for monitoring cache performance
 * - Integrates with any cache implementation through simple function calls
 * - Provides aggregate metrics for performance analysis
 * - Helps identify caching strategies that need optimization
 * - Supports debugging cache behavior during development
 *
 * Performance Considerations:
 * - Map operations have O(1) time complexity
 * - Minimal memory overhead with compact data structures
 * - No impact on cache operation performance
 * - Efficient aggregation and reporting capabilities
 * - Console logging can be disabled in production to reduce overhead
 *
 * Error Handling Strategy:
 * - Graceful initialization when cache not tracked yet
 * - Type-safe operations prevent runtime errors
 * - Simple data structures reduce error surface area
 * - Debugging output provides context for troubleshooting
 *
 * Architecture Decision: Why use simple Map instead of complex metrics library?
 * - Zero external dependencies reduce bundle size
 * - Immediate availability without configuration
 * - Customized for our specific cache monitoring needs
 * - Easier to debug and maintain than third-party solutions
 * - Provides exactly the metrics we need without extra complexity
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

/**
 * Cache metrics interface for individual cache instances
 *
 * Defines the structure of performance metrics tracked for each cache
 * instance throughout the application. This provides insights into cache
 * effectiveness and helps identify optimization opportunities.
 *
 * @interface CacheMetrics
 */
export interface CacheMetrics {
  hits: number; // Number of successful cache lookups
  misses: number; // Number of cache lookup failures
  keys: number; // Total number of keys currently stored (if applicable)
}

/**
 * Aggregate metrics interface for all cache instances
 *
 * Provides a global view of cache performance across the entire
 * application, keyed by cache name for easy identification and analysis.
 *
 * @interface AllCacheMetrics
 */
export interface AllCacheMetrics {
  [cacheName: string]: CacheMetrics; // Dynamic cache names mapped to their metrics
}

/**
 * In-memory storage for cache metrics across all instances
 *
 * Uses Map for O(1) performance and efficient key-based access.
 * Each cache instance is tracked separately to provide individual performance insights.
 */
const cacheMetrics = new Map<string, CacheMetrics>();

/**
 * Increment cache hit counter for specified cache
 *
 * This function should be called whenever a cache lookup succeeds.
 * It automatically initializes metrics for new cache instances and provides
 * debug output for monitoring cache performance during development.
 *
 * @param cacheName - Logical name of the monitored cache for identification
 *
 * @example
 * // In cache implementation
 * if (data = cache.get(key)) {
 *   incCacheHit('userCache'); // Track successful lookup
 *   return data;
 * }
 */
export const incCacheHit = (cacheName: string): void => {
  // Initialize metrics if this is the first time tracking this cache
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });

  const metrics = cacheMetrics.get(cacheName)!;
  metrics.hits++;

  // Debug logging for development and monitoring
  console.log(`[DEBUG] Cache hit for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`);
};

/**
 * Increment cache miss counter for specified cache
 *
 * This function should be called whenever a cache lookup fails.
 * It automatically initializes metrics for new cache instances and provides
 * debug output to help identify cache performance issues during development.
 *
 * @param cacheName - Logical name of monitored cache for identification
 *
 * @example
 * // In cache implementation
 * if (!(data = cache.get(key))) {
 *   incCacheMiss('userCache'); // Track failed lookup
 *   return fetchData(key);
 * }
 */
export const incCacheMiss = (cacheName: string): void => {
  // Initialize metrics if this is first time tracking this cache
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });

  const metrics = cacheMetrics.get(cacheName)!;
  metrics.misses++;

  // Debug logging for performance analysis
  console.log(
    `[DEBUG] Cache miss for ${cacheName}: ${metrics.hits} hits, ${metrics.misses} misses`
  );
};

/**
 * Record the number of keys currently stored in cache
 *
 * This function should be called whenever the key count in a cache changes.
 * It helps track cache utilization and identify when caches need resizing.
 *
 * @param cacheName - Logical name of monitored cache
 * @param keyCount - Current number of keys stored in cache
 *
 * @example
 * // In cache implementation
 * setCacheKeys('userCache', cache.size); // Track current size
 */
export const setCacheKeys = (cacheName: string, keyCount: number): void => {
  // Initialize metrics if this is first time tracking this cache
  if (!cacheMetrics.has(cacheName)) cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });

  const metrics = cacheMetrics.get(cacheName)!;
  metrics.keys = keyCount;

  // Debug logging for cache utilization monitoring
  console.log(`[DEBUG] Cache ${cacheName} now has ${keyCount} keys`);
};

/**
 * Retrieve metrics for specific cache or all caches
 *
 * This function provides access to current performance metrics, allowing
 * for analysis of cache hit rates, miss rates, and utilization.
 * Returns a snapshot of current metrics without modifying them.
 *
 * @param cacheName - Optional cache name to filter specific cache metrics
 * @returns {CacheMetrics | AllCacheMetrics} Metrics for requested cache or all caches
 *
 * @example
 * // Get metrics for specific cache
 * const userCacheMetrics = getCacheMetrics('userCache');
 *
 * // Get metrics for all caches
 * const allMetrics = getCacheMetrics();
 */
export const getCacheMetrics = (cacheName?: string): CacheMetrics | AllCacheMetrics => {
  // Return metrics for specific cache if requested
  if (cacheName) return cacheMetrics.get(cacheName) || { hits: 0, misses: 0, keys: 0 };

  // Return copy of all metrics to prevent external modification
  const allMetrics: AllCacheMetrics = {};
  for (const [name, metrics] of Array.from(cacheMetrics)) {
    allMetrics[name] = { ...metrics }; // Create copy to maintain immutability
  }
  return allMetrics;
};

/**
 * Clear metrics counters for specific cache or globally
 *
 * This function resets performance metrics, useful for testing or
 * periodic metric collection. Can target specific cache or clear all.
 *
 * @param cacheName - Optional cache name to reset; if not provided, clears all metrics
 *
 * @example
 * // Reset metrics for specific cache
 * resetCacheMetrics('userCache');
 *
 * // Reset all metrics globally
 * resetCacheMetrics();
 */
export const resetCacheMetrics = (cacheName?: string): void => {
  if (cacheName) {
    // Reset metrics for specific cache if it exists
    if (cacheMetrics.has(cacheName)) {
      cacheMetrics.set(cacheName, { hits: 0, misses: 0, keys: 0 });
    }
  } else {
    // Clear all metrics globally
    cacheMetrics.clear();
  }
};
