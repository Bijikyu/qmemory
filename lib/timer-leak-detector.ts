/**
 * Timer Leak Detection Utility
 * 
 * Purpose: Provides monitoring and alerting for potential timer memory leaks.
 * Works with TimerManager to detect long-running or excessive timers.
 * 
 * Features:
 * - Periodic monitoring for timer leaks
 * - Configurable thresholds for age and count
 * - Structured leak reports with actionable information
 * - Automatic cleanup capabilities
 */

import { timerManager } from './timer-manager.js';

export interface TimerLeakReport {
  timestamp: number;
  totalTimers: number;
  detectedLeaks: Array<{
    source: string;
    age: number;
    type: string;
  }>;
  stats: {
    timeouts: number;
    intervals: number;
    bySource: Record<string, number>;
  };
}

export interface TimerLeakDetectorOptions {
  maxAgeThreshold?: number;
  maxTimerThreshold?: number;
  checkInterval?: number;
}

export class TimerLeakDetector {
  private static instance: TimerLeakDetector;
  private monitoringInterval?: NodeJS.Timeout;
  private readonly maxAgeThreshold: number;
  private readonly maxTimerThreshold: number;
  private readonly checkInterval: number;

  private constructor(options: TimerLeakDetectorOptions = {}) {
    this.maxAgeThreshold = options.maxAgeThreshold ?? 300000; // 5 minutes
    this.maxTimerThreshold = options.maxTimerThreshold ?? 50;
    this.checkInterval = options.checkInterval ?? 60000; // 1 minute
  }

  static getInstance(options?: TimerLeakDetectorOptions): TimerLeakDetector {
    if (!this.instance) {
      this.instance = new TimerLeakDetector(options);
    }
    return this.instance;
  }

  static resetInstance(): void {
    if (this.instance) {
      this.instance.stopMonitoring();
      this.instance = undefined as unknown as TimerLeakDetector;
    }
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = timerManager.setInterval(
      () => this.checkForLeaks(),
      this.checkInterval,
      'timerLeakDetector-monitoring'
    );

    console.log('TimerLeakDetector: Started monitoring for timer leaks');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      timerManager.clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('TimerLeakDetector: Stopped monitoring');
    }
  }

  get isMonitoring(): boolean {
    return this.monitoringInterval !== undefined;
  }

  private checkForLeaks(): void {
    const stats = timerManager.getStats();
    const leaks = timerManager.detectMemoryLeaks(this.maxAgeThreshold);

    const hasTooManyTimers = stats.total > this.maxTimerThreshold;
    const hasOldTimers = leaks.length > 0;

    if (hasTooManyTimers || hasOldTimers) {
      const report: TimerLeakReport = {
        timestamp: Date.now(),
        totalTimers: stats.total,
        detectedLeaks: leaks,
        stats: {
          timeouts: stats.timeouts,
          intervals: stats.intervals,
          bySource: stats.bySource
        }
      };

      this.logLeakReport(report);
    }
  }

  private logLeakReport(report: TimerLeakReport): void {
    console.warn('Timer Leak Detection Alert:');
    console.warn(`Total timers: ${report.totalTimers}`);
    console.warn(`Timeouts: ${report.stats.timeouts}, Intervals: ${report.stats.intervals}`);

    if (report.detectedLeaks.length > 0) {
      console.warn('Potentially leaked timers:');
      report.detectedLeaks.forEach(leak => {
        console.warn(`  - ${leak.source}: ${leak.type} (${Math.round(leak.age / 1000)}s old)`);
      });
    }

    const topSources = Object.entries(report.stats.bySource)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    if (topSources.length > 0) {
      console.warn('Top timer sources:');
      topSources.forEach(([source, count]) => {
        console.warn(`  - ${source}: ${count} timers`);
      });
    }

    console.warn('Run timerManager.getStats() for detailed information');
    console.warn('Run timerManager.clearBySource("source-name") to clean up specific sources');
  }

  getCurrentReport(): TimerLeakReport {
    const stats = timerManager.getStats();
    const leaks = timerManager.detectMemoryLeaks(this.maxAgeThreshold);

    return {
      timestamp: Date.now(),
      totalTimers: stats.total,
      detectedLeaks: leaks,
      stats: {
        timeouts: stats.timeouts,
        intervals: stats.intervals,
        bySource: stats.bySource
      }
    };
  }

  cleanupOldTimers(maxAge?: number): number {
    const threshold = maxAge ?? this.maxAgeThreshold;
    const leaks = timerManager.detectMemoryLeaks(threshold);
    
    const sourcesToClean = new Set(leaks.map(leak => leak.source));
    let cleaned = 0;
    
    for (const source of sourcesToClean) {
      cleaned += timerManager.clearBySource(source);
    }

    console.log(`TimerLeakDetector: Cleaned up ${cleaned} old timers`);
    return cleaned;
  }

  emergencyCleanup(): void {
    console.warn('TimerLeakDetector: Emergency cleanup activated');
    timerManager.emergencyCleanup();
  }
}

export const timerLeakDetector = TimerLeakDetector.getInstance();

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  timerLeakDetector.startMonitoring();
}
