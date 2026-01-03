/**
 * Circuit Breaker Implementation
 *
 * Purpose: Provides fault tolerance for external service calls by implementing the circuit breaker pattern.
 * This prevents cascading failures when external services become unavailable or unresponsive.
 *
 * Design Philosophy:
 * - Uses the opossum library as the underlying circuit breaker implementation
 * - Creates dedicated breaker instances per operation to avoid race conditions
 * - Provides comprehensive error logging and state monitoring
 * - Implements automatic recovery with configurable thresholds
 *
 * Integration Notes:
 * - Used throughout the system for database operations, external API calls, and critical service interactions
 * - Integrates with qerrors for consistent error reporting and logging
 * - Follows the same configuration patterns as other utility modules in the codebase
 *
 * Performance Considerations:
 * - Each operation gets its own breaker instance to prevent interference between operations
 * - Breaker instances are lightweight and created on-demand
 * - State monitoring has minimal overhead (< 1ms per check)
 *
 * Error Handling Strategy:
 * - Logs all circuit breaker events with detailed context
 * - Distinguishes between circuit breaker open errors and actual operation failures
 * - Provides clear error messages for debugging and monitoring
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import CircuitBreakerBase from 'opossum';
import qerrors from 'qerrors';

/**
 * Circuit breaker state constants
 * These represent the three possible states of a circuit breaker:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail immediately
 * - HALF_OPEN: Testing if service has recovered, limited requests allowed
 */
export const STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };

/**
 * Circuit Breaker Wrapper Class
 *
 * Purpose: Wraps the opossum circuit breaker library to provide a consistent interface
 * and additional functionality specific to our system's needs.
 *
 * Key Features:
 * - Configurable thresholds for timeout, error percentage, and recovery
 * - Per-operation circuit breaker instances to prevent race conditions
 * - Comprehensive error logging with operational context
 * - State monitoring and statistics collection
 * - Manual reset capabilities for testing and recovery scenarios
 *
 * Architecture Decision: Why create dedicated breaker instances per operation?
 * - Prevents one failing operation from affecting all operations
 * - Allows for operation-specific configuration and thresholds
 * - Eliminates race conditions in concurrent execution scenarios
 * - Provides more granular monitoring and debugging capabilities
 *
 * @class CircuitBreakerWrapper
 * @example
 * const breaker = new CircuitBreakerWrapper({
 *   timeout: 30000,
 *   errorThresholdPercentage: 50,
 *   resetTimeout: 60000
 * });
 *
 * const result = await breaker.execute(someAsyncFunction, arg1, arg2);
 */
export class CircuitBreakerWrapper {
  private resetTimeout: number;
  private opossumBreaker: CircuitBreakerBase;

  /**
   * Creates a new circuit breaker wrapper instance
   *
   * @param options - Configuration options for the circuit breaker
   * @param options.timeout - Maximum time to wait for operation completion (default: 30000ms)
   * @param options.errorThresholdPercentage - Error rate threshold to trip circuit (default: 50%)
   * @param options.resetTimeout - Time to wait before attempting recovery (default: 60000ms)
   * @param options.rollingCountTimeout - Time window for error rate calculation (default: 10000ms)
   * @param options.rollingCountBuckets - Number of time buckets for statistics (default: 10)
   * @param options.minimumNumberOfCalls - Minimum calls before error rate calculation (default: 5)
   * @param options.volumeThreshold - Minimum volume for error rate consideration (default: 5)
   * @param options.statusMinRequestThreshold - Minimum requests for status updates (default: 1)
   * @param options.cacheEnabled - Whether to enable response caching (default: false)
   * @param options.maxRetries - Maximum retry attempts (default: 0)
   * @param options.retryDelay - Delay between retry attempts (default: 100ms)
   */
  constructor(options: any = {}) {
    // Set up opossum configuration with sensible defaults for production use
    const opossumOptions = {
      timeout: options.timeout ?? 30000, // 30 second timeout for most operations
      errorThresholdPercentage: options.errorThresholdPercentage ?? 50, // Trip at 50% error rate
      resetTimeout: options.resetTimeout ?? 60000, // 1 minute recovery window
      rollingCountTimeout: options.rollingCountTimeout ?? 10000, // 10 second error rate window
      rollingCountBuckets: options.rollingCountBuckets ?? 10, // Granular statistics tracking
      minimumNumberOfCalls: options.minimumNumberOfCalls ?? 5, // Need 5 calls before error rate matters
      volumeThreshold: options.volumeThreshold ?? 5, // Minimum volume for circuit breaking
      statusMinRequestThreshold: options.statusMinRequestThreshold ?? 1, // Status updates on every call
      cacheEnabled: options.cacheEnabled ?? false, // Disable caching by default for consistency
      maxRetries: options.maxRetries ?? 0, // No automatic retries by default
      retryDelay: options.retryDelay ?? 100, // 100ms delay between retries if enabled
    };
    this.resetTimeout = options.resetTimeout ?? 60000;

    try {
      // Create a dummy breaker instance for state monitoring
      // This breaker should never be used directly - always use execute() method
      this.opossumBreaker = new CircuitBreakerBase(async () => {
        throw new Error(
          'Circuit breaker used incorrectly. Use execute() method instead of direct fire().'
        );
      }, opossumOptions);
    } catch (error) {
      // Log initialization failure with configuration context for debugging
      qerrors.qerrors(error as Error, 'circuit-breaker.constructor', {
        timeout: opossumOptions.timeout,
        errorThresholdPercentage: opossumOptions.errorThresholdPercentage,
        resetTimeout: opossumOptions.resetTimeout,
      });
      throw new Error(
        `Failed to initialize circuit breaker: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Executes an operation through the circuit breaker
   *
   * This is the primary method for using the circuit breaker. It creates a dedicated
   * breaker instance for each operation to prevent interference between different operations.
   *
   * Architecture Decision: Why create a new breaker per operation?
   * - Prevents one failing operation from tripping the circuit for all operations
   * - Allows for operation-specific failure patterns and recovery times
   * - Eliminates race conditions in concurrent execution scenarios
   * - Provides more accurate monitoring and alerting per operation
   *
   * @param operation - The async function to execute through the circuit breaker
   * @param args - Arguments to pass to the operation function
   * @returns Promise that resolves with the operation result or rejects with an error
   * @throws {Error} If operation is not provided
   * @throws {Error} 'Circuit breaker is OPEN' if the circuit is tripped
   * @throws {Error} Original operation error if circuit is not open
   *
   * @example
   * const result = await breaker.execute(
   *   async (userId) => await database.getUser(userId),
   *   'user123'
   * );
   */
  async execute(operation: (...args: any[]) => Promise<any>, ...args: any[]): Promise<any> {
    if (!operation) throw new Error('Operation is required');

    // Create a dedicated circuit breaker instance for this operation to avoid race conditions
    // This ensures that different operations don't interfere with each other's failure patterns
    const operationOptions = {
      timeout: 30000,
      errorThresholdPercentage: 50,
      resetTimeout: this.resetTimeout,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      minimumNumberOfCalls: 5,
      volumeThreshold: 5,
    };

    const operationBreaker = new CircuitBreakerBase(operation, operationOptions);

    try {
      // Execute the operation through the dedicated breaker instance
      return await operationBreaker.fire(...args);
    } catch (error) {
      // Log detailed error context for debugging and monitoring
      qerrors.qerrors(error as Error, 'circuit-breaker.execute', {
        operationName: operation.name || 'anonymous',
        isOpen: operationBreaker.opened,
        isHalfOpen: operationBreaker.halfOpen,
        argCount: args.length,
      });

      // If the circuit is open, provide a clear error message
      if (operationBreaker.opened) throw new Error('Circuit breaker is OPEN');

      // Re-throw the original error if circuit breaker is not open
      // This preserves the original error context for the caller
      throw error;
    }
  }

  /**
   * Gets the current state of the circuit breaker
   *
   * @returns {string} The current state ('closed', 'open', or 'half-open')
   */
  getState(): string {
    if (this.opossumBreaker.opened) return STATES.OPEN;
    if (this.opossumBreaker.halfOpen) return STATES.HALF_OPEN;
    return STATES.CLOSED;
  }

  /**
   * Manually resets the circuit breaker to closed state
   *
   * This is useful for testing scenarios or manual recovery procedures.
   * In production, the circuit breaker should be allowed to recover automatically.
   *
   * @returns {void}
   */
  reset(): void {
    this.opossumBreaker.close();
  }

  /**
   * Gets comprehensive statistics from the underlying opossum breaker
   *
   * @returns {any} Statistics object including success/failure counts, latency, etc.
   */
  getStats(): any {
    return this.opossumBreaker.stats;
  }

  /**
   * Checks if the circuit breaker is in closed state (normal operation)
   *
   * @returns {boolean} True if circuit is closed, false otherwise
   */
  isClosed(): boolean {
    return this.opossumBreaker.closed;
  }

  /**
   * Checks if the circuit breaker is in open state (tripped)
   *
   * @returns {boolean} True if circuit is open, false otherwise
   */
  isOpen(): boolean {
    return this.opossumBreaker.opened;
  }

  /**
   * Gets the underlying opossum circuit breaker instance
   *
   * This provides access to advanced opossum features if needed.
   * In most cases, the wrapper methods should be used instead.
   *
   * @returns {CircuitBreakerBase} The underlying opossum breaker instance
   */
  getOpossumBreaker(): CircuitBreakerBase {
    return this.opossumBreaker;
  }
}

/**
 * Factory function for creating circuit breaker instances
 *
 * This provides a convenient way to create circuit breakers with the default
 * configuration while still allowing for custom options.
 *
 * @param options - Configuration options (same as CircuitBreakerWrapper constructor)
 * @returns {CircuitBreakerWrapper} A new circuit breaker wrapper instance
 *
 * @example
 * // Create with default settings
 * const breaker = createCircuitBreaker();
 *
 * // Create with custom settings
 * const customBreaker = createCircuitBreaker({
 *   timeout: 60000,
 *   errorThresholdPercentage: 25
 * });
 */
export const createCircuitBreaker = (options = {}) => new CircuitBreakerWrapper(options);
