/**
 * LRU Cache Implementation with Performance Monitoring
 * High-performance in-memory cache with size limits and performance tracking
 * 
 * This module provides an LRU (Least Recently Used) cache implementation that
 * integrates with the performance monitoring system for cache hit/miss tracking.
 */

const { LRUCache } = require('lru-cache');
const { incCacheHit, incCacheMiss, setCacheKeys } = require('./perf.js');

/**
 * @typedef {Object} CacheOptions
 * @property {string} name - Name of the cache for performance tracking
 * @property {number} max - Maximum number of items to store in cache
 * @property {number} [ttl] - Time-to-live in milliseconds for cache entries
 */

/**
 * Creates a new LRU cache instance with performance monitoring
 * 
 * @template K, V
 * @param {CacheOptions<K, V>} opts - Cache configuration options
 * @returns {Object} Cache instance with get, set, delete, clear methods and access to underlying LRU
 */
function createCache(opts) {
  const lru = new LRUCache({ max: opts.max, ttl: opts.ttl });
  const name = opts.name;

  function get(key) {
    const v = lru.get(key);
    if (typeof v === 'undefined') {
      incCacheMiss(name);
    } else {
      incCacheHit(name);
    }
    return v;
  }

  function set(key, val) {
    lru.set(key, val);
    try { 
      setCacheKeys(name, lru.size); 
    } catch (error) {
      console.warn(`Failed to update cache key count for ${name}:`, error.message);
    }
  }

  function del(key) {
    lru.delete(key);
    try { 
      setCacheKeys(name, lru.size); 
    } catch (error) {
      console.warn(`Failed to update cache key count for ${name}:`, error.message);
    }
  }

  function clear() {
    lru.clear();
    try { 
      setCacheKeys(name, lru.size); 
    } catch (error) {
      console.warn(`Failed to update cache key count for ${name}:`, error.message);
    }
  }

  return { get, set, delete: del, clear, lru };
}

module.exports = {
  createCache
};