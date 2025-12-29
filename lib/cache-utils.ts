/**
 * Cache Utilities Module
 *
 * Purpose: Provides centralized Redis client management and caching functionality
 * throughout the application. This module serves as the main entry point for all
 * Redis operations while maintaining backward compatibility with existing code.
 *
 * Design Philosophy:
 * - Separation of concerns: Client creation logic is delegated to specialized factory
 * - Consistent configuration: All Redis clients use the same configuration patterns
 * - Backward compatibility: Existing code continues to work without modifications
 * - Type safety: Full TypeScript support with proper type definitions
 * - Performance optimization: Connection pooling and reuse through factory pattern
 *
 * Migration Rationale:
 * This module was refactored to separate client creation logic from cache operations.
 * The previous implementation mixed concerns, making it difficult to test and maintain.
 * The new architecture uses a factory pattern for better separation of concerns.
 *
 * Integration Notes:
 * - Used throughout the system for session management, API response caching, and data caching
 * - Integrates with the core cache client factory for consistent client creation
 * - Provides both modern and legacy function names for backward compatibility
 * - Follows the same configuration patterns as other utility modules
 *
 * Performance Considerations:
 * - Connection pooling is handled automatically by the factory
 * - Client reuse prevents connection overhead in high-traffic scenarios
 * - Type definitions have zero runtime overhead
 * - Factory pattern minimizes memory footprint
 *
 * Error Handling Strategy:
 * - Client creation errors are handled by the factory with detailed logging
 * - Configuration validation happens at creation time, not during operations
 * - Type checking prevents runtime errors from incorrect usage
 *
 * @author System Architecture Team
 * @version 2.0.0 (Refactored)
 */

import type { RedisClientType } from 'redis';
import type { RedisOptions } from './core/cache-config-types.js';
import { CacheClientFactory } from './core/cache-client-factory.js';

/**
 * Creates a Redis client with the specified configuration
 *
 * This is the primary function for creating Redis clients in the application.
 * It delegates to the CacheClientFactory for consistent client creation
 * and connection management.
 *
 * @param options - Redis connection and configuration options
 * @returns {RedisClientType} A configured Redis client instance
 *
 * @example
 * // Create client with default settings
 * const client = createRedisClient();
 *
 * // Create client with custom configuration
 * const client = createRedisClient({
 *   host: 'localhost',
 *   port: 6379,
 *   password: 'secret'
 * });
 */
export function createRedisClient(options: RedisOptions = {}): RedisClientType {
  return CacheClientFactory.createRedisClient(options);
}

/**
 * Type re-exports for backward compatibility and convenience
 *
 * These types are re-exported to maintain backward compatibility and provide
 * easy access to the most commonly used types without requiring additional imports.
 */
export type { RedisClientType as RedisClient, RedisOptions };

/**
 * Legacy Redis client creation function
 *
 * @deprecated Use createRedisClient() instead. This function is maintained
 * for backward compatibility with existing code that uses the old naming convention.
 *
 * @param options - Redis connection and configuration options
 * @returns {RedisClientType} A configured Redis client instance
 */
export function redisCreateClient(options: RedisOptions = {}): RedisClientType {
  return createRedisClient(options);
}
