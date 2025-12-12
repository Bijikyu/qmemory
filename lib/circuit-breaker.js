/**
 * Circuit Breaker Implementation
 * Implements the circuit breaker pattern for fault tolerance
 * 
 * The circuit breaker pattern prevents cascading failures by monitoring
 * operations and "opening" the circuit when failure thresholds are exceeded.
 * This protects downstream services from being overwhelmed during outages.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests are rejected immediately
 * - HALF_OPEN: Testing if service has recovered, limited requests allowed
 * 
 * Design philosophy:
 * - Fail fast when services are unhealthy
 * - Automatic recovery testing after timeout
 * - Comprehensive statistics for monitoring
 * - Configurable thresholds for different use cases
 */

const STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
};

/**
 * Circuit Breaker Class
 * 
 * Wraps operations with circuit breaker logic to prevent cascading failures.
 * Tracks failures and automatically opens circuit when threshold is exceeded.
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.timeout = options.timeout ?? 60000;
    this.resetTimeout = options.resetTimeout ?? 120000;
    this.monitoringPeriod = options.monitoringPeriod ?? 300000;
    this.maxConcurrent = options.maxConcurrent ?? 10;
    
    this.state = STATES.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.currentConcurrent = 0;
    this.halfOpenSuccesses = 0;
    this.halfOpenThreshold = Math.ceil(this.failureThreshold / 2);
  }

  /**
   * Execute an operation through the circuit breaker
   * 
   * @param {Function} operation - Async operation to execute
   * @returns {Promise<any>} Result of the operation
   * @throws {Error} If circuit is open or operation fails
   */
  async execute(operation) {
    if (this.state === STATES.OPEN) {
      if (this._shouldAttemptReset()) {
        this._transitionTo(STATES.HALF_OPEN);
      } else {
        throw new Error('Circuit breaker is OPEN - request rejected');
      }
    }

    if (this.currentConcurrent >= this.maxConcurrent) {
      throw new Error('Circuit breaker concurrent limit reached');
    }

    this.currentConcurrent++;

    try {
      const result = await this._executeWithTimeout(operation);
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    } finally {
      this.currentConcurrent--;
    }
  }

  /**
   * Execute operation with timeout
   */
  async _executeWithTimeout(operation) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Circuit breaker operation timeout'));
      }, this.timeout);

      Promise.resolve(operation())
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Handle successful operation
   */
  _onSuccess() {
    this.successes++;

    if (this.state === STATES.HALF_OPEN) {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.halfOpenThreshold) {
        this._transitionTo(STATES.CLOSED);
        this.failures = 0;
        this.halfOpenSuccesses = 0;
      }
    } else if (this.state === STATES.CLOSED) {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  /**
   * Handle failed operation
   */
  _onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === STATES.HALF_OPEN) {
      this._transitionTo(STATES.OPEN);
      this.halfOpenSuccesses = 0;
    } else if (this.state === STATES.CLOSED && this.failures >= this.failureThreshold) {
      this._transitionTo(STATES.OPEN);
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  _shouldAttemptReset() {
    return Date.now() - this.lastStateChange >= this.resetTimeout;
  }

  /**
   * Transition to new state
   */
  _transitionTo(newState) {
    const previousState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    console.log(`Circuit breaker state: ${previousState} -> ${newState}`);
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailures() {
    return this.failures;
  }

  /**
   * Get success count
   */
  getSuccesses() {
    return this.successes;
  }

  /**
   * Get last failure time
   */
  getLastFailureTime() {
    return this.lastFailureTime;
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      currentConcurrent: this.currentConcurrent,
      config: {
        failureThreshold: this.failureThreshold,
        timeout: this.timeout,
        resetTimeout: this.resetTimeout,
        maxConcurrent: this.maxConcurrent
      }
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset() {
    this.state = STATES.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this.halfOpenSuccesses = 0;
    console.log('Circuit breaker manually reset');
  }

  /**
   * Force circuit to open state
   */
  trip() {
    this._transitionTo(STATES.OPEN);
  }

  /**
   * Destroy circuit breaker and cleanup
   */
  destroy() {
    this.reset();
  }
}

/**
 * Create a new circuit breaker instance
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.failureThreshold - Number of failures before opening
 * @param {number} options.timeout - Operation timeout in ms
 * @param {number} options.resetTimeout - Time before attempting reset in ms
 * @param {number} options.monitoringPeriod - Monitoring window in ms
 * @param {number} options.maxConcurrent - Maximum concurrent operations
 * @returns {CircuitBreaker} New circuit breaker instance
 */
function createCircuitBreaker(options = {}) {
  return new CircuitBreaker(options);
}

module.exports = {
  CircuitBreaker,
  createCircuitBreaker,
  STATES
};
