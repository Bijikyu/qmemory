import { createClient as createRedisClientBase } from 'redis';
import {
  DEFAULT_REDIS_HOST,
  DEFAULT_REDIS_PORT,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_DB,
  REDIS_PASSWORD,
} from '../../config/localVars.js';
/**
 * Create a Redis client with default configuration
 *
 * @param options - Redis client configuration options
 * @returns Redis client instance
 */
export function createRedisClient(options = {}) {
  const clientOptions = {
    host: options.host || REDIS_HOST || DEFAULT_REDIS_HOST,
    port: options.port || Number(REDIS_PORT) || DEFAULT_REDIS_PORT,
    db: options.db || Number(REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    socket: {
      reconnectStrategy: retries => {
        if (retries > 10) {
          return new Error('Redis reconnection failed after 10 attempts');
        }
        return Math.min(retries * 50, 1000);
      },
      ...options.socket,
    },
  };
  if (options.password) {
    clientOptions.password = options.password;
  } else if (REDIS_PASSWORD) {
    clientOptions.password = REDIS_PASSWORD;
  }
  Object.assign(clientOptions, options);
  return createRedisClientBase(clientOptions);
}
// Re-export redis module for advanced usage
export { createClient as redisCreateClient, createClient } from 'redis';
