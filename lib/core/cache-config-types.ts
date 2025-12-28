/**
 * Redis Configuration Types
 * Type definitions for Redis client configuration
 */

export interface SocketOverrides extends Record<string, unknown> {
  host?: string;
  port?: number;
  reconnectStrategy?: (retries: number) => number | Error;
}

export interface RedisOptions {
  host?: string;
  port?: number;
  db?: number;
  password?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  socket?: SocketOverrides;
}

// Re-export RedisClientType for backward compatibility
export type RedisClientType = any;
