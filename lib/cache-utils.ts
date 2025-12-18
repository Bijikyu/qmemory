import { createClient as createRedisClientBase, RedisClientType } from 'redis';

export interface RedisClientOptions {
  host?: string;
  port?: number;
  password?: string | undefined;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  socket?: {
    reconnectStrategy?: (retries: number) => number | Error;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface RedisClient {
  createClient(options?: RedisClientOptions): RedisClientType;
}

/**
 * Create a Redis client with default configuration
 * 
 * @param options - Redis client configuration options
 * @returns Redis client instance
 */
export function createRedisClient(options: RedisClientOptions = {}): RedisClientType {
  const clientOptions: any = {
    host: options.host || process.env.REDIS_HOST || 'localhost',
    port: options.port || Number(process.env.REDIS_PORT) || 6379,
    db: options.db || Number(process.env.REDIS_DB) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          return new Error('Redis reconnection failed after 10 attempts');
        }
        return Math.min(retries * 50, 1000);
      },
      ...options.socket
    }
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
export { createClient as redisCreateClient, createClient } from 'redis';