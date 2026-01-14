/**
 * Enhanced Caching Middleware for Scalability
 *
 * Uses lru-cache library for production-tested LRU functionality
 * with Redis fallback integration with existing cache infrastructure
 */

import { LRUCache } from 'lru-cache';
import { CacheClientFactory } from './cache-client-factory.js';
import { REDIS_HOST, REDIS_PORT, APP_NAME } from '../../config/localVars.js';
import type { Request, Response, NextFunction } from 'express';

interface CacheConfig {
  ttlMs: number;
  maxSize?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  invalidationStrategy?: 'ttl' | 'lru' | 'manual';
}

const caches = new Map<string, LRUCache<string, any>>();
const MAX_CACHE_INSTANCES = 50;
let redisClient: any = null;
let redisInitialized = false;

async function initializeRedis(): Promise<void> {
  if (redisInitialized) return;
  redisInitialized = true;

  try {
    if (REDIS_HOST && !redisClient) {
      redisClient = CacheClientFactory.createRedisClient({
        host: REDIS_HOST as string,
        port: typeof REDIS_PORT === 'string' ? parseInt(REDIS_PORT, 10) : (REDIS_PORT as number) || 6379,
      });

      await redisClient.connect();

      redisClient.on('error', (err: Error) => {
        console.error('Redis cache error, falling back to memory:', err.message);
        redisClient = null;
      });
    }
  } catch (error) {
    console.log('Redis not available for caching, using in-memory fallback');
    redisClient = null;
  }
}

initializeRedis().catch((error) => {
  console.warn('Failed to initialize Redis for enhanced caching:', error);
});

/**
 * Create enhanced caching middleware using lru-cache
 */
export function createCache(cacheName: string, config: CacheConfig) {
  const {
    ttlMs,
    maxSize = 1000,
    keyGenerator = (req) => `${req.method}:${req.path}:${req.ip}`,
    condition = () => true,
    invalidationStrategy = 'ttl',
  } = config;

  let cache = caches.get(cacheName);
  if (!cache) {
    if (caches.size >= MAX_CACHE_INSTANCES) {
      const oldestKey = caches.keys().next().value;
      if (oldestKey) {
        caches.delete(oldestKey);
        console.warn(`Cache container limit reached, removed: ${oldestKey}`);
      }
    }

    cache = new LRUCache<string, any>({
      max: maxSize,
      ttl: ttlMs,
      allowStale: false,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        console.debug(`Cache evicted: ${key}`);
      },
    });
    caches.set(cacheName, cache);
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      if (redisClient && redisClient.isOpen) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          const parsed =
            cachedData.startsWith('{') || cachedData.startsWith('[') ? JSON.parse(cachedData) : cachedData;
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Source', 'Redis');
          return res.json(parsed);
        }
      } else {
        const cachedData = cache!.get(cacheKey);
        if (cachedData !== undefined) {
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Source', 'LRU-Cache');
          return res.json(cachedData);
        }
      }

      res.set('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = function (data: any) {
        const dataToCache = JSON.stringify(data);

        if (redisClient && redisClient.isOpen) {
          redisClient.setEx(cacheKey, Math.ceil(ttlMs / 1000), dataToCache).catch((err: Error) => {
            console.error('Redis cache set error:', err.message);
          });
        } else {
          cache!.set(cacheKey, data);
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(cacheName: string, keyPattern?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cache = caches.get(cacheName);
      if (cache) {
        if (keyPattern) {
          for (const key of cache.keys()) {
            if (key.includes(keyPattern)) {
              cache.delete(key);
            }
          }
        } else {
          cache.clear();
        }
      }

      if (redisClient && redisClient.isOpen) {
        if (keyPattern) {
          const keys = await redisClient.keys(`*${keyPattern}*`);
          if (keys && keys.length > 0) {
            await redisClient.del(keys);
          }
        } else {
          const appPrefix = APP_NAME || 'qmemory';
          const keys = await redisClient.keys(`${appPrefix}:*`);
          if (keys && keys.length > 0) {
            await redisClient.del(keys);
          }
        }
      }

      res.set('X-Cache-Invalidated', 'true');
      next();
    } catch (error) {
      console.error('Cache invalidation error:', error);
      next();
    }
  };
}

/**
 * Get cache statistics for monitoring using lru-cache API
 */
export function getCacheStatistics(): Record<string, any> {
  const stats: Record<string, any> = {};
  const os = require('os');

  for (const [cacheName, cache] of caches.entries()) {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const memoryUsageRatio = memUsage.heapUsed / totalMemory;

    stats[cacheName] = {
      size: cache.size,
      maxSize: cache.max,
      calculatedSize: cache.calculatedSize,
      itemCount: Array.from(cache.keys()).length,
      memoryUsage: memUsage.heapUsed,
      memoryUsageRatio: memoryUsageRatio,
      keys: Array.from(cache.keys()),
    };
  }

  return stats;
}

/**
 * Graceful shutdown for all caches
 */
export async function shutdownCaches(): Promise<void> {
  for (const cache of caches.values()) {
    cache.clear();
  }
  caches.clear();

  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
  redisClient = null;
  redisInitialized = false;
}

/**
 * Get the current Redis client status
 */
export function getRedisStatus(): { connected: boolean; initialized: boolean } {
  return {
    connected: redisClient?.isOpen ?? false,
    initialized: redisInitialized,
  };
}

/**
 * Get all cache names currently registered
 */
export function getCacheNames(): string[] {
  return Array.from(caches.keys());
}

/**
 * Get a specific cache instance by name
 */
export function getCache(cacheName: string): LRUCache<string, any> | undefined {
  return caches.get(cacheName);
}

export default {
  createCache,
  invalidateCache,
  getCacheStatistics,
  shutdownCaches,
  getRedisStatus,
  getCacheNames,
  getCache,
};
