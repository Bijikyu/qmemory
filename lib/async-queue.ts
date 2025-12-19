import BeeQueue from 'bee-queue';
import { EventEmitter } from 'events';

export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

export interface QueueSettings {
  stalledInterval?: number;
  maxStalledCount?: number;
  visibility?: number;
  processConcurrency?: number;
  activateDelayedJobs?: boolean;
}

export interface QueueOptions {
  concurrency?: number;
  redis?: RedisOptions;
  prefix?: string;
  stallInterval?: number;
  nearActivatedWindow?: number;
  delayedDebounce?: number;
  maxDelayed?: number;
  removeOnSuccess?: boolean;
  removeOnFailure?: boolean;
  redisScanCount?: number;
  getEvents?: boolean;
  sendEvents?: boolean;
  storeJobs?: boolean;
  ensureScripts?: boolean;
  activateDelayedJobs?: boolean;
  isWorker?: boolean;
  catchExceptions?: boolean;
  settings?: QueueSettings;
}

export interface JobData {
  [key: string]: any;
  type?: string;
  status?: string;
}

export interface BeeQueueJob {
  id: string;
  data: JobData;
  options: QueueOptions;
  progress: number;
  status: string;
  type?: string;
  save(): Promise<unknown>;
}

export interface QueueStats {
  pending: number;
  active: number;
  concurrency: number;
  queues: Record<string, any>;
}

// Simplified wrapper that doesn't try to enforce strict typing on bee-queue
export class AsyncQueueWrapper extends EventEmitter {
  private queues: Map<string, any> = new Map();
  private processors: Map<string, (job: any) => Promise<unknown>[]> = new Map();
  private activeJobs: Set<string> = new Set();
  public concurrency: number;
  private beeOptions: any;

  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    this.queues = new Map();
    this.processors = new Map();
    this.activeJobs = new Set();

    this.beeOptions = {
      redis: options.redis || {
        host: 'localhost',
        port: 6379,
      },
      prefix: options.prefix || 'qmemory',
      stallInterval: options.stallInterval || 5000,
      nearActivatedWindow: options.nearActivatedWindow || 30 * 60 * 1000,
      delayedDebounce: options.delayedDebounce || 1000,
      maxDelayed: options.maxDelayed || 10000,
      removeOnSuccess: options.removeOnSuccess !== false,
      removeOnFailure: options.removeOnFailure !== false,
      redisScanCount: options.redisScanCount || 100,
      getEvents: options.getEvents !== false,
      sendEvents: options.sendEvents !== false,
      storeJobs: options.storeJobs !== false,
      ensureScripts: options.ensureScripts !== false,
      activateDelayedJobs: options.activateDelayedJobs !== false,
      isWorker: options.isWorker !== false,
      catchExceptions: options.catchExceptions !== false,
      settings: {
        stalledInterval: options.settings?.stalledInterval || 30000,
        maxStalledCount: options.settings?.maxStalledCount || 1,
        visibility: options.settings?.visibility || 30,
        processConcurrency: options.settings?.processConcurrency,
      },
    };
  }

  processor(type: string, processor: (job: any) => Promise<unknown>[]): void {
    this.processors.set(type, processor);
  }

  private getQueue(state = 'default'): any {
    if (!this.queues.has(state)) {
      const queue = new BeeQueue(`qmemory-${state}`, this.beeOptions);

      // Set up error handling
      queue.on('error', (error: Error) => {
        console.error(`Queue error for ${state}:`, error);
        this.emit('error', error);
      });

      queue.on('failed', (job: any, error: Error) => {
        console.error(`Job failed for ${state}:`, error);
        this.emit('failed', { job, error });
      });

      // Process jobs using our registered processors
      queue.process(async (job: any) => {
        // Get the registered processor for this job type
        const processor = this.processors.get(job.type);
        if (!processor) {
          throw new Error(`No processor registered for job type: ${job.type}`);
        }

        // Call the processor directly to avoid infinite recursion
        const results = await Promise.all(processor(job));
        return results.length > 0 ? results[0] : null;
      });

      this.queues.set(state, queue);
    }

    return this.queues.get(state);
  }

  async createJob(data: JobData, options: QueueOptions = {}): Promise<any> {
    const queue = this.getQueue(data.type || 'default');
    return queue.createJob(data, options);
  }

  async addJob(data: JobData, options: QueueOptions = {}): Promise<any> {
    const job = await this.createJob(data, options);
    return await job.save();
  }

  async getJobs(start = 0, end = 25, state?: string): Promise<any[]> {
    const queue = this.getQueue(state || 'default');
    return queue.getJobs(start, end);
  }

  async getJob(jobId: string): Promise<any | null> {
    for (const [name, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }

    return null;
  }

  async close(): Promise<void> {
    const promises = Array.from(this.queues.values()).map((queue: any) => queue.close());
    await Promise.all(promises);
    this.queues.clear();
    this.activeJobs.clear();
  }

  getActiveJobsCount(): number {
    return this.activeJobs.size;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const allJobs = await this.getJobs();

    const waitingJobs = allJobs.filter((job: any) => job.data.status === 'waiting');
    const activeJobs = allJobs.filter((job: any) => job.data.status === 'active');

    const stats: QueueStats = {
      pending: waitingJobs.length,
      active: activeJobs.length,
      concurrency: this.concurrency,
      queues: {} as Record<string, any>,
    };

    return stats;
  }

  /**
   * Static factory method
   */
  public static createQueue(options: QueueOptions = {}): AsyncQueueWrapper {
    return new AsyncQueueWrapper(options);
  }
}

// Export factory function for easier usage
export const createQueue = AsyncQueueWrapper.createQueue;

export type AsyncQueue = AsyncQueueWrapper;
