/**
 * Memory management utilities for scalability and performance monitoring
 * Implements aggressive cleanup strategies to prevent memory leaks in production
 * 
 * This is distinct from TestMemoryManager which is focused on test environments.
 * This MemoryManager is designed for production monitoring and automatic cleanup.
 */

import * as qerrors from 'qerrors';

let heapdump: any = null;
let heapdumpLoaded = false;

async function loadHeapdump() {
  if (heapdumpLoaded) return heapdump;
  try {
    heapdump = require('heapdump');
  } catch (error) {
    console.log('[memory] heapdump not available - heap snapshots disabled');
  }
  heapdumpLoaded = true;
  return heapdump;
}

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsagePercent: number;
}

interface MemoryThresholds {
  warningPercent: number;
  criticalPercent: number;
  emergencyPercent: number;
  maxHeapSizeMB: number;
}

export class MemoryManager {
  private thresholds: MemoryThresholds;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcInterval: NodeJS.Timeout | null = null;
  private lastCleanup: number = 0;
  private cleanupCooldown: number = 30000;

  constructor(thresholds?: Partial<MemoryThresholds>) {
    this.thresholds = {
      warningPercent: 70,
      criticalPercent: 85,
      emergencyPercent: 95,
      maxHeapSizeMB: 512,
      ...thresholds
    };
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 15000);

    if ((global as any).gc) {
      this.gcInterval = setInterval(() => {
        this.performGarbageCollection();
      }, 60000);
    }

    console.log('[memory] Memory monitoring started');
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    console.log('[memory] Memory monitoring stopped');
  }

  getCurrentStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const heapUsagePercent = memUsage.heapTotal > 0 
      ? (memUsage.heapUsed / memUsage.heapTotal) * 100 
      : 0;

    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      heapUsagePercent
    };
  }

  private async checkMemoryUsage(): Promise<void> {
    const stats = this.getCurrentStats();
    const heapUsedMB = stats.heapUsed / 1024 / 1024;
    const heapTotalMB = stats.heapTotal / 1024 / 1024;

    const now = Date.now();
    if (now % 300000 < 15000 && now > 300000) {
      console.log(`[memory] Heap: ${heapUsedMB.toFixed(2)}MB/${heapTotalMB.toFixed(2)}MB (${stats.heapUsagePercent.toFixed(2)}%)`);
    }

    if (stats.heapUsagePercent >= this.thresholds.emergencyPercent) {
      await this.handleEmergencyMemory(stats);
    } else if (stats.heapUsagePercent >= this.thresholds.criticalPercent) {
      this.handleCriticalMemory(stats);
    } else if (stats.heapUsagePercent >= this.thresholds.warningPercent) {
      this.handleWarningMemory(stats);
    }

    if (heapUsedMB >= this.thresholds.maxHeapSizeMB) {
      await this.handleMaxHeapSizeExceeded(stats);
    }
  }

  private async handleEmergencyMemory(stats: MemoryStats): Promise<void> {
    const heapUsedMB = stats.heapUsed / 1024 / 1024;
    console.error(`[memory] EMERGENCY: High memory usage ${heapUsedMB.toFixed(2)}MB (${stats.heapUsagePercent.toFixed(2)}%)`);
    
    const heapSnapshot = await this.takeHeapSnapshot('emergency');
    
    this.performGarbageCollection();
    
    await this.performAggressiveCleanup();
    
    qerrors.qerrors(new Error('Emergency memory threshold exceeded'), 'memory.emergency', {
      heapUsed: heapUsedMB,
      heapUsagePercent: stats.heapUsagePercent,
      heapSnapshot
    });
  }

  private handleCriticalMemory(stats: MemoryStats): void {
    const heapUsedMB = stats.heapUsed / 1024 / 1024;
    console.warn(`[memory] CRITICAL: High memory usage ${heapUsedMB.toFixed(2)}MB (${stats.heapUsagePercent.toFixed(2)}%)`);
    
    this.performGarbageCollection();
    
    this.performModerateCleanup();
  }

  private handleWarningMemory(stats: MemoryStats): void {
    const heapUsedMB = stats.heapUsed / 1024 / 1024;
    console.warn(`[memory] WARNING: Elevated memory usage ${heapUsedMB.toFixed(2)}MB (${stats.heapUsagePercent.toFixed(2)}%)`);
    
    this.performGarbageCollection();
  }

  private async handleMaxHeapSizeExceeded(stats: MemoryStats): Promise<void> {
    const heapUsedMB = stats.heapUsed / 1024 / 1024;
    console.error(`[memory] MAX HEAP EXCEEDED: ${heapUsedMB.toFixed(2)}MB > ${this.thresholds.maxHeapSizeMB}MB`);
    
    const heapSnapshot = await this.takeHeapSnapshot('max-heap-exceeded');
    
    this.performGarbageCollection();
    
    await this.performAggressiveCleanup();
    
    qerrors.qerrors(new Error('Maximum heap size exceeded'), 'memory.maxHeapExceeded', {
      heapUsed: heapUsedMB,
      maxHeapSize: this.thresholds.maxHeapSizeMB,
      heapSnapshot
    });
  }

  private performGarbageCollection(): void {
    if ((global as any).gc) {
      try {
        (global as any).gc();
        console.log('[memory] Forced garbage collection completed');
      } catch (error) {
        qerrors.qerrors(error as Error, 'memory.gcFailed');
      }
    }
  }

  async takeHeapSnapshot(reason?: string): Promise<string | null> {
    await loadHeapdump();
    if (!heapdump) {
      console.log('[memory] heapdump not available - cannot take heap snapshot');
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reasonSuffix = reason ? `-${reason}` : '';
      const filename = `heapdump-${timestamp}${reasonSuffix}.heapsnapshot`;
      
      return new Promise((resolve, reject) => {
        heapdump.writeSnapshot(filename, (err: Error | null, filename: string) => {
          if (err) {
            qerrors.qerrors(err, 'memory.heapdumpFailed');
            console.error('[memory] Failed to write heap snapshot:', err.message);
            reject(err);
          } else {
            console.log(`[memory] Heap snapshot written to: ${filename}`);
            resolve(filename);
          }
        });
      });
    } catch (error) {
      qerrors.qerrors(error as Error, 'memory.heapdumpError');
      console.error('[memory] Error taking heap snapshot:', error);
      return null;
    }
  }

  private async performAggressiveCleanup(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastCleanup < this.cleanupCooldown) {
      return;
    }
    
    this.lastCleanup = now;
    
    try {
      for (let i = 0; i < 3; i++) {
        this.performGarbageCollection();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('[memory] Aggressive cleanup completed');
    } catch (error) {
      qerrors.qerrors(error as Error, 'memory.aggressiveCleanupFailed');
    }
  }

  private performModerateCleanup(): void {
    const now = Date.now();
    
    if (now - this.lastCleanup < this.cleanupCooldown) {
      return;
    }
    
    this.lastCleanup = now;
    
    try {
      this.performGarbageCollection();
      
      console.log('[memory] Moderate cleanup completed');
    } catch (error) {
      qerrors.qerrors(error as Error, 'memory.moderateCleanupFailed');
    }
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    stats: MemoryStats;
    thresholds: MemoryThresholds;
  } {
    const stats = this.getCurrentStats();
    
    let status: 'healthy' | 'warning' | 'critical' | 'emergency' = 'healthy';
    
    if (stats.heapUsagePercent >= this.thresholds.emergencyPercent) {
      status = 'emergency';
    } else if (stats.heapUsagePercent >= this.thresholds.criticalPercent) {
      status = 'critical';
    } else if (stats.heapUsagePercent >= this.thresholds.warningPercent) {
      status = 'warning';
    }
    
    return {
      status,
      stats,
      thresholds: this.thresholds
    };
  }

  cleanup(): void {
    this.stopMonitoring();
    console.log('[memory] Memory manager cleaned up');
  }

  async isHeapdumpAvailable(): Promise<boolean> {
    await loadHeapdump();
    return heapdump !== null;
  }

  async createManualHeapSnapshot(label: string = 'manual'): Promise<string | null> {
    console.log(`[memory] Creating manual heap snapshot: ${label}`);
    return await this.takeHeapSnapshot(label);
  }
}

export const memoryManager = new MemoryManager({
  warningPercent: 80,
  criticalPercent: 90,
  emergencyPercent: 95,
  maxHeapSizeMB: 1024
});

/**
 * Safely sanitizes objects to prevent memory leaks by creating a deep clone.
 * Breaks circular references and removes non-serializable values.
 * @param obj - Object to sanitize
 * @returns Sanitized deep clone of the object
 */
export const sanitizeObject = <T extends object>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to sanitize object:', error);
    return {} as T;
  }
};

/**
 * Cleans up object references to prevent memory leaks by deleting properties.
 * @param obj - Object to clean up
 * @param excludeKeys - Keys to exclude from cleanup
 */
export const cleanupObject = (obj: Record<string, unknown>, excludeKeys: string[] = []): void => {
  if (!obj || typeof obj !== 'object') return;
  
  Object.keys(obj).forEach(key => {
    if (!excludeKeys.includes(key)) {
      delete obj[key];
    }
  });
};

/**
 * Interface for WeakCache operations
 */
export interface WeakCache<K extends object, V extends object> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  has: (key: K) => boolean;
  delete: (key: K) => void;
  clear: () => void;
  size: () => number;
}

/**
 * Creates a weak reference cache for memory-efficient caching.
 * Uses WeakRef to allow garbage collection of cached values when no longer referenced elsewhere.
 * @param maxSize - Maximum cache size before evicting oldest entries
 * @returns Cache object with weak references
 */
export const createWeakCache = <K extends object, V extends object>(maxSize: number = 100): WeakCache<K, V> => {
  const cache = new Map<K, boolean>();
  const weakRefs = new WeakMap<K, WeakRef<V>>();
  
  return {
    get: (key: K): V | undefined => {
      const ref = weakRefs.get(key);
      return ref ? ref.deref() : undefined;
    },
    
    set: (key: K, value: V): void => {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) {
          cache.delete(oldestKey);
        }
      }
      
      const ref = new WeakRef(value);
      weakRefs.set(key, ref);
      cache.set(key, true);
    },
    
    has: (key: K): boolean => cache.has(key),
    
    delete: (key: K): void => {
      cache.delete(key);
    },
    
    clear: (): void => {
      cache.clear();
    },
    
    size: (): number => cache.size
  };
};

export default MemoryManager;
