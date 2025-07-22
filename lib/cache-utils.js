/**
 * Cache Utility Functions
 * Redis-based caching with development mode bypass and fallback patterns
 * 
 * This module provides caching functionality that automatically adapts to different
 * environments - using Redis for production caching while bypassing cache in 
 * development for faster iteration cycles.
 * 
 * Design philosophy:
 * - Environment-aware caching: Redis in production, bypass in development
 * - Graceful degradation when Redis is unavailable
 * - Consistent error handling following library patterns
 * - Performance optimization through intelligent cache strategies
 * 
 * Cache strategies:
 * - Simple key-value caching with TTL
 * - JSON serialization for complex objects
 * - Automatic fallback to direct execution on Redis errors
 * - Development mode bypass for faster debugging
 */

const { logFunctionEntry, logFunctionExit, logFunctionError } = require('./logging-utils');

// Redis client instance - will be undefined in development or when Redis unavailable
let redisClient = null;

/**
 * Initializes Redis client connection for caching operations
 * 
 * This function attempts to establish a Redis connection for production caching.
 * It handles connection errors gracefully and logs the connection status for monitoring.
 * 
 * @param {Object} options - Redis connection options
 * @param {string} options.host - Redis server host (default: localhost)
 * @param {number} options.port - Redis server port (default: 6379)
 * @param {string} options.password - Redis password if authentication required
 * @param {number} options.db - Redis database number (default: 0)
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
async function initializeRedisClient(options = {}) {
  logFunctionEntry('initializeRedisClient', { options });
  
  // Skip Redis initialization in development mode for faster startup
  if (process.env.NODE_ENV === 'development') {
    console.log('[INFO] Development mode detected, skipping Redis initialization');
    logFunctionExit('initializeRedisClient', false);
    return false;
  }
  
  try {
    // Dynamically import redis to avoid requiring it in development
    const redis = require('redis');
    
    const clientOptions = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      ...options
    };
    
    redisClient = redis.createClient(clientOptions);
    
    // Handle Redis connection events for monitoring
    redisClient.on('connect', () => {
      console.log('[INFO] Redis client connected successfully');
    });
    
    redisClient.on('error', (error) => {
      console.warn('[WARN] Redis connection error:', error.message);
      redisClient = null; // Reset client on error to trigger fallback
    });
    
    redisClient.on('end', () => {
      console.log('[INFO] Redis connection closed');
      redisClient = null;
    });
    
    await redisClient.connect();
    
    console.log('[INFO] Redis cache initialized and ready');
    logFunctionExit('initializeRedisClient', true);
    return true;
    
  } catch (error) {
    logFunctionError('initializeRedisClient', error, { options });
    console.warn('[WARN] Failed to initialize Redis cache, caching will be disabled:', error.message);
    redisClient = null;
    return false;
  }
}

/**
 * Disconnects Redis client gracefully
 * 
 * Properly closes Redis connection to prevent connection leaks.
 * Safe to call multiple times or when client is not connected.
 * 
 * @returns {Promise<void>}
 */
async function disconnectRedis() {
  logFunctionEntry('disconnectRedis');
  
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[INFO] Redis client disconnected gracefully');
    } catch (error) {
      console.warn('[WARN] Error during Redis disconnect:', error.message);
    } finally {
      redisClient = null;
    }
  }
  
  logFunctionExit('disconnectRedis');
}

/**
 * Caches a function's result using Redis (in production) or bypasses cache (in development)
 * 
 * This function provides intelligent caching that adapts to the environment:
 * - Production: Uses Redis for persistent caching with TTL
 * - Development: Bypasses cache for faster iteration and debugging
 * - Fallback: Executes function directly if Redis is unavailable
 * 
 * @param {string} key - Unique cache key for storing the result
 * @param {number} ttl - Time-to-live in seconds for cache expiration
 * @param {Function} fn - Async function to execute and cache the result
 * @returns {Promise<*>} The cached result or fresh execution result
 * 
 * @example
 * // Cache expensive database query for 5 minutes
 * const users = await withCache('users:active', 300, async () => {
 *   return await User.find({ status: 'active' });
 * });
 * 
 * @example
 * // Cache API response for 1 hour with dynamic key
 * const weather = await withCache(`weather:${city}`, 3600, async () => {
 *   return await fetchWeatherAPI(city);
 * });
 */
async function withCache(key, ttl, fn) {
  logFunctionEntry('withCache', { key, ttl, hasFn: typeof fn === 'function' });
  
  // Validate input parameters
  if (typeof key !== 'string' || !key.trim()) {
    const error = new Error('Cache key must be a non-empty string');
    logFunctionError('withCache', error, { key, ttl });
    throw error;
  }
  
  if (typeof ttl !== 'number' || ttl <= 0) {
    const error = new Error('TTL must be a positive number');
    logFunctionError('withCache', error, { key, ttl });
    throw error;
  }
  
  if (typeof fn !== 'function') {
    const error = new Error('Function parameter must be a callable function');
    logFunctionError('withCache', error, { key, ttl });
    throw error;
  }
  
  // In development mode, always execute function without caching for faster iteration
  if (process.env.NODE_ENV === 'development' || !redisClient) {
    console.log(`[DEBUG] Cache bypass for key: ${key} (development mode or Redis unavailable)`);
    const result = await fn();
    logFunctionExit('withCache', { cached: false, hasResult: result !== undefined });
    return result;
  }
  
  try {
    // Attempt to retrieve cached result
    console.log(`[DEBUG] Checking cache for key: ${key}`);
    const cached = await redisClient.get(key);
    
    if (cached !== null) {
      console.log(`[DEBUG] Cache hit for key: ${key}`);
      try {
        const parsedResult = JSON.parse(cached);
        logFunctionExit('withCache', { cached: true, hasResult: parsedResult !== undefined });
        return parsedResult;
      } catch (parseError) {
        console.warn(`[WARN] Failed to parse cached data for key ${key}, executing fresh:`, parseError.message);
        // Continue to execute function fresh if parsing fails
      }
    } else {
      console.log(`[DEBUG] Cache miss for key: ${key}`);
    }
    
    // Execute function and cache the result
    console.log(`[DEBUG] Executing function for key: ${key}`);
    const result = await fn();
    
    // Cache the result with TTL
    try {
      const serializedResult = JSON.stringify(result);
      await redisClient.setEx(key, ttl, serializedResult);
      console.log(`[DEBUG] Cached result for key: ${key} with TTL: ${ttl}s`);
    } catch (cacheError) {
      console.warn(`[WARN] Failed to cache result for key ${key}:`, cacheError.message);
      // Continue execution even if caching fails
    }
    
    logFunctionExit('withCache', { cached: false, hasResult: result !== undefined });
    return result;
    
  } catch (error) {
    // Log Redis errors but don't fail the operation
    logFunctionError('withCache', error, { key, ttl });
    console.warn(`[WARN] Redis cache error for key ${key}, falling back to direct execution:`, error.message);
    
    // Fallback to direct function execution
    const result = await fn();
    logFunctionExit('withCache', { cached: false, fallback: true, hasResult: result !== undefined });
    return result;
  }
}

/**
 * Invalidates a specific cache key or pattern
 * 
 * Removes cached data to force fresh execution on next access.
 * Supports both single key deletion and pattern-based deletion.
 * 
 * @param {string} keyOrPattern - Cache key or pattern to invalidate
 * @param {boolean} isPattern - Whether the key is a pattern (uses KEYS command)
 * @returns {Promise<number>} Number of keys deleted
 * 
 * @example
 * // Invalidate specific cache key
 * await invalidateCache('users:active');
 * 
 * @example
 * // Invalidate all weather cache entries
 * await invalidateCache('weather:*', true);
 */
async function invalidateCache(keyOrPattern, isPattern = false) {
  logFunctionEntry('invalidateCache', { keyOrPattern, isPattern });
  
  if (process.env.NODE_ENV === 'development' || !redisClient) {
    console.log(`[DEBUG] Cache invalidation skipped: ${keyOrPattern} (development mode or Redis unavailable)`);
    logFunctionExit('invalidateCache', 0);
    return 0;
  }
  
  try {
    let deletedCount = 0;
    
    if (isPattern) {
      // Find keys matching pattern and delete them
      const keys = await redisClient.keys(keyOrPattern);
      if (keys.length > 0) {
        deletedCount = await redisClient.del(keys);
        console.log(`[DEBUG] Invalidated ${deletedCount} cache keys matching pattern: ${keyOrPattern}`);
      } else {
        console.log(`[DEBUG] No cache keys found matching pattern: ${keyOrPattern}`);
      }
    } else {
      // Delete single key
      deletedCount = await redisClient.del(keyOrPattern);
      if (deletedCount > 0) {
        console.log(`[DEBUG] Invalidated cache key: ${keyOrPattern}`);
      } else {
        console.log(`[DEBUG] Cache key not found: ${keyOrPattern}`);
      }
    }
    
    logFunctionExit('invalidateCache', deletedCount);
    return deletedCount;
    
  } catch (error) {
    logFunctionError('invalidateCache', error, { keyOrPattern, isPattern });
    console.warn(`[WARN] Failed to invalidate cache ${keyOrPattern}:`, error.message);
    return 0;
  }
}

/**
 * Gets cache statistics and health information
 * 
 * Provides insights into cache performance, connection status, and Redis server info.
 * Useful for monitoring and debugging cache behavior.
 * 
 * @returns {Promise<Object>} Cache statistics object
 */
async function getCacheStats() {
  logFunctionEntry('getCacheStats');
  
  const stats = {
    connected: false,
    environment: process.env.NODE_ENV || 'development',
    redisAvailable: !!redisClient
  };
  
  if (process.env.NODE_ENV === 'development') {
    stats.message = 'Caching disabled in development mode';
    logFunctionExit('getCacheStats', stats);
    return stats;
  }
  
  if (!redisClient) {
    stats.message = 'Redis client not initialized';
    logFunctionExit('getCacheStats', stats);
    return stats;
  }
  
  try {
    // Test Redis connection
    await redisClient.ping();
    stats.connected = true;
    
    // Get Redis server info
    const info = await redisClient.info();
    const lines = info.split('\r\n');
    
    // Parse relevant Redis metrics
    for (const line of lines) {
      if (line.startsWith('used_memory_human:')) {
        stats.memoryUsage = line.split(':')[1];
      }
      if (line.startsWith('connected_clients:')) {
        stats.connectedClients = parseInt(line.split(':')[1]);
      }
      if (line.startsWith('total_commands_processed:')) {
        stats.totalCommands = parseInt(line.split(':')[1]);
      }
    }
    
    stats.message = 'Redis cache operational';
    
  } catch (error) {
    logFunctionError('getCacheStats', error);
    stats.error = error.message;
    stats.message = 'Redis cache error';
  }
  
  logFunctionExit('getCacheStats', stats);
  return stats;
}

// Export cache utilities using object shorthand for clean module interface
// This pattern allows for easy extension with additional cache utilities
// while maintaining a simple import structure for consumers
module.exports = {
  withCache,              // main caching function for wrapping expensive operations
  initializeRedisClient,  // Redis connection setup for production environments
  disconnectRedis,        // graceful Redis connection cleanup
  invalidateCache,        // cache invalidation for fresh data requirements
  getCacheStats,          // cache monitoring and health check utilities
  
  // Test helper for dependency injection (only used in tests)
  __setRedisClient: (client) => {
    redisClient = client;
  }
};