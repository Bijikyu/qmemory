/**
 * Refactored Test Memory Manager
 * Memory management with separated concerns and improved testability
 */

import type {
  MemoryCheckpoint,
  LeakAnalysis,
  MemoryManagerOptions,
} from './memory-tracker-types.js';
import { MemoryTracker } from './memory-tracker.js';
import { MemoryLeakAnalyzer } from './memory-leak-analyzer.js';
import { MemoryReporter } from './memory-reporter.js';
import { createModuleUtilities } from '../common-patterns.js';

const utils = createModuleUtilities('test-memory-manager');

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

      utils.debugLog('Memory monitoring started', {
        context,
        components: {
          tracker: this.tracker,
          analyzer: this.analyzer,
          reporter: this.reporter,
        },
      });
    } catch (error) {
      utils.logError(error as Error, 'startMonitoring', {
        context,
        hasError: error instanceof Error,
        errorMessage: error instanceof Error ? error.message : String(error),
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

      utils.debugLog('Memory monitoring stopped', {
        components: {
          tracker: this.tracker,
          analyzer: this.analyzer,
          reporter: this.reporter,
        },
      });
    } catch (error) {
      utils.logError(error as Error, 'stopMonitoring', {
        components: {
          tracker: this.tracker,
          analyzer: this.analyzer,
          reporter: this.reporter,
        },
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
    utils.debugLog('Starting aggressive memory cleanup', {
      action: 'aggressive-cleanup',
    });

    // Force garbage collection
    if (this.forceGarbageCollection()) {
      utils.debugLog('Forced garbage collection completed', {
        action: 'garbage-collection-forced',
      });
    }

    // Clear all checkpoints to free memory
    this.clearCheckpoints();

    utils.debugLog('Aggressive memory cleanup completed', {
      action: 'aggressive-cleanup-completed',
    });
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

    utils.debugLog('CI memory analysis completed', {
      analysis,
      thresholds: {
        heap: '80%',
        objects: '1000',
      },
    });

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

      utils.debugLog('Memory manager cleanup completed', {
        components: {
          tracker: this.tracker,
          analyzer: this.analyzer,
          reporter: this.reporter,
        },
      });
    } catch (error) {
      utils.logError(error as Error, 'cleanup', {
        error: error.message,
      });
    }
  }
}

export default TestMemoryManager;
