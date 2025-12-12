/**
 * LRU Cache Utilities
 * Direct wrapper around lru-cache npm module with performance monitoring integration
 * 
 * This module provides a simplified interface to the lru-cache npm module while
 * maintaining integration with the existing performance monitoring system.
 */

const { LRUCache } = require('lru-cache');
const { incCacheHit, incCacheMiss, setCacheKeys } = require('./perf.js');

/**
 * Creates a new LRU cache instance with performance monitoring
 * 
 * @param {Object} opts - Cache configuration options
 * @param {string} opts.name - Name of the cache for performance tracking
 * @param {number} opts.max - Maximum number of items to store in cache
 * @param {number} [opts.ttl] - Time-to-live in milliseconds for cache entries
 * @returns {Object} Cache instance with monitoring
 */
function createCache(opts) {
  const lru = new LRUCache({ 
    max: opts.max, 
    ttl: opts.ttl
  });
  
  const name = opts.name;

  function get(key) {
    const value = lru.get(key);
    if (value !== undefined) {
      incCacheHit(name);
    } else {
      incCacheMiss(name);
    }
    return value;
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