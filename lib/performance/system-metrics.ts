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
  private collectMetricsEnabled: boolean = true; // NEW: Prevent runaway timer

  constructor(options: SystemMetricsOptions = {}) {
    // Configuration with production-appropriate defaults
    this.collectionInterval =
      options.collectionInterval || Number(DEFAULT_SYSTEM_COLLECTION_INTERVAL); // 30 seconds default
    this.maxHistoryPoints = options.maxHistoryPoints || Number(DEFAULT_MAX_HISTORY_POINTS); // 24 hours at 30s intervals
    // Historical data storage with bounded memory usage
    this.memoryHistory = []; // chronological memory usage snapshots
    this.cpuHistory = []; // chronological CPU utilization measurements
    // CPU calculation state for accurate percentage calculations
    this.lastCpuUsage = process.cpuUsage(); // baseline for relative CPU measurement
    this.startTime = process.hrtime(); // high-resolution time reference
    console.log(`SystemMetrics initialized with ${this.collectionInterval}ms collection interval`);
    // Start automated metrics collection for continuous monitoring
    this.collectionTimer = setInterval(() => this.collectMetrics(), this.collectionInterval);
  }
  /**
   * Collects current system resource metrics and updates historical data
   */
  collectMetrics(): void {
    try {
      // NEW: Prevent runaway collection if errors accumulate
      if (!this.collectMetricsEnabled) {
        return;
      }

      console.log('SystemMetrics collecting current resource measurements');
      // Capture current memory utilization from Node.js process
      const memory = process.memoryUsage();
      // Calculate CPU utilization since last measurement
      const cpuUsage = process.cpuUsage(this.lastCpuUsage);
      const elapsed = process.hrtime(this.startTime);
      const elapsedMS = elapsed[0] * 1000 + elapsed[1] / 1000000;
      // Convert CPU microseconds to percentage over elapsed time
      const cpuPercent = ((cpuUsage.user + cpuUsage.system) / elapsedMS) * 100;
      // Store memory snapshot with temporal context
      this.memoryHistory.push({
        timestamp: Date.now(), // temporal reference for trend analysis
        rss: memory.rss, // total process memory allocation
        heapUsed: memory.heapUsed, // active JavaScript heap consumption
        heapTotal: memory.heapTotal, // total heap space allocated
        external: memory.external, // C++ object memory binding
      });
      // Store CPU measurement with temporal context
      this.cpuHistory.push({
        timestamp: Date.now(), // temporal reference for trend analysis
        percent: cpuPercent, // CPU utilization percentage
      });
      // Maintain bounded historical data to prevent unlimited memory growth
      if (this.memoryHistory.length > this.maxHistoryPoints) {
        this.memoryHistory.shift(); // Remove oldest memory measurement
      }
      if (this.cpuHistory.length > this.maxHistoryPoints) {
        this.cpuHistory.shift(); // Remove oldest CPU measurement
      }
      // Update CPU calculation baseline for next measurement cycle
      this.lastCpuUsage = process.cpuUsage();
      this.startTime = process.hrtime();
      console.log(
        `SystemMetrics collected: CPU=${cpuPercent.toFixed(2)}%, Heap=${(memory.heapUsed / 1024 / 1024).toFixed(2)}MB`
      );
    } catch (error) {
      qerrors.qerrors(error as Error, 'system-metrics.collectMetrics', {
        memoryHistoryLength: this.memoryHistory.length,
        cpuHistoryLength: this.cpuHistory.length,
        maxHistoryPoints: this.maxHistoryPoints,
        hasValidCpuUsage: this.lastCpuUsage !== undefined,
        hasValidStartTime: this.startTime !== undefined,
      });
      // NEW: Disable collection if too many consecutive errors occur
      if (
        this.memoryHistory.length > this.maxHistoryPoints * 2 ||
        this.cpuHistory.length > this.maxHistoryPoints * 2
      ) {
        this.collectMetricsEnabled = false;
        console.error('SystemMetrics: Disabling collection due to excessive errors');
        this.stop();
        return;
      }
      // Log error but don't throw to prevent timer failures from crashing the application
      console.error('SystemMetrics failed to collect metrics:', error);
    }
  }
  /**
   * Generates comprehensive system resource metrics report
   *
   * @returns Comprehensive system resource metrics report
   */
  getMetrics(): SystemMetricsReport {
    try {
      console.log('SystemMetrics generating comprehensive metrics report');
      // Capture current memory state for real-time monitoring
      const currentMemory = process.memoryUsage();
      // Calculate recent CPU average for current utilization assessment
      const recentCpu = this.cpuHistory.slice(-10); // Last 10 measurements
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
          history: this.memoryHistory.slice(-100), // Recent trend data for analysis
        },
        cpu: {
          current: Math.round(avgCpu * 100) / 100, // Current utilization percentage
          history: this.cpuHistory.slice(-100), // Recent trend data for analysis
        },
        uptime: Math.round(process.uptime()), // Process availability duration
        nodeVersion: process.version, // Runtime environment context
      };
      console.log(
        `SystemMetrics report generated: CPU=${metrics.cpu.current}%, Heap=${metrics.memory.current.heapUsed}MB`
      );
      return metrics;
    } catch (error) {
      qerrors.qerrors(error as Error, 'system-metrics.getMetrics', {
        memoryHistoryLength: this.memoryHistory.length,
        cpuHistoryLength: this.cpuHistory.length,
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
