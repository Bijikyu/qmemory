/**
 * Centralized Timer Manager
 * 
 * Purpose: Prevents memory leaks from unmanaged setTimeout/setInterval calls
 * by tracking all timers and providing automatic cleanup capabilities.
 * 
 * Key Features:
 * - Tracks all setTimeout/setInterval with metadata (source, type, createdAt)
 * - Automatic cleanup on process shutdown
 * - Memory leak detection for long-running timers
 * - Clear timers by source for targeted cleanup
 * - Statistics tracking for monitoring
 */

interface TimerInfo {
  id: NodeJS.Timeout;
  type: 'timeout' | 'interval';
  createdAt: number;
  source: string;
  cleanupOnShutdown?: boolean;
}

interface TimerStats {
  total: number;
  timeouts: number;
  intervals: number;
  bySource: Record<string, number>;
}

export class TimerManager {
  private timers: Map<NodeJS.Timeout, TimerInfo> = new Map();
  private isShutdown = false;
  private stats: TimerStats = {
    total: 0,
    timeouts: 0,
    intervals: 0,
    bySource: {}
  };

  setTimeout(
    callback: (...args: unknown[]) => void,
    delay: number,
    source: string = 'unknown',
    cleanupOnShutdown: boolean = true
  ): NodeJS.Timeout {
    const shouldTrack = !this.isShutdown;
    if (this.isShutdown) {
      console.warn(`TimerManager: Cannot create setTimeout after shutdown (source: ${source})`);
    }

    const timerId = global.setTimeout(() => {
      this.removeTimer(timerId);
      try {
        callback();
      } catch (error) {
        console.error(`TimerManager: Error in timeout callback (source: ${source}):`, error);
      }
    }, delay);

    const timerInfo: TimerInfo = {
      id: timerId,
      type: 'timeout',
      createdAt: Date.now(),
      source,
      cleanupOnShutdown
    };

    this.timers.set(timerId, timerInfo);
    if (shouldTrack) {
      this.updateStats('add', timerInfo);
    }

    return timerId;
  }

  setInterval(
    callback: (...args: unknown[]) => void,
    delay: number,
    source: string = 'unknown',
    cleanupOnShutdown: boolean = true
  ): NodeJS.Timeout {
    const shouldTrack = !this.isShutdown;
    if (this.isShutdown) {
      console.warn(`TimerManager: Cannot create setInterval after shutdown (source: ${source})`);
    }

    const timerId = global.setInterval(() => {
      try {
        callback();
      } catch (error) {
        console.error(`TimerManager: Error in interval callback (source: ${source}):`, error);
      }
    }, delay);

    const timerInfo: TimerInfo = {
      id: timerId,
      type: 'interval',
      createdAt: Date.now(),
      source,
      cleanupOnShutdown
    };

    this.timers.set(timerId, timerInfo);
    if (shouldTrack) {
      this.updateStats('add', timerInfo);
    }

    return timerId;
  }

  clearTimeout(timerId: NodeJS.Timeout): void {
    if (timerId) {
      global.clearTimeout(timerId);
      this.removeTimer(timerId);
    }
  }

  clearInterval(timerId: NodeJS.Timeout): void {
    if (timerId) {
      global.clearInterval(timerId);
      this.removeTimer(timerId);
    }
  }

  private removeTimer(timerId: NodeJS.Timeout): void {
    const timerInfo = this.timers.get(timerId);
    if (timerInfo) {
      this.updateStats('remove', timerInfo);
      this.timers.delete(timerId);
    }
  }

  private updateStats(action: 'add' | 'remove', timerInfo: TimerInfo): void {
    if (action === 'add') {
      this.stats.total++;
      this.stats.bySource[timerInfo.source] = (this.stats.bySource[timerInfo.source] || 0) + 1;
      
      if (timerInfo.type === 'timeout') {
        this.stats.timeouts++;
      } else {
        this.stats.intervals++;
      }
    } else {
      this.stats.total = Math.max(0, this.stats.total - 1);
      this.stats.bySource[timerInfo.source] = Math.max(0, (this.stats.bySource[timerInfo.source] || 0) - 1);
      
      if (timerInfo.type === 'timeout') {
        this.stats.timeouts = Math.max(0, this.stats.timeouts - 1);
      } else {
        this.stats.intervals = Math.max(0, this.stats.intervals - 1);
      }
    }
  }

  getStats(): TimerStats {
    return { ...this.stats };
  }

  getActiveTimers(): TimerInfo[] {
    return Array.from(this.timers.values());
  }

  get activeCount(): number {
    return this.timers.size;
  }

  detectMemoryLeaks(maxAge: number = 300000): { source: string; age: number; type: string }[] {
    const now = Date.now();
    const leaks: { source: string; age: number; type: string }[] = [];

    for (const timerInfo of this.timers.values()) {
      const age = now - timerInfo.createdAt;
      if (age > maxAge) {
        leaks.push({
          source: timerInfo.source,
          age,
          type: timerInfo.type
        });
      }
    }

    return leaks;
  }

  clearBySource(source: string): number {
    let cleared = 0;
    const timersToClear: NodeJS.Timeout[] = [];

    for (const [timerId, timerInfo] of this.timers.entries()) {
      if (timerInfo.source === source) {
        timersToClear.push(timerId);
      }
    }

    for (const timerId of timersToClear) {
      const timerInfo = this.timers.get(timerId);
      if (timerInfo) {
        if (timerInfo.type === 'timeout') {
          this.clearTimeout(timerId);
        } else {
          this.clearInterval(timerId);
        }
        cleared++;
      }
    }

    return cleared;
  }

  shutdown(): void {
    if (this.isShutdown) return;
    
    this.isShutdown = true;
    
    for (const [, timerInfo] of this.timers.entries()) {
      if (timerInfo.cleanupOnShutdown !== false) {
        try {
          if (timerInfo.type === 'timeout') {
            global.clearTimeout(timerInfo.id);
          } else {
            global.clearInterval(timerInfo.id);
          }
        } catch (error) {
          console.warn(`TimerManager: Error clearing timer:`, error);
        }
      }
    }

    const clearedCount = this.timers.size;
    this.timers.clear();
    
    this.stats = {
      total: 0,
      timeouts: 0,
      intervals: 0,
      bySource: {}
    };

    console.log(`TimerManager: Shutdown complete, cleared ${clearedCount} timers`);
  }

  emergencyCleanup(): void {
    console.warn('TimerManager: Emergency cleanup activated - clearing all timers');
    this.isShutdown = false;
    
    for (const [, timerInfo] of this.timers.entries()) {
      try {
        if (timerInfo.type === 'timeout') {
          global.clearTimeout(timerInfo.id);
        } else {
          global.clearInterval(timerInfo.id);
        }
      } catch (error) {
        console.warn(`TimerManager: Error during emergency cleanup:`, error);
      }
    }

    this.timers.clear();
    this.stats = {
      total: 0,
      timeouts: 0,
      intervals: 0,
      bySource: {}
    };
  }

  reset(): void {
    this.emergencyCleanup();
    this.isShutdown = false;
  }
}

export const timerManager = new TimerManager();

if (typeof process !== 'undefined') {
  process.on('exit', () => {
    timerManager.shutdown();
  });

  process.on('SIGINT', () => {
    timerManager.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    timerManager.shutdown();
    process.exit(0);
  });
}
