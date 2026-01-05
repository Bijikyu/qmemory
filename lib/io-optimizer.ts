/**
 * I/O Optimization Module
 *
 * Moves expensive I/O operations out of request paths by implementing:
 * - Background processing queues
 * - Caching strategies
 * - Batch operations
 * - Pre-computed responses
 * - Asynchronous processing
 */

import EventEmitter from 'events';

interface BackgroundTask {
  id: string;
  type: string;
  data: unknown;
  priority: number;
  createdAt: number;
  retryCount?: number;
  callback?: (error?: Error, result?: unknown) => void;
}

interface CachedResponse {
  data: unknown;
  timestamp: number;
  ttl: number;
  etag?: string;
}

interface BatchOperation<T> {
  operations: Array<{
    type: string;
    data: T;
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }>;
  timeout: number;
}

/**
 * I/O Optimizer class for moving operations out of request paths
 */
class IOOptimizer {
  private eventEmitter: EventEmitter;
  private taskQueue: BackgroundTask[];
  private responseCache: Map<string, CachedResponse>;
  private batchQueue: Map<string, BatchOperation<unknown>>;
  private processingInterval: NodeJS.Timeout | null;
  private cacheCleanupInterval: NodeJS.Timeout | null;

  // Configuration
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly CACHE_CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly PROCESSING_INTERVAL = 100; // 100ms
  private readonly DEFAULT_CACHE_TTL = 300000; // 5 minutes

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.taskQueue = [];
    this.responseCache = new Map();
    this.batchQueue = new Map();
    this.processingInterval = null;
    this.cacheCleanupInterval = null;

    this.startBackgroundProcessing();
  }

  /**
   * Queue a background task for asynchronous processing
   */
  queueTask(task: Omit<BackgroundTask, 'id' | 'createdAt'>): string {
    const taskId = this.generateTaskId();
    const fullTask: BackgroundTask = {
      ...task,
      id: taskId,
      createdAt: Date.now(),
      retryCount: 0,
    };

    if (this.taskQueue.length >= this.MAX_QUEUE_SIZE) {
      // Remove oldest low-priority tasks
      this.taskQueue.sort((a, b) => a.priority - b.priority);
      this.taskQueue = this.taskQueue.slice(-this.MAX_QUEUE_SIZE + 1);
    }

    this.taskQueue.push(fullTask);
    this.eventEmitter.emit('taskQueued', fullTask);

    return taskId;
  }

  /**
   * Cache a response with TTL
   */
  cacheResponse(key: string, data: unknown, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      etag: this.generateETag(data),
    });
  }

  /**
   * Get cached response if valid
   */
  getCachedResponse(key: string): CachedResponse | null {
    const cached = this.responseCache.get(key);

    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.responseCache.delete(key);
      return null;
    }

    return cached;
  }

  /**
   * Batch operations for better I/O efficiency
   */
  batchOperations<T>(
    batchType: string,
    operations: Array<{ type: string; data: T }>,
    timeout: number = 5000
  ): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      const batchOperation: BatchOperation<T> = {
        operations: operations.map(op => ({
          ...op,
          resolve: () => {},
          reject: () => {},
        })),
        timeout,
      };

      // Override resolve/reject for actual operations
      batchOperation.operations = operations.map((op, index) => ({
        ...op,
        resolve: result => {
          batchOperation.operations[index].resolve = () => {};
          // Handle batch completion
          this.checkBatchCompletion(batchType, batchOperation);
        },
        reject: error => {
          batchOperation.operations[index].reject = () => {};
          // Handle batch failure
          this.checkBatchCompletion(batchType, batchOperation);
        },
      }));

      this.batchQueue.set(batchType, batchOperation);
      this.eventEmitter.emit('batchQueued', batchType, batchOperation);
    });
  }

  /**
   * Pre-compute expensive responses
   */
  async precomputeResponse<T>(
    key: string,
    computeFn: () => Promise<T>,
    ttl: number = this.DEFAULT_CACHE_TTL
  ): Promise<T> {
    const cached = this.getCachedResponse(key);
    if (cached) {
      return cached.data as T;
    }

    const result = await computeFn();
    this.cacheResponse(key, result, ttl);
    return result;
  }

  /**
   * Get statistics on I/O optimization
   */
  getStats() {
    return {
      queueSize: this.taskQueue.length,
      cacheSize: this.responseCache.size,
      batchQueueSize: this.batchQueue.size,
      taskTypes: this.getTaskTypeDistribution(),
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  /**
   * Start background processing loop
   */
  private startBackgroundProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processTaskQueue();
      this.processBatchQueue();
    }, this.PROCESSING_INTERVAL);

    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Process background task queue
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    // Sort by priority and creation time
    this.taskQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.createdAt - b.createdAt; // Earlier tasks first
    });

    const taskToProcess = this.taskQueue.shift();
    if (!taskToProcess) return;

    try {
      this.eventEmitter.emit('taskProcessing', taskToProcess);

      // Simulate async processing - in real use, this would be actual work
      await this.executeTask(taskToProcess);

      this.eventEmitter.emit('taskCompleted', taskToProcess);

      if (taskToProcess.callback) {
        taskToProcess.callback(undefined, 'Task completed successfully');
      }
    } catch (error) {
      this.eventEmitter.emit('taskFailed', taskToProcess, error);

      taskToProcess.retryCount = (taskToProcess.retryCount || 0) + 1;

      // Retry failed tasks up to 3 times
      if (taskToProcess.retryCount < 3) {
        this.taskQueue.push(taskToProcess);
      } else {
        if (taskToProcess.callback) {
          taskToProcess.callback(error as Error);
        }
      }
    }
  }

  /**
   * Process batch operations
   */
  private async processBatchQueue(): Promise<void> {
    for (const [batchType, batch] of this.batchQueue) {
      if (
        batch.operations.length > 0 &&
        Date.now() - (batch.operations[0]?.data as any)?.timestamp > batch.timeout
      ) {
        this.batchQueue.delete(batchType);
        continue;
      }

      // Simulate batch processing
      try {
        const results = await this.executeBatch(batchType, batch.operations);
        batch.operations.forEach((op, index) => {
          if (results[index]) {
            (op as any).resolve(results[index]);
          }
        });

        this.batchQueue.delete(batchType);
        this.eventEmitter.emit('batchCompleted', batchType, results);
      } catch (error) {
        batch.operations.forEach(op => {
          (op as any).reject(error as Error);
        });

        this.batchQueue.delete(batchType);
        this.eventEmitter.emit('batchFailed', batchType, error);
      }
    }
  }

  /**
   * Execute individual task (placeholder implementation)
   */
  private async executeTask(task: BackgroundTask): Promise<unknown> {
    switch (task.type) {
      case 'USER_STATS_UPDATE':
        return this.updateUserStats(task.data);
      case 'CACHE_REFRESH':
        return this.refreshCache(task.data);
      case 'METRICS_CALCULATION':
        return this.calculateMetrics(task.data);
      default:
        return { taskId: task.id, processed: true };
    }
  }

  /**
   * Execute batch operations (placeholder implementation)
   */
  private async executeBatch(batchType: string, operations: any[]): Promise<unknown[]> {
    switch (batchType) {
      case 'USER_OPERATIONS':
        return this.batchUserOperations(operations);
      case 'DATA_VALIDATION':
        return this.batchValidation(operations);
      default:
        return operations.map(() => ({ batchType, processed: true }));
    }
  }

  /**
   * Example implementations
   */
  private async updateUserStats(data: unknown): Promise<unknown> {
    // Simulate expensive user statistics calculation
    await new Promise(resolve => setTimeout(resolve, 50));
    return { userStatsUpdated: true, timestamp: Date.now() };
  }

  private async refreshCache(data: unknown): Promise<unknown> {
    // Simulate cache refresh operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return { cacheRefreshed: true, key: data };
  }

  private async calculateMetrics(data: unknown): Promise<unknown> {
    // Simulate metrics calculation
    await new Promise(resolve => setTimeout(resolve, 30));
    return { metrics: { cpu: 50, memory: 75 }, timestamp: Date.now() };
  }

  private async batchUserOperations(operations: any[]): Promise<unknown[]> {
    // Simulate batch user operations
    await new Promise(resolve => setTimeout(resolve, 80));
    return operations.map(op => ({ ...op, batchProcessed: true }));
  }

  private async batchValidation(operations: any[]): Promise<unknown[]> {
    // Simulate batch validation
    await new Promise(resolve => setTimeout(resolve, 20));
    return operations.map(op => ({ ...op, valid: true }));
  }

  /**
   * Check batch completion
   */
  private checkBatchCompletion(batchType: string, batch: BatchOperation<unknown>): void {
    // Simple check - all operations processed
    const allProcessed = batch.operations.every(
      op => typeof (op as any).resolve === 'function' && (op as any).resolve !== undefined
    );
    if (allProcessed) {
      this.batchQueue.delete(batchType);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.responseCache) {
      if (now - cached.timestamp > cached.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.responseCache.delete(key));
    if (expiredKeys.length > 0) {
      this.eventEmitter.emit('cacheCleanup', expiredKeys.length);
    }
  }

  /**
   * Get task type distribution
   */
  private getTaskTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const task of this.taskQueue) {
      distribution[task.type] = (distribution[task.type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Calculate cache hit rate (placeholder)
   */
  private calculateCacheHitRate(): number {
    // In real implementation, this would track hits vs misses
    return 0.85; // 85% cache hit rate
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate ETag for cache entries
   */
  private generateETag(data: unknown): string {
    const jsonStr = JSON.stringify(data);
    const hash = Buffer.from(jsonStr).toString('base64');
    return `W/"${hash.substring(0, 16)}"`;
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }

    this.eventEmitter.emit('shutdown');
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Event listener for task lifecycle
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

// Global I/O optimizer instance
const ioOptimizer = new IOOptimizer();

export { IOOptimizer, ioOptimizer, type BackgroundTask, type CachedResponse, type BatchOperation };
