/**
 * Circuit Breaker Execution Wrapper
 * Handles operation execution with circuit breaking logic
 */

import { CircuitBreakerState, STATES } from './circuit-breaker-state.js';

export class CircuitBreakerWrapper {
  private stateManager: CircuitBreakerState;
  private currentOperation: Function | null = null;

  constructor(options: any = {}) {
    this.stateManager = new CircuitBreakerState(options);
  }

  /**
   * Set the operation to be executed by this circuit breaker
   * @param operation - Function to execute when circuit is closed
   */
  setOperation(operation: Function): this {
    this.currentOperation = operation;
    return this;
  }

  /**
   * Execute the configured operation with circuit breaking protection
   * @param args - Arguments to pass to the operation
   * @returns Promise that resolves with operation result or rejects when circuit is open
   */
  async execute(...args: any[]): Promise<any> {
    if (!this.currentOperation) {
      throw new Error('No operation set. Use setOperation() method first.');
    }

    // Check if circuit is open
    if (this.stateManager.isOpen()) {
      // Check if we should attempt recovery
      if (this.stateManager.shouldAttemptRecovery()) {
        // Move to half-open state and try operation
        return this.executeWithHalfOpen(args);
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    // Circuit is closed, execute normally
    try {
      const result = await this.currentOperation(...args);
      this.stateManager.recordSuccess();
      return result;
    } catch (error) {
      this.stateManager.recordFailure();
      throw error;
    }
  }

  /**
   * Execute operation in half-open state (testing recovery)
   */
  private async executeWithHalfOpen(args: any[]): Promise<any> {
    try {
      const result = await this.currentOperation(...args);
      this.stateManager.recordSuccess();
      return result;
    } catch (error) {
      this.stateManager.recordFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): string {
    return this.stateManager.getState();
  }

  /**
   * Check if circuit is currently open
   */
  isOpen(): boolean {
    return this.stateManager.isOpen();
  }

  /**
   * Check if circuit is currently closed
   */
  isClosed(): boolean {
    return this.stateManager.isClosed();
  }

  /**
   * Check if circuit is currently half-open
   */
  isHalfOpen(): boolean {
    return this.stateManager.isHalfOpen();
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.stateManager.reset();
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): any {
    return this.stateManager.getStats();
  }
}
