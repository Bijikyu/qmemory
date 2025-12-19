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
 */
const defaultReconnectStrategy = (retries: number): number | Error => {
  if (retries > 10) return new Error('Redis reconnection failed after 10 attempts');
  return Math.min(retries * 50, 1000);
};

/**
 * Normalizes numeric configuration values.
 */
const asNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    host: host ?? (socketOverrides.host as string | undefined) ?? process.env.REDIS_HOST ?? 'localhost',
    port:
      port ??
      (socketOverrides.port as number | undefined) ??
      asNumber(process.env.REDIS_PORT, 6379),
    reconnectStrategy: socketOverrides.reconnectStrategy ?? defaultReconnectStrategy,
  };

  const clientOptions: BaseRedisOptions & Record<string, unknown> = {
    ...(redisOptionOverrides as BaseRedisOptions),
    socket: sanitizedSocket as BaseRedisOptions['socket'],
    database: db ?? database ?? asNumber(process.env.REDIS_DB, 0),
    password: password ?? process.env.REDIS_PASSWORD,
    retryDelayOnFailover,
    maxRetriesPerRequest,
  };

  return createRedisClientBase<
    RedisModules,
    RedisFunctions,
    RedisScripts,
    RespVersions,
    TypeMapping
  >(clientOptions as BaseRedisOptions) as RedisClientType<RedisModules, RedisFunctions, RedisScripts>;
}

// Re-export redis module for advanced usage
export { createClient as redisCreateClient } from 'redis';
