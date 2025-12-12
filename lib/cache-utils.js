/**
 * Cache Utility Functions
 * Direct usage of redis npm module with development mode bypass
 * 
 * This module provides direct access to the redis npm module for caching.
 * Environment-aware behavior is maintained for development convenience.
 */

const redis = require('redis');

/**
 * Creates a Redis client with configuration
 * 
 * @param {Object} options - Redis connection options
 * @returns {Object} Redis client instance
 */
function createRedisClient(options = {}) {
  const clientOptions = {
    host: options.host || process.env.REDIS_HOST || 'localhost',
    port: options.port || process.env.REDIS_PORT || 6379,
    password: options.password || process.env.REDIS_PASSWORD,
    db: options.db || process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    ...options
  };
  
  return redis.createClient(clientOptions);
}

module.exports = {
  createRedisClient,
  redis
};