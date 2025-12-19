import CircuitBreakerBase from 'opossum';
import { EventEmitter } from 'node:events';

// Typed circuit breaker event contract mirrors the opossum emitter semantics
export type CircuitBreakerEventMap = {
  open: [];
  close: [];
  halfOpen: [number];
  fire: [unknown[]];
  cacheHit: [];
  cacheMiss: [];
  coalesceCacheHit: [];
  coalesceCacheMiss: [];
  reject: [Error];
  timeout: [Error, number, unknown[]];
  success: [unknown, number];
  failure: [Error, number, unknown[]];
  fallback: [unknown, Error];
  semaphoreLocked: [Error, number];
  healthCheckFailed: [Error];
  shutdown: [];
};

export type CircuitBreakerEventName = keyof CircuitBreakerEventMap;
export type CircuitBreakerEventListener<K extends CircuitBreakerEventName> = (
  ...args: CircuitBreakerEventMap[K]
) => void;

interface OpossumBreaker extends EventEmitter<CircuitBreakerEventMap> {
  fire<T = unknown>(...args: unknown[]): Promise<T>;
  close(): void;
  open(): void;
  shutdown(): void;
  destroy(): void;
  stats: CircuitBreakerStats & { lastFailureTime?: number };
  opened: boolean;
  halfOpen: boolean;
  isClosed(): boolean;
}

export const STATES = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half-open' } as const;

export type CircuitBreakerState = (typeof STATES)[keyof typeof STATES];

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
  lastFailureTime?: number;
}

export class CircuitBreakerWrapper {
  private readonly opossumBreaker: OpossumBreaker;
  private currentOperation: ((...args: unknown[]) => unknown | Promise<unknown>) | null = null;
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
      retryDelay: options.retryDelay || 100,
    };

    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;

    this.opossumBreaker = new CircuitBreakerBase(async (...args: unknown[]) => {
      if (!this.currentOperation) {
        throw new Error('No operation set. Use execute() method.');
      }
      return await this.currentOperation(...args);
    }, opossumOptions) as unknown as OpossumBreaker;

    this.currentOperation = null;

    this.opossumBreaker.on('open', () => {
      this.state = STATES.OPEN;
    });
    this.opossumBreaker.on('halfOpen', () => {
      this.state = STATES.HALF_OPEN;
    });

    this.state = STATES.CLOSED;
  }
  // @ts-ignore

  /**
   * Executes the provided operation through the opossum breaker with typed context.
   *
   * @param operation - Business operation to guard with the breaker
   * @param args - Arguments forwarded to the guarded operation
   * @returns Promise resolving with the operation result
   */
  async execute<T = unknown>(
    operation: (...operationArgs: unknown[]) => Promise<T> | T,
    ...args: unknown[]
  ): Promise<T> {
    this.currentOperation = operation;

    try {
      return await this.opossumBreaker.fire<T>(...args);
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

  /**
   * Registers a typed listener for circuit breaker lifecycle events.
   *
   * @param eventName - Lifecycle event to observe
   * @param listener - Handler invoked with the event payload
   * @returns CircuitBreakerWrapper for chaining
   */
  on<K extends CircuitBreakerEventName>(
    eventName: K,
    listener: CircuitBreakerEventListener<K>
  ): this {
    this.opossumBreaker.on(eventName, listener as any);
    return this;
  }

  /**
   * Registers a one-time typed listener for circuit breaker events.
   *
   * @param eventName - Lifecycle event to observe once
   * @param listener - Handler invoked with the event payload
   * @returns CircuitBreakerWrapper for chaining
   */
  once<K extends CircuitBreakerEventName>(
    eventName: K,
    listener: CircuitBreakerEventListener<K>
  ): this {
    this.opossumBreaker.once(eventName, listener as any);
    return this;
  }

  /**
   * Removes a previously registered typed listener.
   *
   * @param eventName - Lifecycle event where listener was registered
   * @param listener - Handler previously registered with on/once
   * @returns CircuitBreakerWrapper for chaining
   */
  off<K extends CircuitBreakerEventName>(
    eventName: K,
    listener: CircuitBreakerEventListener<K>
  ): this {
    if (typeof this.opossumBreaker.off === 'function') {
      this.opossumBreaker.off(eventName, listener as any);
    } else {
      this.opossumBreaker.removeListener(eventName, listener as any);
    }
    return this;
  }

  /**
   * Provides access to the underlying opossum breaker for advanced scenarios.
   *
   * @returns Underlying opossum breaker instance
   */
  getOpossumBreaker(): OpossumBreaker {
    return this.opossumBreaker;
  }
}

export const createCircuitBreaker = (options: CircuitBreakerOptions = {}): CircuitBreakerWrapper =>
  new CircuitBreakerWrapper(options);

export type CircuitBreakerType = CircuitBreakerWrapper;
