/**
 * Circuit Breaker Factory
 * Factory for managing circuit breaker lifecycle with cleanup and memory management
 * 
 * Circuit breakers create memory leaks when not properly managed.
 * This factory pattern ensures consistent creation, monitoring, and cleanup.
 * Supports auto-scaling of breakers based on load patterns.
 * 
 * Features:
 * - LRU (Least Recently Used) eviction for breaker management
 * - Periodic cleanup of idle breakers
 * - Comprehensive statistics for monitoring
 * - Graceful shutdown handling
 * - Domain-specific breaker configurations
 * 
 * Design philosophy:
 * - Prevent memory leaks from unbounded breaker creation
 * - Centralized management for consistent behavior
 * - Automatic cleanup based on usage patterns
 */

const { createCircuitBreaker } = require('./circuit-breaker');

/**
 * Circuit Breaker Factory with lifecycle management
 * 
 * Manages a pool of circuit breakers with automatic cleanup and memory limits.
 */
class CircuitBreakerFactory {
  constructor(options = {}) {
    this.breakers = new Map();
    this.cleanupInterval = null;
    this.maxBreakers = options.maxBreakers ?? 100;
    this.cleanupIntervalMs = options.cleanupIntervalMs ?? 60000;
    this.breakerTimeoutMs = options.breakerTimeoutMs ?? 300000;
    this.defaultConfig = options.defaultConfig ?? {};
    this.isShutdown = false;
    
    this.startCleanupInterval();
  }

  /**
   * Get or create circuit breaker for domain
   * 
   * Ensures single breaker per domain with consistent configuration.
   * Updates last used time for existing breakers.
   * 
   * @param {string} domain - Domain/service identifier
   * @param {Object} config - Optional breaker configuration
   * @returns {Object} Circuit breaker instance
   */
  getCircuitBreaker(domain, config = {}) {
    if (this.isShutdown) {
      throw new Error('Circuit breaker factory has been shut down');
    }

    let breaker = this.breakers.get(domain);
    
    if (!breaker) {
      breaker = createCircuitBreaker({
        failureThreshold: config.failureThreshold ?? this.defaultConfig.failureThreshold ?? 5,
        timeout: config.timeout ?? this.defaultConfig.timeout ?? 60000,
        resetTimeout: config.resetTimeout ?? this.defaultConfig.resetTimeout ?? 120000,
        monitoringPeriod: config.monitoringPeriod ?? this.defaultConfig.monitoringPeriod ?? 300000,
        maxConcurrent: config.maxConcurrent ?? this.defaultConfig.maxConcurrent ?? 10
      });
      
      breaker._domain = domain;
      breaker._createdTime = Date.now();
      breaker._lastUsedTime = Date.now();
      
      this.breakers.set(domain, breaker);
      
      if (this.breakers.size > this.maxBreakers) {
        this.enforceBreakerLimit();
      }
    } else {
      breaker._lastUsedTime = Date.now();
    }
    
    return breaker;
  }

  /**
   * Enforce maximum breaker limit by removing least recently used
   * 
   * Prevents unbounded memory growth by evicting oldest breakers.
   */
  enforceBreakerLimit() {
    const entries = Array.from(this.breakers.entries());
    
    entries.sort(([, a], [, b]) => {
      const timeA = a._lastUsedTime || 0;
      const timeB = b._lastUsedTime || 0;
      return timeA - timeB;
    });
    
    const toRemove = entries.slice(0, entries.length - this.maxBreakers);
    toRemove.forEach(([domain]) => {
      this.removeCircuitBreaker(domain);
    });
  }

  /**
   * Remove specific circuit breaker
   * 
   * Cleanup for domains no longer in use.
   * 
   * @param {string} domain - Domain to remove
   * @returns {boolean} True if breaker was removed
   */
  removeCircuitBreaker(domain) {
    const breaker = this.breakers.get(domain);
    if (breaker) {
      try {
        if (typeof breaker.destroy === 'function') {
          breaker.destroy();
        }
      } catch (error) {
        console.warn(`Error destroying circuit breaker for ${domain}:`, error);
      }
      
      this.breakers.delete(domain);
      return true;
    }
    return false;
  }

  /**
   * Start periodic cleanup interval
   * 
   * Automatically removes unused breakers to prevent memory leaks.
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.cleanupIntervalMs);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Perform cleanup of old and unused circuit breakers
   * 
   * Removes breakers that haven't been used recently.
   */
  performCleanup() {
    const now = Date.now();
    const toRemove = [];
    
    this.breakers.forEach((breaker, domain) => {
      const lastUsed = breaker._lastUsedTime || 0;
      const created = breaker._createdTime || 0;
      
      if (now - lastUsed > this.breakerTimeoutMs) {
        toRemove.push(domain);
      } else if (now - created > this.breakerTimeoutMs * 2) {
        toRemove.push(domain);
      }
    });
    
    toRemove.forEach(domain => {
      this.removeCircuitBreaker(domain);
    });
    
    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} idle circuit breakers`);
    }
  }

  /**
   * Get statistics for all circuit breakers
   * 
   * Provides monitoring data for performance tuning.
   * 
   * @returns {Array} Array of breaker statistics
   */
  getStats() {
    const stats = [];
    
    this.breakers.forEach((breaker, domain) => {
      const breakerStats = this.getBreakerState(breaker);
      stats.push({
        domain,
        failures: breakerStats.failures || 0,
        successes: breakerStats.successes || 0,
        state: breakerStats.state || 'closed',
        lastFailureTime: breakerStats.lastFailureTime,
        createdTime: breaker._createdTime || 0,
        lastUsedTime: breaker._lastUsedTime || 0
      });
    });
    
    return stats.sort((a, b) => b.lastUsedTime - a.lastUsedTime);
  }

  /**
   * Extract state information from breaker
   * 
   * Normalizes breaker state for monitoring.
   */
  getBreakerState(breaker) {
    try {
      return {
        state: breaker.getState?.() || 'closed',
        failures: breaker.getFailures?.() || 0,
        successes: breaker.getSuccesses?.() || 0,
        lastFailureTime: breaker.getLastFailureTime?.()
      };
    } catch {
      return { state: 'closed' };
    }
  }

  /**
   * Get factory-level statistics
   * 
   * Provides overview of circuit breaker pool health.
   * 
   * @returns {Object} Factory statistics
   */
  getFactoryStats() {
    return {
      totalBreakers: this.breakers.size,
      maxBreakers: this.maxBreakers,
      cleanupIntervalMs: this.cleanupIntervalMs,
      breakerTimeoutMs: this.breakerTimeoutMs,
      isShutdown: this.isShutdown
    };
  }

  /**
   * Force cleanup of all circuit breakers
   * 
   * Manual cleanup for testing or emergency situations.
   */
  clearAllBreakers() {
    console.log(`Clearing all ${this.breakers.size} circuit breakers`);
    
    const domains = Array.from(this.breakers.keys());
    domains.forEach(domain => {
      this.removeCircuitBreaker(domain);
    });
    
    this.breakers.clear();
  }

  /**
   * Graceful shutdown
   * 
   * Ensures clean termination of all resources.
   */
  shutdown() {
    if (this.isShutdown) return;
    
    console.log('Shutting down circuit breaker factory...');
    this.isShutdown = true;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clearAllBreakers();
    console.log('Circuit breaker factory shutdown complete');
  }
}

let globalFactory = null;

/**
 * Get or create the global circuit breaker factory
 * 
 * @param {Object} options - Factory configuration options
 * @returns {CircuitBreakerFactory} Factory instance
 */
function getCircuitBreakerFactory(options = {}) {
  if (!globalFactory || globalFactory.isShutdown) {
    globalFactory = new CircuitBreakerFactory(options);
  }
  return globalFactory;
}

/**
 * Get circuit breaker for domain with factory management
 * 
 * Provides managed circuit breaker with automatic lifecycle.
 * 
 * @param {string} domain - Domain/service identifier
 * @param {Object} config - Optional breaker configuration
 * @returns {Object} Managed circuit breaker
 */
function getManagedCircuitBreaker(domain, config = {}) {
  return getCircuitBreakerFactory().getCircuitBreaker(domain, config);
}

/**
 * Get circuit breaker factory statistics
 * 
 * @returns {Array} Array of breaker statistics
 */
function getCircuitBreakerStats() {
  return getCircuitBreakerFactory().getStats();
}

/**
 * Get factory statistics
 * 
 * @returns {Object} Factory-level statistics
 */
function getCircuitBreakerFactoryStats() {
  return getCircuitBreakerFactory().getFactoryStats();
}

/**
 * Clear all circuit breakers
 * 
 * Manual cleanup for testing or emergency situations.
 */
function clearAllCircuitBreakers() {
  getCircuitBreakerFactory().clearAllBreakers();
}

/**
 * Shutdown the global factory
 * 
 * Should be called during application shutdown.
 */
function shutdownCircuitBreakerFactory() {
  if (globalFactory) {
    globalFactory.shutdown();
    globalFactory = null;
  }
}

module.exports = {
  CircuitBreakerFactory,
  getCircuitBreakerFactory,
  getManagedCircuitBreaker,
  getCircuitBreakerStats,
  getCircuitBreakerFactoryStats,
  clearAllCircuitBreakers,
  shutdownCircuitBreakerFactory
};
