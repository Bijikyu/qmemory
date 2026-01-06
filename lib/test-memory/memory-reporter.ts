/**
 * Memory Reporter
 * Generates comprehensive memory analysis reports
 */

import type {
  MemoryCheckpoint,
  LeakAnalysis,
  MemoryManagerOptions,
} from './memory-tracker-types.js';
import qerrors from 'qerrors';
import { getTimestamp } from '../common-patterns.js';

export interface MemoryReport {
  timestamp: string;
  checkpoints: MemoryCheckpoint[];
  leakAnalysis: LeakAnalysis;
  recommendations: string[];
  gcAvailable: boolean;
}

export class MemoryReporter {
  constructor(private options: MemoryManagerOptions = {}) {}

  /**
   * Generate comprehensive memory report
   */
  generateReport(checkpoints: MemoryCheckpoint[], leakAnalysis: LeakAnalysis): MemoryReport {
    try {
      const report: MemoryReport = {
        timestamp: getTimestamp(),
        checkpoints,
        leakAnalysis,
        recommendations: this.generateRecommendations(leakAnalysis),
        gcAvailable: typeof global.gc === 'function',
      };

      qerrors.qerrors(new Error('Memory report generated'), 'memory-reporter.generateReport', {
        checkpointCount: checkpoints.length,
        hasLeaks: leakAnalysis.hasLeaks,
        maxGrowthRate: leakAnalysis.maxGrowthRate,
      });

      return report;
    } catch (error) {
      qerrors.qerrors(error as Error, 'memory-reporter.generateReport', {
        operation: 'report-generation',
      });

      return this.generateFallbackReport();
    }
  }

  /**
   * Generate recommendations based on leak analysis
   */
  private generateRecommendations(leakAnalysis: LeakAnalysis): string[] {
    const recommendations = [...leakAnalysis.recommendations];

    if (leakAnalysis.hasLeaks) {
      recommendations.push('Review test teardown procedures');
      recommendations.push('Check for circular references');
      recommendations.push('Ensure proper cleanup in afterEach');
    }

    if (leakAnalysis.maxGrowthRate > 2) {
      recommendations.push('Reduce checkpoint frequency');
      recommendations.push('Optimize memory usage in tests');
    }

    return recommendations;
  }

  /**
   * Generate fallback report on error
   */
  private generateFallbackReport(): MemoryReport {
    return {
      timestamp: getTimestamp(),
      checkpoints: [],
      leakAnalysis: {
        hasLeaks: false,
        suspectedLeaks: [],
        recommendations: ['Unable to perform analysis'],
        maxGrowthRate: 0,
      },
      recommendations: ['Check memory configuration'],
      gcAvailable: false,
    };
  }
}
