/**
 * Circuit Breaker Wrapper using opossum
 * 
 * This module provides a wrapper around the opossum circuit breaker
 * to maintain backward compatibility with the existing API while
 * leveraging the superior features of the industry-standard package.
 */

const CircuitBreaker = require('opossum');

const STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
};

/**
 * Circuit Breaker Wrapper Class
 * Maintains the same API as the original implementation
 */
class CircuitBreakerWrapper {
  constructor(options = {}) {
    // Map original options to opossum options
    const opossumOptions = {
      timeout: options.timeout || 30000,
      errorThresholdPercentage: options.errorThresholdPercentage || 50,
      resetTimeout: options.resetTimeout || 60000,
      rollingCountTimeout: options.rollingCountTimeout || 10000,
      rollingCountBuckets: options.rollingCountBuckets || 10,
      minimumNumberOfCalls: options.minimumNumberOfCalls || 5,
      volumeThreshold: options.volumeThreshold || 5,
      statusMinRequestThreshold: options.statusMinRequestThreshold || 1,
      cacheEnabled: options.cacheEnabled || false,
      maxRetries: options.maxRetries || 0,
      retryDelay: options.retryDelay || 100
    };

    // Store options for backward compatibility
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    
    // Create opossum circuit breaker
    this.opossumBreaker = new CircuitBreaker(async (...args) => {
      if (!this.currentOperation) {
        throw new Error('No operation set. Use execute() method.');
      }
      return await this.currentOperation(...args);
    }, opossumOptions);
    
    // Store current operation for execution
    this.currentOperation = null;
    
    // Store current operation for execution
    this.currentOperation = null;

    // Map opossum events to our internal state
    this.opossumBreaker.on('open', () => {
      this.state = STATES.OPEN;
    });

    this.opossumBreaker.on('halfOpen', () => {
      this.state = STATES.HALF_OPEN;
    });

    this.opossumBreaker.on('close', () => {
      this.state = STATES.CLOSED;
    });

    this.state = STATES.CLOSED;
  }

  /**
   * Execute an operation through the circuit breaker
   * 
   * @param {Function} operation - Async operation to execute
   * @param {...any} args - Arguments to pass to the operation
   * @returns {Promise<any>} Result of the operation
   * @throws {Error} If circuit is open or operation fails
   */
  async execute(operation, ...args) {
    // Store the operation for the circuit breaker to use
    this.currentOperation = operation;
    
    try {
      const result = await this.opossumBreaker.fire(...args);
      return result;
    } catch (error) {
      // Check if this is a circuit breaker open error
      if (this.opossumBreaker.opened) {
        throw new Error('Circuit breaker is OPEN');
      }
      throw error;
    } finally {
      this.currentOperation = null;
    }
  }

  /**
   * Get current state
   * 
   * @returns {string} Current circuit breaker state
   */
  getState() {
    // Map opossum state to our state constants
    if (this.opossumBreaker.opened) {
      return STATES.OPEN;
    } else if (this.opossumBreaker.halfOpen) {
      return STATES.HALF_OPEN;
    } else {
      return STATES.CLOSED;
    }
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.opossumBreaker.close();
    this.state = STATES.CLOSED;
  }

  /**
   * Get statistics from opossum circuit breaker
   * 
   * @returns {Object} Circuit breaker statistics
   */
  getStats() {
    return this.opossumBreaker.stats;
  }

  /**
   * Check if circuit is closed
   * 
   * @returns {boolean} True if circuit is closed
   */
  isClosed() {
    return this.opossumBreaker.isClosed();
  }

  /**
   * Check if circuit is open
   * 
   * @returns {boolean} True if circuit is open
   */
  isOpen() {
    return this.opossumBreaker.opened;
  }

  /**
   * Get the underlying opossum circuit breaker for advanced usage
   * 
   * @returns {CircuitBreaker} The opossum circuit breaker instance
   */
  getOpossumBreaker() {
    return this.opossumBreaker;
  }
}

/**
 * Create a new circuit breaker instance
 * 
 * @param {Object} options - Configuration options
 * @returns {CircuitBreakerWrapper} New circuit breaker wrapper instance
 */
function createCircuitBreaker(options = {}) {
  return new CircuitBreakerWrapper(options);
}

module.exports = {
  CircuitBreaker: CircuitBreakerWrapper,
  createCircuitBreaker,
  STATES
};