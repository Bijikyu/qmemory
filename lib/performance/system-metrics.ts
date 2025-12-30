/**
 * System Resource Monitoring
 *
 * Comprehensive system resource tracking including memory usage patterns, CPU utilization,
 * and process health metrics. This class provides early warning capabilities for resource
 * exhaustion scenarios and supports capacity planning decisions.
 */

import {
  DEFAULT_SYSTEM_COLLECTION_INTERVAL,
  DEFAULT_MAX_HISTORY_POINTS,
} from '../../config/localVars.js';
import * as qerrors from 'qerrors';

interface SystemMetricsOptions {
  collectionInterval?: number;
  maxHistoryPoints?: number;
}

interface MemorySnapshot {
  timestamp: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
}

interface CpuSnapshot {
  timestamp: number;
  percent: number;
}

interface SystemMetricsReport {
  memory: {
    current: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    history: MemorySnapshot[];
  };
  cpu: {
    current: number;
    history: CpuSnapshot[];
  };
  uptime: number;
  nodeVersion: string;
}

export default class SystemMetrics {
  private collectionInterval: number;
  private maxHistoryPoints: number;
  private memoryHistory: MemorySnapshot[];
  private cpuHistory: CpuSnapshot[];
  private lastCpuUsage: NodeJS.CpuUsage;
  private startTime: [number, number];
  private collectionTimer: NodeJS.Timeout | null;
  private collectMetricsEnabled: boolean = true;

  // Memory management improvements
  private memoryHistoryIndex: number = 0; // Circular buffer index
  private cpuHistoryIndex: number = 0; // Circular buffer index
  private isCircularBuffer: boolean = false; // Track if using circular buffer
  private consecutiveErrors: number = 0; // Track error patterns
  private memoryBufferComplete: boolean = false; // Track when memory buffer completes full cycle
  private cpuBufferComplete: boolean = false; // Track when CPU buffer completes full cycle
  private readonly MAX_CONSECUTIVE_ERRORS = 5; // Disable after 5 errors

  constructor(options: SystemMetricsOptions = {}) {
    // Configuration with production-appropriate defaults
    this.collectionInterval =
      options.collectionInterval || Number(DEFAULT_SYSTEM_COLLECTION_INTERVAL);
    this.maxHistoryPoints = options.maxHistoryPoints || Number(DEFAULT_MAX_HISTORY_POINTS);

    // Pre-allocate arrays for better memory efficiency
    this.memoryHistory = new Array(this.maxHistoryPoints);
    this.cpuHistory = new Array(this.maxHistoryPoints);

    // Initialize with empty objects to prevent undefined access
    for (let i = 0; i < this.maxHistoryPoints; i++) {
      this.memoryHistory[i] = { timestamp: 0, rss: 0, heapUsed: 0, heapTotal: 0, external: 0 };
      this.cpuHistory[i] = { timestamp: 0, percent: 0 };
    }

    // CPU calculation state for accurate percentage calculations
    this.lastCpuUsage = process.cpuUsage();
    this.startTime = process.hrtime();
    console.log(
      `SystemMetrics initialized with ${this.collectionInterval}ms collection interval, ${this.maxHistoryPoints} history points`
    );

    // Start automated metrics collection for continuous monitoring
    this.collectionTimer = setInterval(() => this.collectMetrics(), this.collectionInterval);
  }
  /**
   * Collects current system resource metrics and updates historical data
   */
  collectMetrics(): void {
    try {
      // Prevent runaway collection if errors accumulate
      if (!this.collectMetricsEnabled) {
        return;
      }

      // Capture current memory utilization from Node.js process
      const memory = process.memoryUsage();
      // Calculate CPU utilization since last measurement
      const cpuUsage = process.cpuUsage(this.lastCpuUsage);
      const elapsed = process.hrtime(this.startTime);
      const elapsedMS = elapsed[0] * 1000 + elapsed[1] / 1000000;
      // Convert CPU microseconds to percentage over elapsed time
      const cpuPercent = Math.min(((cpuUsage.user + cpuUsage.system) / elapsedMS) * 100, 100); // Cap at 100%

      const now = Date.now();

      // Use circular buffer for memory efficiency
      this.storeMemorySnapshot(this.memoryHistoryIndex, {
        timestamp: now,
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
      });

      this.storeCpuSnapshot(this.cpuHistoryIndex, {
        timestamp: now,
        percent: cpuPercent,
      });

      // Increment circular buffer indices
      this.memoryHistoryIndex = (this.memoryHistoryIndex + 1) % this.maxHistoryPoints;
      this.cpuHistoryIndex = (this.cpuHistoryIndex + 1) % this.maxHistoryPoints;

      // Track when each buffer completes a full cycle
      if (this.memoryHistoryIndex === 0) {
        this.memoryBufferComplete = true;
      }
      if (this.cpuHistoryIndex === 0) {
        this.cpuBufferComplete = true;
      }

      // Only mark circular buffer complete when BOTH buffers have completed at least one cycle
      if (this.memoryBufferComplete || this.cpuBufferComplete) {
        this.isCircularBuffer = true;
      }

      // Reset error counter on success
      this.consecutiveErrors = 0;

      // Update CPU calculation baseline for next measurement cycle
      this.lastCpuUsage = process.cpuUsage();
      this.startTime = process.hrtime();

      // Only log at debug level to reduce console spam
      if (this.memoryHistoryIndex % 10 === 0) {
        console.log(
          `SystemMetrics collected: CPU=${cpuPercent.toFixed(2)}%, Heap=${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`
        );
      }
    } catch (error) {
      this.consecutiveErrors++;
      qerrors.qerrors(error as Error, 'system-metrics.collectMetrics', {
        consecutiveErrors: this.consecutiveErrors,
        memoryHistoryIndex: this.memoryHistoryIndex,
        cpuHistoryIndex: this.cpuHistoryIndex,
        maxHistoryPoints: this.maxHistoryPoints,
        isCircularBuffer: this.isCircularBuffer,
      });

      // Disable collection if too many consecutive errors occur
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        this.collectMetricsEnabled = false;
        console.error(
          `SystemMetrics: Disabling collection after ${this.consecutiveErrors} consecutive errors`
        );
        this.stop();
        return;
      }

      console.error('SystemMetrics failed to collect metrics:', error);
    }
  }

  private storeMemorySnapshot(index: number, snapshot: MemorySnapshot): void {
    this.memoryHistory[index] = snapshot;
  }

  private storeCpuSnapshot(index: number, snapshot: CpuSnapshot): void {
    this.cpuHistory[index] = snapshot;
  }
  /**
   * Generates comprehensive system resource metrics report
   *
   * @returns Comprehensive system resource metrics report
   */
  getMetrics(): SystemMetricsReport {
    try {
      // Capture current memory state for real-time monitoring
      const currentMemory = process.memoryUsage();

      // Get recent history efficiently from circular buffer
      const recentMemoryHistory = this.getRecentHistory(
        this.memoryHistory,
        this.memoryHistoryIndex,
        100
      );
      const recentCpuHistory = this.getRecentHistory(this.cpuHistory, this.cpuHistoryIndex, 100);

      // Calculate recent CPU average for current utilization assessment
      const recentCpu = recentCpuHistory.slice(-10); // Last 10 measurements
      const avgCpu =
        recentCpu.length > 0
          ? recentCpu.reduce((sum, point) => sum + point.percent, 0) / recentCpu.length
          : 0;

      const metrics = {
        memory: {
          current: {
            rss: Math.round((currentMemory.rss / 1024 / 1024) * 100) / 100, // MB precision
            heapUsed: Math.round((currentMemory.heapUsed / 1024 / 1024) * 100) / 100, // MB precision
            heapTotal: Math.round((currentMemory.heapTotal / 1024 / 1024) * 100) / 100, // MB precision
            external: Math.round((currentMemory.external / 1024 / 1024) * 100) / 100, // MB precision
          },
          history: recentMemoryHistory, // Efficient recent trend data
        },
        cpu: {
          current: Math.round(avgCpu * 100) / 100, // Current utilization percentage
          history: recentCpuHistory, // Efficient recent trend data
        },
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
      };

      return metrics;
    } catch (error) {
      qerrors.qerrors(error as Error, 'system-metrics.getMetrics', {
        memoryHistoryIndex: this.memoryHistoryIndex,
        cpuHistoryIndex: this.cpuHistoryIndex,
        isCircularBuffer: this.isCircularBuffer,
        uptime: process.uptime(),
        nodeVersion: process.version,
      });

      // Return minimal metrics on error to prevent monitoring system failures
      return {
        memory: {
          current: { rss: 0, heapUsed: 0, heapTotal: 0, external: 0 },
          history: [],
        },
        cpu: {
          current: 0,
          history: [],
        },
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
      };
    }
  }

  private getRecentHistory<T extends { timestamp: number }>(
    history: T[],
    currentIndex: number,
    limit: number
  ): T[] {
    if (!this.isCircularBuffer) {
      // Still filling initial data
      return history.slice(0, Math.min(currentIndex, limit));
    }

    // Circular buffer - get recent data efficiently
    const result: T[] = [];
    const actualLimit = Math.min(limit, this.maxHistoryPoints);

    for (let i = 0; i < actualLimit; i++) {
      const index = (currentIndex - 1 - i + this.maxHistoryPoints) % this.maxHistoryPoints;
      const item = history[index];

      // Only include valid items (non-zero timestamps)
      if (item && item.timestamp > 0) {
        result.unshift(item); // Add to beginning to maintain chronological order
      }
    }

    return result;
  }
  /**
   * Stops automated metrics collection and cleans up resources
   */
  stop(): void {
    try {
      console.log('SystemMetrics stopping automated collection');
      if (this.collectionTimer) {
        clearInterval(this.collectionTimer);
        this.collectionTimer = null;
      }
    } catch (error) {
      qerrors.qerrors(error as Error, 'system-metrics.stop', {
        hasCollectionTimer: this.collectionTimer !== null,
        memoryHistoryLength: this.memoryHistory.length,
        cpuHistoryLength: this.cpuHistory.length,
      });
      // Log error but don't throw to prevent cleanup failures from crashing the application
      console.error('SystemMetrics failed to stop gracefully:', error);
    }
  }
}
