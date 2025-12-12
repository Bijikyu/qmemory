/**
 * Simple Circuit Breaker
 * Basic circuit breaker pattern implementation using Node.js built-ins
 * 
 * This provides a simplified circuit breaker that can be replaced
 * with more sophisticated npm circuit-breaker packages if needed.
 */

const STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
};

/**
 * Simple Circuit Breaker Class
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = STATES.CLOSED;
    this.failures = 0;
    this.nextAttempt = Date.now();
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
      if (Date.now() >= this.nextAttempt) {
        this.state = STATES.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  onSuccess() {
    this.failures = 0;
    if (this.state === STATES.HALF_OPEN) {
      this.state = STATES.CLOSED;
    }
  }

  /**
   * Handle failed operation
   */
  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = STATES.OPEN;
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }

  /**
   * Get current state
   * 
   * @returns {string} Current circuit breaker state
   */
  getState() {
    return this.state;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.state = STATES.CLOSED;
    this.failures = 0;
    this.nextAttempt = Date.now();
  }
}

/**
 * Create a new circuit breaker instance
 * 
 * @param {Object} options - Configuration options
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
