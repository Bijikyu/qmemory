/**
 * Queue Manager Module - In-Memory Queue Management with Metrics
 *
 * Purpose: Provides lightweight in-memory queue management for concurrency limiting,
 * metrics collection, and background task management. Unlike Redis-based AsyncQueueWrapper,
 * this module is for simple in-process rate limiting without external dependencies.
 *
 * Key Features:
 * - Concurrency limiting with configurable max concurrent operations
 * - Queue overflow protection with rejection tracking
 * - Real-time metrics collection (processing times, active count, reject count)
 * - Background interval management with graceful shutdown support
 * - Memory-efficient bounded metrics history
 */

export interface QueueMetrics {
  rejectCount: number;
  activeCount: number;
  queueSize: number;
  totalProcessed: number;
  averageProcessingTime: number;
  maxQueueSize: number;
}

export interface QueueManagerOptions {
  maxQueueSize?: number;
  maxMetricsHistory?: number;
  metricsIntervalMs?: number;
  cleanupIntervalMs?: number;
}

export class QueueStateManager {
  private queueRejectCount = 0;
  private queueSize = 0;
  private activeCount = 0;
  private totalProcessed = 0;
  private averageProcessingTime = 0;
  private readonly maxMetricsHistory: number;
  private processingTimes: number[] = [];

  constructor(maxMetricsHistory = 1000) {
    this.maxMetricsHistory = maxMetricsHistory;
  }

  incrementQueueSize(): number {
    return ++this.queueSize;
  }

  decrementQueueSize(): number {
    return Math.max(0, --this.queueSize);
  }

  incrementActiveCount(): number {
    return ++this.activeCount;
  }

  decrementActiveCount(): number {
    return Math.max(0, --this.activeCount);
  }

  incrementRejectCount(): number {
    return ++this.queueRejectCount;
  }

  incrementTotalProcessed(): number {
    return ++this.totalProcessed;
  }

  updateProcessingTime(time: number): void {
    this.processingTimes.push(time);
    if (this.processingTimes.length > this.maxMetricsHistory) {
      this.processingTimes.shift();
    }
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.averageProcessingTime = sum / this.processingTimes.length;
  }

  getQueueRejectCount(): number {
    return this.queueRejectCount;
  }
  getQueueSize(): number {
    return this.queueSize;
  }
  getActiveCount(): number {
    return this.activeCount;
  }
  getTotalProcessed(): number {
    return this.totalProcessed;
  }
  getAverageProcessingTime(): number {
    return this.averageProcessingTime;
  }

  resetMetrics(): void {
    this.queueRejectCount = 0;
    this.totalProcessed = 0;
    this.averageProcessingTime = 0;
    this.processingTimes = [];
  }

  getMetrics(): QueueMetrics {
    return {
      rejectCount: this.queueRejectCount,
      activeCount: this.activeCount,
      queueSize: this.queueSize,
      totalProcessed: this.totalProcessed,
      averageProcessingTime: this.averageProcessingTime,
      maxQueueSize: 0,
    };
  }
}

export class IntervalManager {
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  start(
    name: string,
    callback: () => void,
    intervalMs: number,
    options: { unref?: boolean } = {}
  ): void {
    if (this.intervals.has(name)) {
      return;
    }
    const interval = setInterval(callback, intervalMs);
    if (options.unref && typeof interval.unref === 'function') {
      interval.unref();
    }
    this.intervals.set(name, interval);
  }

  stop(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  stopAll(): void {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  isRunning(name: string): boolean {
    return this.intervals.has(name);
  }

  getActiveIntervals(): string[] {
    return Array.from(this.intervals.keys());
  }
}

type TaskFn<T> = () => Promise<T>;

export class ConcurrencyLimiter {
  private readonly maxConcurrent: number;
  private readonly maxQueueSize: number;
  private readonly stateManager: QueueStateManager;
  private activeCount = 0;
  private readonly queue: Array<{
    task: TaskFn<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(maxConcurrent: number, maxQueueSize = 100) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.stateManager = new QueueStateManager();
  }

  async execute<T>(task: TaskFn<T>): Promise<T> {
    if (this.queue.length >= this.maxQueueSize) {
      this.stateManager.incrementRejectCount();
      throw new Error('Queue at capacity - request rejected');
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as TaskFn<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.stateManager.incrementQueueSize();
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;
    this.stateManager.incrementActiveCount();
    this.stateManager.decrementQueueSize();
    const startTime = Date.now();

    try {
      const result = await item.task();
      this.stateManager.incrementTotalProcessed();
      this.stateManager.updateProcessingTime(Date.now() - startTime);
      item.resolve(result);
    } catch (error) {
      item.reject(error as Error);
    } finally {
      this.activeCount--;
      this.stateManager.decrementActiveCount();
      this.processNext();
    }
  }

  getMetrics(): QueueMetrics {
    const metrics = this.stateManager.getMetrics();
    metrics.maxQueueSize = this.maxQueueSize;
    return metrics;
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.reject(new Error('Queue cleared'));
      }
    }
    this.stateManager.resetMetrics();
  }
}

export function enforceQueueLimit(currentLength: number, maxLength: number): boolean {
  return currentLength < maxLength;
}

export function createConcurrencyLimiter(
  maxConcurrent: number,
  maxQueueSize?: number
): ConcurrencyLimiter {
  return new ConcurrencyLimiter(maxConcurrent, maxQueueSize);
}

const defaultIntervalManager = new IntervalManager();

export function startPeriodicTask(
  name: string,
  callback: () => void,
  intervalMs: number,
  options?: { unref?: boolean }
): void {
  defaultIntervalManager.start(name, callback, intervalMs, options);
}

export function stopPeriodicTask(name: string): void {
  defaultIntervalManager.stop(name);
}

export function stopAllPeriodicTasks(): void {
  defaultIntervalManager.stopAll();
}

export function getActivePeriodicTasks(): string[] {
  return defaultIntervalManager.getActiveIntervals();
}

export {
  QueueStateManager as QueueStateManagerClass,
  IntervalManager as IntervalManagerClass,
  ConcurrencyLimiter as ConcurrencyLimiterClass,
};
