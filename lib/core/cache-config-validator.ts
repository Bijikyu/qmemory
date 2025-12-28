/**
 * Redis Configuration Validator
 * Validates Redis connection parameters to ensure compliance with Redis client requirements
 */

export class CacheConfigValidator {
  /**
   * Normalizes numeric configuration values with validation
   */
  static asNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  /**
   * Validates Redis connection parameters
   */
  static validateRedisConfig(options: any): void {
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
  }
}
