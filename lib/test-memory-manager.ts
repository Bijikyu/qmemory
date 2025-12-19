import { performance } from 'node:perf_hooks';

export interface MemoryThresholds {
  heap: number;
  rss: number;
  external: number;
  growthRate: number;
}

export interface TestMemoryManagerOptions {
  heapThreshold?: number;
  rssThreshold?: number;
  externalThreshold?: number;
  growthRateThreshold?: number;
  maxCheckpoints?: number;
}

export interface MemoryCheckpoint {
  id: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers?: number;
  context?: string;
}

export interface MemoryLeakAnalysis {
  heapGrowth: number;
  rssGrowth: number;
  externalGrowth: number;
  averageGrowthRate: number;
  suspiciousPatterns: string[];
}

export interface MemoryLeakReport {
  detected: boolean;
  checkpoints: MemoryCheckpoint[];
  analysis: MemoryLeakAnalysis;
  recommendations: string[];
}

export interface FreedMemoryBreakdown {
  heap: number;
  rss: number;
  external: number;
}

export interface MemoryCheckResult {
  before: MemoryCheckpoint;
  after: MemoryCheckpoint;
  freed: FreedMemoryBreakdown;
  gcRan: boolean;
}

export interface MemoryTrackingResult<T> {
  result: T;
  memoryReport: MemoryLeakReport;
}

type GlobalWithGc = {
  [key: string]: unknown;
  gc?: () => void;
};

/**
 * Test Memory Manager Class
 *
 * Provides comprehensive memory monitoring and leak detection for tests.
 */
export class TestMemoryManager {
  private checkpoints: MemoryCheckpoint[];

  private isActive: boolean;

  public readonly gcAvailable: boolean;

  private readonly leakThresholds: MemoryThresholds;

  private readonly maxCheckpoints: number;

  private readonly globalContext: GlobalWithGc;

  constructor(options: TestMemoryManagerOptions = {}) {
    this.checkpoints = [];
    this.isActive = false;
    this.globalContext = globalThis as GlobalWithGc;

    this.gcAvailable = typeof this.globalContext.gc === 'function';

    this.leakThresholds = {
      heap: options.heapThreshold ?? 50,
      rss: options.rssThreshold ?? 100,
      external: options.externalThreshold ?? 25,
      growthRate: options.growthRateThreshold ?? 5,
    };

    this.maxCheckpoints = options.maxCheckpoints ?? 20;
  }

  /**
   * Start memory monitoring session.
   *
   * @param context Optional context description.
   */
  startMonitoring(context?: string): void {
    if (this.isActive) {
      console.warn('Memory monitoring already active');
      return;
    }

    this.isActive = true;
    this.checkpoints = [];

    // Capture a baseline snapshot so we can compare deltas later.
    this.takeCheckpoint('baseline', context);
    console.log(`Memory monitoring started ${context ? `for ${context}` : ''}`);
  }

  /**
   * Stop memory monitoring and generate report.
   *
   * @returns Memory leak report.
   */
  stopMonitoring(): MemoryLeakReport {
    if (!this.isActive) {
      console.warn('Memory monitoring not active');
      return this.generateEmptyReport();
    }

    // Capture one final checkpoint before analysis.
    this.takeCheckpoint('final');
    this.isActive = false;

    const report = this.analyzeMemoryLeaks();
    console.log('Memory monitoring stopped');
    this.printReport(report);
    return report;
  }

  /**
   * Take memory checkpoint.
   *
   * @param id Checkpoint identifier.
   * @param context Optional context description.
   * @returns Memory checkpoint.
   */
  takeCheckpoint(id: string, context?: string): MemoryCheckpoint {
    if (!this.isActive && id !== 'current') {
      throw new Error('Memory monitoring not active');
    }

    const usage = process.memoryUsage();

    const checkpoint: MemoryCheckpoint = {
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
        // Keep the sliding window bounded so analysis stays fast and relevant.
        this.checkpoints.shift();
      }
    }

    return checkpoint;
  }

  /**
   * Force garbage collection if available.
   *
   * @returns True if GC was run.
   */
  forceGarbageCollection(): boolean {
    if (!this.gcAvailable || typeof this.globalContext.gc !== 'function') {
      console.warn('Garbage collection not available. Run node with --expose-gc flag.');
      return false;
    }

    for (let iteration = 0; iteration < 3; iteration += 1) {
      this.globalContext.gc();
      const start = Date.now();

      // Delay briefly to give the runtime a chance to finish the GC pass.
      while (Date.now() - start < 10) {
        // Intentional busy-wait: keeps execution synchronous and predictable for tests.
      }
    }

    return true;
  }

  /**
   * Get current memory usage.
   *
   * @returns Current memory checkpoint snapshot.
   */
  getCurrentUsage(): MemoryCheckpoint {
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
   * Cleanup memory aggressively.
   *
   * @returns Promise that resolves once cleanup completes.
   */
  async cleanup(): Promise<void> {
    console.log('Starting aggressive memory cleanup...');
    this.clearGlobalReferences();
    this.forceGarbageCollection();

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });

    if (this.isActive) {
      this.takeCheckpoint('cleanup');
    }

    console.log('Memory cleanup completed');
  }

  /**
   * Analyze memory leaks from checkpoints.
   *
   * @returns Memory leak report.
   */
  analyzeMemoryLeaks(): MemoryLeakReport {
    if (this.checkpoints.length < 2) {
      return this.generateEmptyReport();
    }

    const baseline = this.checkpoints[0];
    const final = this.checkpoints[this.checkpoints.length - 1];
    const recent = this.checkpoints.slice(-3);

    const heapGrowth = final.heapUsed - baseline.heapUsed;
    const rssGrowth = final.rss - baseline.rss;
    const externalGrowth = final.external - baseline.external;
    const durationMinutes = (final.timestamp - baseline.timestamp) / 1000 / 60;
    const averageGrowthRate = durationMinutes > 0 ? (heapGrowth + rssGrowth) / 2 / durationMinutes : 0;

    const suspiciousPatterns: string[] = [];

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

    const analysis: MemoryLeakAnalysis = {
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
   * Check for monotonic growth pattern.
   *
   * @param checkpoints Recent checkpoints to analyze.
   * @returns True when all recent checkpoints grow monotonically.
   */
  isMonotonicGrowth(checkpoints: MemoryCheckpoint[]): boolean {
    if (checkpoints.length < 3) {
      return false;
    }

    for (let index = 1; index < checkpoints.length; index += 1) {
      if (
        checkpoints[index].heapUsed < checkpoints[index - 1].heapUsed ||
        checkpoints[index].rss < checkpoints[index - 1].rss
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate recommendations based on analysis.
   *
   * @param detected Whether a leak was detected.
   * @param patterns Suspicious pattern descriptions.
   * @param analysis Computed leak analysis metrics.
   * @returns Recommendation strings.
   */
  generateRecommendations(
    detected: boolean,
    patterns: string[],
    analysis: MemoryLeakAnalysis,
  ): string[] {
    const recommendations: string[] = [];

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
   * Clear common global references that might hold memory.
   */
  clearGlobalReferences(): void {
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

    refsToClear.forEach((refName) => {
      const reference = this.globalContext[refName] as
        | {
            close?: () => unknown;
            disconnect?: () => unknown;
            clear?: () => unknown;
          }
        | null
        | undefined;

      if (!reference) {
        return;
      }

      try {
        if (typeof reference.close === 'function') {
          reference.close();
        }

        if (typeof reference.disconnect === 'function') {
          reference.disconnect();
        }

        if (typeof reference.clear === 'function') {
          reference.clear();
        }
      } catch (error) {
        console.warn(`Failed to clear ${refName}:`, error);
      }

      this.globalContext[refName] = null;
      delete this.globalContext[refName];
    });
  }

  /**
   * Print memory report to console.
   *
   * @param report Memory leak report to display.
   */
  printReport(report: MemoryLeakReport): void {
    console.log('\nMemory Leak Analysis Report:');
    console.log('=====================================');

    if (report.detected) {
      console.log('MEMORY LEAKS DETECTED');
    } else {
      console.log('No significant memory leaks detected');
    }

    console.log('\nGrowth Analysis:');
    console.log(`   Heap Growth: ${report.analysis.heapGrowth > 0 ? '+' : ''}${report.analysis.heapGrowth}MB`);
    console.log(`   RSS Growth: ${report.analysis.rssGrowth > 0 ? '+' : ''}${report.analysis.rssGrowth}MB`);
    console.log(`   External Growth: ${report.analysis.externalGrowth > 0 ? '+' : ''}${report.analysis.externalGrowth}MB`);
    console.log(`   Growth Rate: ${report.analysis.averageGrowthRate.toFixed(2)}MB/min`);

    if (report.analysis.suspiciousPatterns.length > 0) {
      console.log('\nSuspicious Patterns:');
      report.analysis.suspiciousPatterns.forEach((pattern) => {
        console.log(`   - ${pattern}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach((recommendation) => {
        console.log(`   ${recommendation}`);
      });
    }

    console.log('=====================================\n');
  }

  /**
   * Generate empty report.
   *
   * @returns Default report object indicating insufficient data.
   */
  generateEmptyReport(): MemoryLeakReport {
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
   * Get memory manager statistics.
   *
   * @returns Stats describing current monitoring state.
   */
  getStats(): {
    isActive: boolean;
    checkpointsCount: number;
    gcAvailable: boolean;
    currentUsage: MemoryCheckpoint;
    thresholds: MemoryThresholds;
  } {
    return {
      isActive: this.isActive,
      checkpointsCount: this.checkpoints.length,
      gcAvailable: this.gcAvailable,
      currentUsage: this.getCurrentUsage(),
      thresholds: this.leakThresholds,
    };
  }

  /**
   * Reset memory manager.
   */
  reset(): void {
    this.isActive = false;
    this.checkpoints = [];
    console.log('Memory manager reset');
  }
}

/**
 * Create a new memory manager instance.
 *
 * @param options Configuration options.
 * @returns New memory manager instance.
 */
export function createMemoryManager(options: TestMemoryManagerOptions = {}): TestMemoryManager {
  return new TestMemoryManager(options);
}

/**
 * Create and start a leak detection session.
 *
 * @param context Optional context description.
 * @returns Active memory manager.
 */
export function createLeakDetectionSession(context?: string): TestMemoryManager {
  const manager = new TestMemoryManager();
  manager.startMonitoring(context);
  return manager;
}

/**
 * Quick memory check with GC.
 *
 * @returns Before/after memory comparison.
 */
export function quickMemoryCheck(): MemoryCheckResult {
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
 * Run a function with memory tracking.
 *
 * @param fn Async function to run.
 * @param context Context description used in monitoring.
 * @returns Result with memory report.
 */
export async function withMemoryTracking<T>(
  fn: () => Promise<T> | T,
  context?: string,
): Promise<MemoryTrackingResult<T>> {
  const manager = createLeakDetectionSession(context);

  try {
    const result = await Promise.resolve(fn());
    const report = manager.stopMonitoring();

    return {
      result,
      memoryReport: report,
    };
  } catch (error) {
    manager.stopMonitoring();
    throw error;
  }
}

/**
 * Jest/test framework beforeAll helper.
 *
 * @param context Test suite context.
 * @returns Memory manager for the test suite.
 */
export function setupTestMemoryMonitoring(context?: string): TestMemoryManager {
  const manager = new TestMemoryManager();
  manager.startMonitoring(context);
  return manager;
}

/**
 * Jest/test framework afterAll helper.
 *
 * @param manager Memory manager to finalize.
 * @returns Memory leak report.
 */
export function teardownTestMemoryMonitoring(
  manager: TestMemoryManager | null | undefined,
): MemoryLeakReport | null {
  if (!manager) {
    return null;
  }

  return manager.stopMonitoring();
}
