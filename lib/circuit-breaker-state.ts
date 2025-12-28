/**
 * Circuit Breaker State Manager
 * Handles circuit breaker state transitions and monitoring
 */

export const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
} as const;

export type CircuitState = (typeof STATES)[keyof typeof STATES];

export class CircuitBreakerState {
  private currentState: CircuitState;
  private failureCount: number;
  private lastFailureTime: number | null;
  private successCount: number;
  private operationCount: number;

  // Configuration
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly errorThresholdPercentage: number;

  constructor(options: any = {}) {
    this.currentState = STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.operationCount = 0;

    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.errorThresholdPercentage = options.errorThresholdPercentage || 50;
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitState {
    return this.currentState;
  }

  /**
   * Check if circuit is currently open
   */
  isOpen(): boolean {
    return this.currentState === STATES.OPEN;
  }

  /**
   * Check if circuit is currently closed (allowing operations)
   */
  isClosed(): boolean {
    return this.currentState === STATES.CLOSED;
  }

  /**
   * Check if circuit is half-open (testing recovery)
   */
  isHalfOpen(): boolean {
    return this.currentState === STATES.HALF_OPEN;
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.successCount++;
    this.operationCount++;

    if (this.currentState === STATES.HALF_OPEN) {
      // Recovery successful, close the circuit
      this.currentState = STATES.CLOSED;
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failureCount++;
    this.operationCount++;
    this.lastFailureTime = Date.now();

    if (this.currentState === STATES.CLOSED) {
      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.currentState = STATES.OPEN;
      }
    } else if (this.currentState === STATES.HALF_OPEN) {
      // Failed during recovery, open again
      this.currentState = STATES.OPEN;
    }
  }

  /**
   * Check if circuit should open based on failure thresholds
   */
  private shouldOpenCircuit(): boolean {
    if (this.failureCount >= this.failureThreshold) {
      return true;
    }

    if (this.operationCount >= 5) {
      // Minimum operations for percentage calculation
      const errorPercentage = (this.failureCount / this.operationCount) * 100;
      return errorPercentage >= this.errorThresholdPercentage;
    }

    return false;
  }

  /**
   * Check if circuit should attempt recovery (half-open)
   */
  shouldAttemptRecovery(): boolean {
    if (this.currentState !== STATES.OPEN) {
      return true;
    }

    return this.lastFailureTime !== null && Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  /**
   * Manually reset circuit to closed state
   */
  reset(): void {
    this.currentState = STATES.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.operationCount = 0;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): any {
    return {
      state: this.currentState,
      failureCount: this.failureCount,
      successCount: this.successCount,
      operationCount: this.operationCount,
      errorRate: this.operationCount > 0 ? (this.failureCount / this.operationCount) * 100 : 0,
      lastFailureTime: this.lastFailureTime,
      isRecoveryReady: this.shouldAttemptRecovery(),
    };
  }
}
