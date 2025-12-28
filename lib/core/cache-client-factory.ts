/**
 * Redis Client Factory
 * Creates and configures Redis client instances
 */

// Re-export types for backward compatibility
export type { RedisClientType as RedisClient, RedisOptions } from './cache-config-types.js';

import { createClient as createRedisClientBase } from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_PASSWORD } from '../../config/localVars.js';
import qerrors from 'qerrors';
import type { RedisOptions, SocketOverrides } from './cache-config-types.js';
import { CacheConfigValidator } from './cache-config-validator.js';
import { CacheReconnectStrategy } from './cache-reconnect-strategy.js';

/**
 * Redis client factory with separated concerns
 */
export class CacheClientFactory {
  /**
   * Builds a Redis client configured with sensible defaults
   */
  static createRedisClient(options: RedisOptions = {}): any {
    try {
      // Validate configuration before creating client
      CacheConfigValidator.validateRedisConfig(options);

      const { host, port, db, socket, password, ...redisOptionOverrides } = options;

      // Build clean socket configuration
      const socketConfig = {
        host: host ?? socket?.host ?? REDIS_HOST,
        port: port ?? socket?.port ?? CacheReconnectStrategy.asNumber(String(REDIS_PORT), 6379),
        reconnectStrategy: socket?.reconnectStrategy ?? CacheReconnectStrategy.getStrategy,
      };

      // Build clean client options
      const clientOptions = {
        ...redisOptionOverrides,
        socket: socketConfig,
        database: CacheReconnectStrategy.asNumber(String(db ?? REDIS_DB)),
        password: password ?? REDIS_PASSWORD,
      };

      // Create client with type assertion for Redis module compatibility
      return createRedisClientBase(clientOptions);
    } catch (error) {
      qerrors.qerrors(error as Error, 'cache-utils.createRedisClient', {
        hasCustomHost: options.host !== undefined,
        hasCustomPort: options.port !== undefined,
        hasCustomDb: options.db !== undefined,
        hasCustomPassword: options.password !== undefined,
        hasRetryDelay: options.retryDelayOnFailover !== undefined,
        hasMaxRetries: options.maxRetriesPerRequest !== undefined,
      });
      throw error;
    }
  }
}
