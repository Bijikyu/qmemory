/**
 * LRU Cache Utilities
 * Direct usage of lru-cache npm module
 * 
 * This module provides direct access to the lru-cache npm module.
 * Performance monitoring can be added by wrapping the cache methods if needed.
 */

const { LRUCache } = require('lru-cache');

module.exports = {
  LRUCache
};