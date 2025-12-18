import CircuitBreakerBase from 'opossum';

export const STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' } as const;

export type CircuitBreakerState = typeof STATES[keyof typeof STATES];

export interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  minimumNumberOfCalls?: number;
  volumeThreshold?: number;
  statusMinRequestThreshold?: number;
  cacheEnabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  failureThreshold?: number;
}

export interface CircuitBreakerStats {
  fires: number;
  rejects: number;
  timeouts: number;
  successes: number;
  failures: number;
  cascades: number;
  cacheHits: number;
  cacheMisses: number;
  isCached: boolean;
  latencyMean: number;
  latencyStdDev: number;
  hystrixStats?: any;
}

export class CircuitBreakerWrapper {
  private opossumBreaker: any;
  private currentOperation: Function | null = null;
  public state: CircuitBreakerState;
  public failureThreshold: number;
  public resetTimeout: number;

  constructor(options: CircuitBreakerOptions = {}) {
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
    
    this.opossumBreaker = new CircuitBreakerBase(async (...args: any[]) => {
      if (!this.currentOperation) throw new Error('No operation set. Use execute() method.');
      return await this.currentOperation(...args);
    }, opossumOptions);
    
    this.currentOperation = null;

    this.opossumBreaker.on('open', () => { this.state = STATES.OPEN; });
    this.opossumBreaker.on('halfOpen', () => { this.state = STATES.HALF_OPEN; });
    this.opossumBreaker.on('close', () => { this.state = STATES.CLOSED; });

    this.state = STATES.CLOSED;
  }

  async execute<T = any>(operation: Function, ...args: any[]): Promise<T> {
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

  getState(): CircuitBreakerState {
    if (this.opossumBreaker.opened) return STATES.OPEN;
    if (this.opossumBreaker.halfOpen) return STATES.HALF_OPEN;
    return STATES.CLOSED;
  }

  reset(): void {
    this.opossumBreaker.close();
    this.state = STATES.CLOSED;
  }

  getStats(): CircuitBreakerStats {
    return this.opossumBreaker.stats;
  }

  isClosed(): boolean {
    return this.opossumBreaker.isClosed();
  }

  isOpen(): boolean {
    return this.opossumBreaker.opened;
  }

  getOpossumBreaker(): any {
    return this.opossumBreaker;
  }
}

export const createCircuitBreaker = (options: CircuitBreakerOptions = {}): CircuitBreakerWrapper => 
  new CircuitBreakerWrapper(options);

export type CircuitBreakerType = CircuitBreakerWrapper;