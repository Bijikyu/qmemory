import CircuitBreakerBase from 'opossum';
import qerrors from 'qerrors';

export const STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' };

export class CircuitBreakerWrapper {
  private resetTimeout: number;
  private opossumBreaker: CircuitBreakerBase;

  constructor(options: any = {}) {
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
      retryDelay: options.retryDelay || 100,
    };
    this.resetTimeout = options.resetTimeout || 60000;

    try {
      this.opossumBreaker = new CircuitBreakerBase(async () => {
        throw new Error(
          'Circuit breaker used incorrectly. Use execute() method instead of direct fire().'
        );
      }, opossumOptions);
    } catch (error) {
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

  async execute(operation: (...args: any[]) => Promise<any>, ...args: any[]): Promise<any> {
    if (!operation) {
      throw new Error('Operation is required');
    }

    // Create a dedicated circuit breaker instance for this operation to avoid race conditions
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
      return await operationBreaker.fire(...args);
    } catch (error) {
      qerrors.qerrors(error as Error, 'circuit-breaker.execute', {
        operationName: operation.name || 'anonymous',
        isOpen: operationBreaker.opened,
        isHalfOpen: operationBreaker.halfOpen,
        argCount: args.length,
      });
      if (operationBreaker.opened) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Re-throw the original error if circuit breaker is not open
      throw error;
    }
  }

  getState(): string {
    if (this.opossumBreaker.opened) return STATES.OPEN;
    if (this.opossumBreaker.halfOpen) return STATES.HALF_OPEN;
    return STATES.CLOSED;
  }

  reset(): void {
    this.opossumBreaker.close();
  }

  getStats(): any {
    return this.opossumBreaker.stats;
  }

  isClosed(): boolean {
    return this.opossumBreaker.closed;
  }

  isOpen(): boolean {
    return this.opossumBreaker.opened;
  }

  getOpossumBreaker(): CircuitBreakerBase {
    return this.opossumBreaker;
  }
}

export const createCircuitBreaker = (options = {}) => new CircuitBreakerWrapper(options);
