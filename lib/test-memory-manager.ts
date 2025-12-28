/**
 * Test Memory Manager
 * Advanced memory management utilities for test environments
 *
 * Combines memory monitoring, cleanup, and tracking capabilities specifically
 * optimized for testing environments. Solves the critical problem of memory leaks
 * in test suites that can cause flaky tests, CI failures, and unreliable results.
 *
 * Features:
 * - Memory checkpoint tracking with before/after comparison
 * - Automatic leak detection with configurable thresholds
 * - Garbage collection forcing (when available)
 * - Global reference cleanup for test isolation
 * - Comprehensive leak analysis and recommendations
 *
 * Use cases:
 * - Large test suites with memory concerns
 * - Integration tests with database connections
 * - CI/CD pipelines needing reliable memory behavior
 * - Debugging memory leaks in test environments
 */
import { performance } from 'perf_hooks';
import qerrors from 'qerrors';
/**
 * Test Memory Manager Class
 *
 * Provides comprehensive memory monitoring and leak detection for tests.
 */
class TestMemoryManager {
  private checkpoints: any[] = [];
  private isActive: boolean = false;
  public gcAvailable: boolean = typeof global.gc === 'function';
  private leakThresholds: {
    heap: number;
    rss: number;
    external: number;
    growthRate: number;
  };
  private maxCheckpoints: number;

  constructor(options: any = {}) {
    this.leakThresholds = {
      heap: options.heapThreshold ?? 50,
      rss: options.rssThreshold ?? 100,
      external: options.externalThreshold ?? 25,
      growthRate: options.growthRateThreshold ?? 5,
    };
    this.maxCheckpoints = options.maxCheckpoints ?? 20;
  }
  /**
   * Start memory monitoring session
   *
   * @param {string} context - Optional context description
   */
  startMonitoring(context) {
    try {
      if (this.isActive) {
        console.warn('Memory monitoring already active');
        return;
      }
      this.isActive = true;
      this.checkpoints = [];
      this.takeCheckpoint('baseline', context);
      console.log(`Memory monitoring started ${context ? `for ${context}` : ''}`);
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.startMonitoring', {
        context,
        wasActive: this.isActive,
        checkpointCount: this.checkpoints.length,
      });
      throw error;
    }
  }
  /**
   * Stop memory monitoring and generate report
   *
   * @returns {MemoryLeakReport} Memory leak report
   */
  stopMonitoring() {
    try {
      if (!this.isActive) {
        console.warn('Memory monitoring not active');
        return this.generateEmptyReport();
      }
      this.takeCheckpoint('final', 'Final checkpoint');
      this.isActive = false;
      const report = this.analyzeMemoryLeaks();
      console.log('Memory monitoring stopped');
      this.printReport(report);
      return report;
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.stopMonitoring', {
        wasActive: this.isActive,
        checkpointCount: this.checkpoints.length,
      });
      this.isActive = false;
      throw error;
    }
  }
  /**
   * Take memory checkpoint
   *
   * @param {string} id - Checkpoint identifier
   * @param {string} context - Optional context description
   * @returns {MemoryCheckpoint} Memory checkpoint
   */
  takeCheckpoint(id, context) {
    try {
      if (!this.isActive && id !== 'current') {
        throw new Error('Memory monitoring not active');
      }
      const usage = process.memoryUsage();
      const checkpoint = {
        id,
        timestamp: performance.now(),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
        arrayBuffers: usage.arrayBuffers ? Math.round(usage.arrayBuffers / 1024 / 1024) : undefined,
        context,
      };
      if (id !== 'current') {
        this.checkpoints.push(checkpoint);
        if (this.checkpoints.length > this.maxCheckpoints) {
          this.checkpoints.shift();
        }
      }
      return checkpoint;
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.takeCheckpoint', {
        id,
        context,
        isActive: this.isActive,
        checkpointCount: this.checkpoints.length,
        maxCheckpoints: this.maxCheckpoints,
      });
      throw error;
    }
  }
  /**
   * Force garbage collection if available
   *
   * @returns {boolean} True if GC was run
   */
  forceGarbageCollection() {
    try {
      if (!this.gcAvailable) {
        console.warn('Garbage collection not available. Run node with --expose-gc flag.');
        return false;
      }
      for (let i = 0; i < 3; i++) {
        global.gc();
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Small delay for GC to complete
        }
      }
      return true;
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.forceGarbageCollection', {
        gcAvailable: this.gcAvailable,
        iterationCount: 3,
      });
      console.error('Failed to force garbage collection:', error);
      return false;
    }
  }
  /**
   * Get current memory usage
   *
   * @returns {MemoryCheckpoint} Current memory checkpoint
   */
  getCurrentUsage() {
    const usage = process.memoryUsage();
    return {
      id: 'current',
      timestamp: performance.now(),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      arrayBuffers: usage.arrayBuffers ? Math.round(usage.arrayBuffers / 1024 / 1024) : undefined,
    };
  }
  /**
   * Cleanup memory aggressively
   *
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      console.log('Starting aggressive memory cleanup...');
      this.clearGlobalReferences();
      this.forceGarbageCollection();
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.isActive) {
        this.takeCheckpoint('cleanup', 'Post-cleanup checkpoint');
      }
      console.log('Memory cleanup completed');
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.cleanup', {
        isActive: this.isActive,
        gcAvailable: this.gcAvailable,
      });
      console.error('Memory cleanup failed:', error);
      throw error;
    }
  }
  /**
   * Analyze memory leaks from checkpoints
   *
   * @returns {MemoryLeakReport} Memory leak report
   */
  analyzeMemoryLeaks() {
    if (this.checkpoints.length < 2) {
      return this.generateEmptyReport();
    }
    const baseline = this.checkpoints[0];
    const final = this.checkpoints[this.checkpoints.length - 1];
    const recent = this.checkpoints.slice(-3);
    const heapGrowth = final.heapUsed - baseline.heapUsed;
    const rssGrowth = final.rss - baseline.rss;
    const externalGrowth = final.external - baseline.external;
    const duration = (final.timestamp - baseline.timestamp) / 1000 / 60;
    const averageGrowthRate = duration > 0 ? (heapGrowth + rssGrowth) / 2 / duration : 0;
    const suspiciousPatterns = [];
    if (heapGrowth > this.leakThresholds.heap) {
      suspiciousPatterns.push('Heap memory exceeds threshold');
    }
    if (rssGrowth > this.leakThresholds.rss) {
      suspiciousPatterns.push('RSS memory exceeds threshold');
    }
    if (externalGrowth > this.leakThresholds.external) {
      suspiciousPatterns.push('External memory exceeds threshold');
    }
    if (averageGrowthRate > this.leakThresholds.growthRate) {
      suspiciousPatterns.push('High memory growth rate detected');
    }
    if (this.isMonotonicGrowth(recent)) {
      suspiciousPatterns.push('Monotonic memory growth pattern');
    }
    const analysis = {
      heapGrowth,
      rssGrowth,
      externalGrowth,
      averageGrowthRate,
      suspiciousPatterns,
    };
    const detected = suspiciousPatterns.length > 0;
    return {
      detected,
      checkpoints: this.checkpoints,
      analysis,
      recommendations: this.generateRecommendations(detected, suspiciousPatterns, analysis),
    };
  }
  /**
   * Check for monotonic growth pattern
   */
  isMonotonicGrowth(checkpoints) {
    if (checkpoints.length < 3) return false;
    for (let i = 1; i < checkpoints.length; i++) {
      if (
        checkpoints[i].heapUsed < checkpoints[i - 1].heapUsed ||
        checkpoints[i].rss < checkpoints[i - 1].rss
      ) {
        return false;
      }
    }
    return true;
  }
  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(detected, patterns, analysis) {
    const recommendations = [];
    if (!detected) {
      recommendations.push('No memory leaks detected');
      return recommendations;
    }
    if (analysis.heapGrowth > this.leakThresholds.heap) {
      recommendations.push('Consider increasing heap memory limits');
      recommendations.push('Check for large object allocations');
    }
    if (analysis.averageGrowthRate > this.leakThresholds.growthRate) {
      recommendations.push('Implement more frequent garbage collection');
      recommendations.push('Review object lifecycle management');
    }
    if (patterns.includes('Monotonic memory growth pattern')) {
      recommendations.push('Investigate event listeners and timers');
      recommendations.push('Check for circular references');
      recommendations.push('Review cache management');
    }
    recommendations.push('Run with --inspect to identify memory hotspots');
    recommendations.push('Consider using heap snapshot analysis');
    return recommendations;
  }
  /**
   * Clear common global references that might hold memory
   */
  clearGlobalReferences() {
    try {
      const refsToClear = [
        'testServer',
        'mongoConnection',
        '__MONGO_DB__',
        '__MONGOD__',
        'app',
        'server',
        'io',
        'redisClient',
        'cache',
        'timers',
      ];
      refsToClear.forEach(ref => {
        if (global[ref]) {
          try {
            const globalRef = global[ref];
            if (globalRef && typeof globalRef.close === 'function') {
              globalRef.close();
            }
            if (globalRef && typeof globalRef.disconnect === 'function') {
              globalRef.disconnect();
            }
            if (globalRef && typeof globalRef.clear === 'function') {
              globalRef.clear();
            }
          } catch (error) {
            qerrors.qerrors(
              error as Error,
              'test-memory-manager.clearGlobalReferences.refCleanup',
              {
                ref,
                hasClose: typeof global[ref].close === 'function',
                hasDisconnect: typeof global[ref].disconnect === 'function',
                hasClear: typeof global[ref].clear === 'function',
              }
            );
            console.warn(`Failed to clear ${ref}:`, error);
          }
          global[ref] = null;
          delete global[ref];
        }
      });
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.clearGlobalReferences', {
        operation: 'global-reference-cleanup',
      });
      console.error('Failed to clear global references:', error);
      throw error;
    }
  }
  /**
   * Print memory report to console
   */
  printReport(report) {
    console.log('\nMemory Leak Analysis Report:');
    console.log('=====================================');
    if (report.detected) {
      console.log('MEMORY LEAKS DETECTED');
    } else {
      console.log('No significant memory leaks detected');
    }
    console.log('\nGrowth Analysis:');
    console.log(
      `   Heap Growth: ${report.analysis.heapGrowth > 0 ? '+' : ''}${report.analysis.heapGrowth}MB`
    );
    console.log(
      `   RSS Growth: ${report.analysis.rssGrowth > 0 ? '+' : ''}${report.analysis.rssGrowth}MB`
    );
    console.log(
      `   External Growth: ${report.analysis.externalGrowth > 0 ? '+' : ''}${report.analysis.externalGrowth}MB`
    );
    console.log(`   Growth Rate: ${report.analysis.averageGrowthRate.toFixed(2)}MB/min`);
    if (report.analysis.suspiciousPatterns.length > 0) {
      console.log('\nSuspicious Patterns:');
      report.analysis.suspiciousPatterns.forEach(pattern => {
        console.log(`   - ${pattern}`);
      });
    }
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }
    console.log('=====================================\n');
  }
  /**
   * Generate empty report
   */
  generateEmptyReport() {
    return {
      detected: false,
      checkpoints: [],
      analysis: {
        heapGrowth: 0,
        rssGrowth: 0,
        externalGrowth: 0,
        averageGrowthRate: 0,
        suspiciousPatterns: [],
      },
      recommendations: ['Insufficient data for analysis'],
    };
  }
  /**
   * Get memory manager statistics
   */
  getStats() {
    return {
      isActive: this.isActive,
      checkpointsCount: this.checkpoints.length,
      gcAvailable: this.gcAvailable,
      currentUsage: this.getCurrentUsage(),
      thresholds: this.leakThresholds,
    };
  }
  /**
   * Reset memory manager
   */
  reset() {
    this.isActive = false;
    this.checkpoints = [];
    console.log('Memory manager reset');
  }
}
/**
 * Create a new memory manager instance
 *
 * @param {TestMemoryManagerOptions} options - Configuration options
 * @returns {TestMemoryManager} New instance
 */
function createMemoryManager(options = {}) {
  return new TestMemoryManager(options);
}
/**
 * Create and start a leak detection session
 *
 * @param {string} context - Optional context description
 * @returns {TestMemoryManager} Active memory manager
 */
function createLeakDetectionSession(context) {
  const manager = new TestMemoryManager();
  manager.startMonitoring(context);
  return manager;
}
/**
 * Quick memory check with GC
 *
 * @returns {MemoryCheckResult} Before/after memory comparison
 */
function quickMemoryCheck() {
  const manager = new TestMemoryManager();
  const before = manager.getCurrentUsage();
  manager.forceGarbageCollection();
  const after = manager.getCurrentUsage();
  return {
    before,
    after,
    freed: {
      heap: before.heapUsed - after.heapUsed,
      rss: before.rss - after.rss,
      external: before.external - after.external,
    },
    gcRan: manager.gcAvailable,
  };
}
/**
 * Run a function with memory tracking
 *
 * @param {Function} fn - Async function to run
 * @param {string} context - Context description
 * @returns {Promise<MemoryTrackingResult>} Result with memory report
 */
async function withMemoryTracking(fn, context) {
  const manager = createLeakDetectionSession(context);
  try {
    const result = await fn();
    const report = manager.stopMonitoring();
    return {
      result,
      memoryReport: report,
    };
  } catch (error) {
    try {
      manager.stopMonitoring();
    } catch (stopError) {
      qerrors.qerrors(stopError as Error, 'test-memory-manager.withMemoryTracking.stopMonitoring', {
        context,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
    qerrors.qerrors(error as Error, 'test-memory-manager.withMemoryTracking', {
      context,
      functionName: fn.name || 'anonymous',
    });
    throw error;
  }
}
/**
 * Jest/test framework beforeAll helper
 *
 * @param {string} context - Test suite context
 * @returns {TestMemoryManager} Memory manager for the test suite
 */
function setupTestMemoryMonitoring(context) {
  const manager = new TestMemoryManager();
  manager.startMonitoring(context);
  return manager;
}
/**
 * Jest/test framework afterAll helper
 *
 * @param {TestMemoryManager} manager - Memory manager to finalize
 * @returns {MemoryLeakReport} Memory leak report
 */
function teardownTestMemoryMonitoring(manager) {
  if (!manager) return null;
  return manager.stopMonitoring();
}
export {
  TestMemoryManager,
  createMemoryManager,
  createLeakDetectionSession,
  quickMemoryCheck,
  withMemoryTracking,
  setupTestMemoryMonitoring,
  teardownTestMemoryMonitoring,
};
