import { createClient as createRedisClientBase } from 'redis';

// Type definitions
export interface RedisOptions {
  host?: string;
  port?: number;
  db?: number;
  password?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  socket?: {
    reconnectStrategy?: (retries: number) => number | Error;
  };
}

/**
 * Create a Redis client with default configuration
 *
 * @param options - Redis client configuration options
 * @returns Redis client instance
 */
export function createRedisClient(options: RedisOptions = {}) {
  const clientOptions: any = {
    socket: {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || Number(process.env.REDIS_PORT) || 6379,
      reconnectStrategy: (retries: number): number | Error => {
        if (retries > 10) {
          return new Error('Redis reconnection failed after 10 attempts');
        }
        return Math.min(retries * 50, 1000);
      },
      ...options.socket,
    },
    database: options.db || Number(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: options.retryDelayOnFailover || 100,
    maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
  };

  if (options.password) {
    clientOptions.password = options.password;
  } else if (process.env.REDIS_PASSWORD) {
    clientOptions.password = process.env.REDIS_PASSWORD;
  }

  Object.assign(clientOptions, options);
  return createRedisClientBase(clientOptions);
}

// Re-export redis module for advanced usage
export { createClient as redisCreateClient } from 'redis';
