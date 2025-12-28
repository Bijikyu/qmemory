/**
 * Memory Tracker Types
 * Type definitions for memory management components
 */

export interface MemoryCheckpoint {
  id: string;
  timestamp: number;
  heapUsed: number;
  rss: number;
  external: number;
  context?: any;
}

export interface LeakAnalysis {
  hasLeaks: boolean;
  suspectedLeaks: any[];
  recommendations: string[];
  maxGrowthRate: number;
}

export interface MemoryThresholds {
  heap: number;
  rss: number;
  external: number;
  growthRate: number;
}

export interface MemoryManagerOptions {
  heapThreshold?: number;
  rssThreshold?: number;
  externalThreshold?: number;
  growthRateThreshold?: number;
  maxCheckpoints?: number;
}
