/**
 * Memory Tracker
 * Handles memory checkpoint tracking for test environments
 */

import type {
  MemoryCheckpoint,
  MemoryThresholds,
  MemoryManagerOptions,
} from './memory-tracker-types.js';
import qerrors from 'qerrors';

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
};

export class MemoryTracker {
  private checkpoints: MemoryCheckpoint[] = [];
  private maxCheckpoints: number;
  private leakThresholds: MemoryThresholds;
  private gcAvailable: boolean;

  constructor(options: MemoryManagerOptions = {}) {
    this.maxCheckpoints = options.maxCheckpoints ?? 20;
    this.leakThresholds = {
      heap: options.heapThreshold ?? 50,
      rss: options.rssThreshold ?? 100,
      external: options.externalThreshold ?? 25,
      growthRate: options.growthRateThreshold ?? 5,
    };
    this.gcAvailable = typeof global.gc === 'function';
  }

  /**
   * Take a memory checkpoint
   */
  takeCheckpoint(context?: any): MemoryCheckpoint {
    const memoryUsage = process.memoryUsage();
    const checkpoint: MemoryCheckpoint = {
      id: this.checkpoints.length.toString(),
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      rss: memoryUsage.rss,
      external: memoryUsage.external,
      context,
    };

    if (this.checkpoints.length >= this.maxCheckpoints) {
      this.checkpoints.shift();
    }

    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): MemoryCheckpoint[] {
    return [...this.checkpoints];
  }

  /**
   * Clear all checkpoints
   */
  clearCheckpoints(): void {
    this.checkpoints = [];
  }

  /**
   * Check if garbage collection is available
   */
  isGarbageCollectionAvailable(): boolean {
    return this.gcAvailable;
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): boolean {
    if (!this.gcAvailable) {
      return false;
    }

    global.gc();
    return true;
  }
}
