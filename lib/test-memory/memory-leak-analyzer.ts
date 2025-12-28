/**
 * Memory Leak Analyzer
 * Detects and analyzes memory leaks in test environments
 */

import type { MemoryCheckpoint, MemoryManagerOptions } from './memory-tracker-types.js';
import qerrors from 'qerrors';

export interface LeakAnalysis {
  hasLeaks: boolean;
  suspectedLeaks: any[];
  recommendations: string[];
  maxGrowthRate: number;
}

export class MemoryLeakAnalyzer {
  private leakThresholds: {
    heap: number;
    rss: number;
    external: number;
    growthRate: number;
  };

  constructor(options: MemoryManagerOptions = {}) {
    this.leakThresholds = {
      heap: options.heapThreshold ?? 50,
      rss: options.rssThreshold ?? 100,
      external: options.externalThreshold ?? 25,
      growthRate: options.growthRateThreshold ?? 5,
    };
  }

  /**
   * Analyze memory checkpoints for leaks
   */
  analyzeCheckpoints(checkpoints: MemoryCheckpoint[]): LeakAnalysis {
    if (checkpoints.length < 2) {
      return {
        hasLeaks: false,
        suspectedLeaks: [],
        recommendations: ['Need at least 2 checkpoints for analysis'],
        maxGrowthRate: 0,
      };
    }

    const suspectedLeaks: any[] = [];
    let maxGrowthRate = 0;

    // Analyze memory growth patterns
    for (let i = 1; i < checkpoints.length; i++) {
      const prev = checkpoints[i - 1];
      const current = checkpoints[i];

      // Check for suspicious memory growth
      const heapGrowth = current.heapUsed - prev.heapUsed;
      const rssGrowth = current.rss - prev.rss;
      const externalGrowth = current.external - prev.external;

      if (heapGrowth > this.leakThresholds.heap) {
        suspectedLeaks.push({
          type: 'heap',
          startCheckpoint: prev.id,
          endCheckpoint: current.id,
          growth: heapGrowth,
          threshold: this.leakThresholds.heap,
        });
      }

      if (rssGrowth > this.leakThresholds.rss) {
        suspectedLeaks.push({
          type: 'rss',
          startCheckpoint: prev.id,
          endCheckpoint: current.id,
          growth: rssGrowth,
          threshold: this.leakThresholds.rss,
        });
      }

      if (externalGrowth > this.leakThresholds.external) {
        suspectedLeaks.push({
          type: 'external',
          startCheckpoint: prev.id,
          endCheckpoint: current.id,
          growth: externalGrowth,
          threshold: this.leakThresholds.external,
        });
      }

      maxGrowthRate = Math.max(maxGrowthRate, heapGrowth);
    }

    const growthRate = this.calculateGrowthRate(checkpoints);
    const recommendations = this.generateRecommendations(suspectedLeaks, growthRate);

    return {
      hasLeaks: suspectedLeaks.length > 0,
      suspectedLeaks,
      recommendations,
      maxGrowthRate: growthRate,
    };
  }

  /**
   * Calculate memory growth rate
   */
  private calculateGrowthRate(checkpoints: MemoryCheckpoint[]): number {
    if (checkpoints.length < 2) return 0;

    let totalGrowth = 0;
    for (let i = 1; i < checkpoints.length; i++) {
      totalGrowth += checkpoints[i].heapUsed - checkpoints[i - 1].heapUsed;
    }

    return totalGrowth / (checkpoints.length - 1);
  }

  /**
   * Generate leak recommendations
   */
  private generateRecommendations(leaks: any[], growthRate: number): string[] {
    const recommendations: string[] = [];

    if (leaks.length > 0) {
      recommendations.push('Memory leaks detected - review object lifecycles');
      recommendations.push('Check for circular references');
      recommendations.push('Ensure proper cleanup in test teardown');
    }

    if (growthRate > this.leakThresholds.growthRate) {
      recommendations.push('High memory growth rate detected');
      recommendations.push('Review for memory accumulation patterns');
      recommendations.push('Consider reducing checkpoint frequency');
    }

    if (recommendations.length === 0) {
      recommendations.push('No memory issues detected');
    }

    return recommendations;
  }
}
