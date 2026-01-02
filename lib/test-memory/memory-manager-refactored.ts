/**
 * Refactored Test Memory Manager
 * Memory management with separated concerns and improved testability
 */

import qerrors from 'qerrors';
import type {
  MemoryCheckpoint,
  LeakAnalysis,
  MemoryManagerOptions,
} from './memory-tracker-types.js';
import { MemoryTracker } from './memory-tracker.js';
import { MemoryLeakAnalyzer } from './memory-leak-analyzer.js';
import { MemoryReporter } from './memory-reporter.js';

/**
 * Refactored test memory manager with separated concerns
 * Coordinates tracker, analyzer, and reporter components
 */
export class TestMemoryManager {
  private tracker: MemoryTracker;
  private analyzer: MemoryLeakAnalyzer;
  private reporter: MemoryReporter;
  private isActive: boolean = false;

  constructor(options: MemoryManagerOptions = {}) {
    this.tracker = new MemoryTracker(options);
    this.analyzer = new MemoryLeakAnalyzer(options);
    this.reporter = new MemoryReporter(options);
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(context?: any): void {
    try {
      if (this.isActive) {
        return;
      }

      this.isActive = true;
      this.tracker.startTracking(context);
      this.analyzer.startAnalysis();

      qerrors.qerrors(
        new Error('Memory monitoring started'),
        'test-memory-manager.startMonitoring',
        {
          context,
          components: {
            tracker: this.tracker,
            analyzer: this.analyzer,
            reporter: this.reporter,
          },
        }
      );
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.startMonitoring', {
        context,
        error: error.message,
      });
    }
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    try {
      if (!this.isActive) {
        return;
      }

      this.isActive = false;
      this.analyzer.stopAnalysis();
      this.tracker.stopTracking();

      qerrors.qerrors(
        new Error('Memory monitoring stopped'),
        'test-memory-manager.stopMonitoring',
        {
          components: {
            tracker: this.tracker,
            analyzer: this.analyzer,
            reporter: this.reporter,
          },
        }
      );
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.stopMonitoring', {
        error: error.message,
      });
    }
  }

  /**
   * Take a memory checkpoint
   */
  takeCheckpoint(context?: any): MemoryCheckpoint {
    return this.tracker.takeCheckpoint(context);
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): MemoryCheckpoint[] {
    return this.tracker.getCheckpoints();
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.tracker.clearCheckpoints();
  }

  /**
   * Check if garbage collection is available
   */
  isGarbageCollectionAvailable(): boolean {
    return this.tracker.isGarbageCollectionAvailable();
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection(): boolean {
    return this.tracker.forceGarbageCollection();
  }

  /**
   * Perform comprehensive leak analysis
   */
  performLeakAnalysis(): LeakAnalysis {
    const checkpoints = this.tracker.getCheckpoints();
    return this.analyzer.analyzeCheckpoints(checkpoints);
  }

  /**
   * Get comprehensive memory report
   */
  generateReport(): any {
    const checkpoints = this.tracker.getCheckpoints();
    const leakAnalysis = this.analyzer.analyzeCheckpoints(checkpoints);
    return this.reporter.generateReport(checkpoints, leakAnalysis);
  }

  /**
   * Force garbage collection with enhanced cleanup
   */
  cleanupGlobalReferences(): void {
    this.tracker.cleanupGlobalReferences();
  }

  /**
   * Perform aggressive memory cleanup
   */
  startAggressiveCleanup(): void {
    qerrors.qerrors(
      new Error('Starting aggressive memory cleanup'),
      'test-memory-manager.startAggressiveCleanup',
      {
        action: 'aggressive-cleanup',
      }
    );

    // Force garbage collection
    if (this.forceGarbageCollection()) {
      qerrors.qerrors(
        new Error('Forced garbage collection completed'),
        'test-memory-manager.startAggressiveCleanup',
        {
          action: 'garbage-collection-forced',
        }
      );
    }

    // Clear all checkpoints to free memory
    this.clearCheckpoints();

    qerrors.qerrors(
      new Error('Aggressive memory cleanup completed'),
      'test-memory-manager.startAggressiveCleanup',
      {
        action: 'aggressive-cleanup-completed',
      }
    );
  }

  /**
   * Detect global reference leaks
   */
  detectGlobalReferenceLeaks(): any[] {
    const leaks: any[] = [];

    // Check for common global leak patterns
    if (typeof global !== 'undefined') {
      // Check for common leak patterns in global
      for (const key in global) {
        if (global[key] && typeof global[key] === 'object') {
          // Check if object might be a leaked reference
          try {
            const constructor = global[key].constructor;
            if (constructor && constructor.name) {
              leaks.push({
                type: 'global-object',
                key,
                constructor: constructor.name,
                size: this.estimateObjectSize(global[key]),
              });
            }
          } catch (e) {
            // Ignore errors in introspection
          }
        }
      }
    }

    return leaks;
  }

  /**
   * Perform memory usage analysis for CI/CD environments
   */
  performCIAnalysis(): void {
    const memoryUsage = process.memoryUsage();
    const analysis = {
      heap: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        limit: memoryUsage.heapTotal * 0.8, // 80% threshold
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      rss: {
        used: memoryUsage.rss,
        limit: 512 * 1024 * 1024, // 512MB limit
        percentage: Math.round((memoryUsage.rss / (512 * 1024 * 1024)) * 100),
      },
      external: {
        used: memoryUsage.external,
        limit: 100 * 1024 * 1024, // 100MB limit
        percentage: Math.round((memoryUsage.external / (100 * 1024 * 1024)) * 100),
      },
    };

    qerrors.qerrors(
      new Error('CI memory analysis completed'),
      'test-memory-manager.performCIAnalysis',
      {
        analysis,
        thresholds: {
          heap: '80%',
          rss: '512MB',
          external: '100MB',
        },
      }
    );

    // Return structured data for CI tools
    console.log('CI_MEMORY_ANALYSIS:', JSON.stringify(analysis));
  }

  /**
   * Estimate object size without blocking the event loop
   * Uses heuristics to avoid expensive JSON.stringify on large objects
   */
  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) {
      return 0;
    }

    // Quick size estimation for common types
    const type = typeof obj;

    if (type === 'string') {
      return obj.length * 2; // UTF-16 characters
    }

    if (type === 'number') {
      return 8; // 64-bit number
    }

    if (type === 'boolean') {
      return 4;
    }

    if (type === 'function') {
      return 50; // Approximate function size
    }

    // For objects, use sampling approach for large objects
    if (type === 'object') {
      // Handle null case specifically (typeof null === 'object')
      if (obj === null) {
        return 0;
      }

      // Handle arrays and null separately
      if (Array.isArray(obj)) {
        return obj.length * 100; // Estimate per array element
      }

      try {
        // If object is small, use JSON.stringify
        const jsonString = JSON.stringify(obj);
        if (jsonString.length < 1000) {
          return jsonString.length;
        }

        // For large objects, estimate based on keys count
        const keys = Object.keys(obj);
        const estimatedSize = keys.length * 100; // Rough estimate per property
        return Math.min(estimatedSize, 50000); // Cap at 50KB to prevent overestimation
      } catch (e) {
        // Fallback for circular references or non-serializable objects
        try {
          return Object.keys(obj).length * 50;
        } catch (fallbackError) {
          // Object.keys() can fail on certain objects (e.g., Proxy with revoked handler)
          return 100; // Minimal fallback size
        }
      }
    }

    return 0;
  }

  /**
   * Cleanup all memory tracking state
   */
  cleanup(): void {
    try {
      if (!this.isActive) {
        return;
      }

      this.isActive = false;
      this.tracker.cleanup();
      this.analyzer.cleanup();

      qerrors.qerrors(
        new Error('Memory manager cleanup completed'),
        'test-memory-manager.cleanup',
        {
          components: {
            tracker: this.tracker,
            analyzer: this.analyzer,
          },
        }
      );
    } catch (error) {
      qerrors.qerrors(error as Error, 'test-memory-manager.cleanup', {
        error: error.message,
      });
    }
  }
}

export default TestMemoryManager;
