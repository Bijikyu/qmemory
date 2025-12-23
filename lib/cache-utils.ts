import {
  createClient as createRedisClientBase,
  type RedisClientOptions,
  type RedisClientType,
  type RedisFunctions,
  type RedisModules,
  type RedisScripts,
  type RespVersions,
  type TypeMapping,
} from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_PASSWORD } from '../config/localVars.js';

type BaseRedisOptions = RedisClientOptions<
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RespVersions,
  TypeMapping
>;

interface SocketOverrides extends Record<string, unknown> {
  host?: string;
  port?: number;
  reconnectStrategy?: (retries: number) => number | Error;
}

/**
 * Extended configuration accepted by the convenience Redis client factory.
 */
export interface RedisOptions extends Partial<BaseRedisOptions> {
  host?: string;
  port?: number;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  socket?: SocketOverrides;
}

export type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

/**
 * Computes a resilient reconnect strategy that caps delay escalation.
 * Configurable via environment variables for different deployment scenarios.
 */
const defaultReconnectStrategy = (retries: number): number | Error => {
  const maxRetries = Number(process.env.REDIS_MAX_RETRIES) || 10;
  const baseDelay = Number(process.env.REDIS_BASE_DELAY) || 50;
  const maxDelay = Number(process.env.REDIS_MAX_DELAY) || 1000;

  if (retries > maxRetries) {
    return new Error(`Redis reconnection failed after ${maxRetries} attempts`);
  }

  return Math.min(retries * baseDelay, maxDelay);
};

/**
 * Normalizes numeric configuration values with validation.
 */
const asNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Validates Redis connection parameters to ensure compliance with Redis client requirements.
 */
const validateRedisConfig = (options: RedisOptions): void => {
  if (options.host && typeof options.host !== 'string') {
    throw new Error('Redis host must be a string');
  }

  if (
    options.port &&
    (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535)
  ) {
    throw new Error('Redis port must be an integer between 1 and 65535');
  }

  if (options.db && (!Number.isInteger(options.db) || options.db < 0)) {
    throw new Error('Redis database must be a non-negative integer');
  }

  if (options.password && typeof options.password !== 'string') {
    throw new Error('Redis password must be a string');
  }

  if (
    options.retryDelayOnFailover &&
    (!Number.isInteger(options.retryDelayOnFailover) || options.retryDelayOnFailover < 0)
  ) {
    throw new Error('Redis retry delay on failover must be a non-negative integer');
  }

  if (
    options.maxRetriesPerRequest &&
    (!Number.isInteger(options.maxRetriesPerRequest) || options.maxRetriesPerRequest < 0)
  ) {
    throw new Error('Redis max retries per request must be a non-negative integer');
  }
};

/**
 * Builds a Redis client configured with sensible defaults for local development.
 *
 * @param options - User-supplied overrides for Redis configuration.
 * @returns Ready-to-use Redis client instance.
 */
export function createRedisClient(
  options: RedisOptions = {}
): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
  // Validate configuration before creating client
  validateRedisConfig(options);

  const {
    host,
    port,
    db,
    retryDelayOnFailover = 100,
    maxRetriesPerRequest = 3,
    socket,
    password,
    database,
    ...redisOptionOverrides
  } = options;

  const socketOverrides: SocketOverrides = { ...(socket ?? {}) };

  const sanitizedSocket: SocketOverrides = {
    ...socketOverrides,
    host: host ?? (socketOverrides.host as string | undefined) ?? REDIS_HOST,
    port:
      port ?? (socketOverrides.port as number | undefined) ?? asNumber(String(REDIS_PORT), 6379),
    reconnectStrategy: socketOverrides.reconnectStrategy ?? defaultReconnectStrategy,
  };

  const clientOptions: BaseRedisOptions & Record<string, unknown> = {
    ...(redisOptionOverrides as BaseRedisOptions),
    socket: sanitizedSocket as BaseRedisOptions['socket'],
    database: asNumber(String(db ?? database ?? REDIS_DB), 0),
    password: password ?? REDIS_PASSWORD,
    retryDelayOnFailover,
    maxRetriesPerRequest,
  };

  return createRedisClientBase<
    RedisModules,
    RedisFunctions,
    RedisScripts,
    RespVersions,
    TypeMapping
  >(clientOptions as BaseRedisOptions) as RedisClientType<
    RedisModules,
    RedisFunctions,
    RedisScripts
  >;
}

// Re-export redis module for advanced usage
export { createClient as redisCreateClient } from 'redis';
