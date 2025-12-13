const CircuitBreaker = require('opossum');

const STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };

class CircuitBreakerWrapper {
  constructor(options = {}) {
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

    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    
    this.opossumBreaker = new CircuitBreaker(async (...args) => {
      if (!this.currentOperation) throw new Error('No operation set. Use execute() method.');
      return await this.currentOperation(...args);
    }, opossumOptions);
    
    this.currentOperation = null;

    this.opossumBreaker.on('open', () => { this.state = STATES.OPEN; });
    this.opossumBreaker.on('halfOpen', () => { this.state = STATES.HALF_OPEN; });
    this.opossumBreaker.on('close', () => { this.state = STATES.CLOSED; });

    this.state = STATES.CLOSED;
  }

  async execute(operation, ...args) {
    this.currentOperation = operation;
    
    try {
      return await this.opossumBreaker.fire(...args);
    } catch (error) {
      if (this.opossumBreaker.opened) throw new Error('Circuit breaker is OPEN');
      throw error;
    } finally {
      this.currentOperation = null;
    }
  }

  getState() {
    if (this.opossumBreaker.opened) return STATES.OPEN;
    if (this.opossumBreaker.halfOpen) return STATES.HALF_OPEN;
    return STATES.CLOSED;
  }

  reset() {
    this.opossumBreaker.close();
    this.state = STATES.CLOSED;
  }

  getStats() { return this.opossumBreaker.stats; }

  isClosed() { return this.opossumBreaker.isClosed(); }

  isOpen() { return this.opossumBreaker.opened; }

  getOpossumBreaker() { return this.opossumBreaker; }
}

const createCircuitBreaker = (options = {}) => new CircuitBreakerWrapper(options);

module.exports = { CircuitBreaker: CircuitBreakerWrapper, createCircuitBreaker, STATES };