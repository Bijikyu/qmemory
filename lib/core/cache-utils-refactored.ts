/**
 * Refactored Cache Utilities
 * Provides Redis functionality with separated concerns
 */

import type { RedisClientType } from 'redis';
import type { RedisOptions } from './cache-config-types.js';
import { CacheClientFactory } from './cache-client-factory.js';

/**
 * Main cache utilities export - maintains backward compatibility
 */
export function createRedisClient(options: RedisOptions = {}): RedisClientType {
  return CacheClientFactory.createRedisClient(options);
}

// Re-export types for backward compatibility
export type { RedisClientType as RedisClient, RedisOptions };
