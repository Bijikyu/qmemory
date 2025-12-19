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
  [key: string]: unknown;
  status?: 'waiting' | 'active' | 'succeeded' | 'failed' | 'delayed';
}

export interface JobEvent {
  type: string;
  result?: unknown;
  error?: Error;
  job: string;
}

export interface QueueStats {
  pending: number;
  active: number;
  concurrency: number;
  queues: {
    [type: string]: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  };
}

export interface BeeQueueJob {
  id: string;
  data: JobData;
  on(event: string, callback: (job: BeeQueueJob, result?: unknown, error?: Error) => void): void;
  save(): Promise<unknown>;
}

export interface BeeQueueInstance {
  process(processor: (job: BeeQueueJob) => Promise<unknown>): void;
  on(event: string, callback: (job: BeeQueueJob, result?: unknown, error?: Error) => void;
  createJob(data: JobData, options?: QueueOptions): BeeQueueJob;
  getJobs(state?: string, start?: number, end?: number): Promise<BeeQueueJob[]>;
  getJob(jobId: string): Promise<BeeQueueJob | null>;
  close(): Promise<void>;
  paused: boolean;
  settings: QueueSettings;
}

export type AsyncQueue = AsyncQueueWrapper;

export class AsyncQueueWrapper extends EventEmitter {
  private queues: Map<string, BeeQueueInstance>;
  private processors: Map<string, (job: BeeQueueJob) => Promise<unknown>[]>;
  private activeJobs: Set<string>;
  public concurrency: number;

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
        processConcurrency: options.settings?.processConcurrency
      }
    };
  }

  processor(type: string, processor: (job: BeeQueueJob) => Promise<unknown>[]): void {
    this.processors.set(type, processor);
  }

  async process(job: BeeQueueJob): Promise<unknown> {
    this.activeJobs.add(job.id);
    
    try {
      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }
      
      const results = await Promise.all(processor(job));
      const result = results.length > 0 ? results[0] : null;
      
      if (this.beeOptions.getEvents) {
        this.emit('processed', { job, result });
      }
      
      return result;
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  private getQueue(name: string): BeeQueueInstance {
    if (!this.queues.has(name)) {
      const queue = new BeeQueue(name, this.beeOptions);
      
      queue.process((jobData, done) => {
        this.process(job).then(result => {
          done(null, result);
        }).catch(error => {
          done(error);
        });
      });
      
      if (this.beeOptions.getEvents) {
        queue.on('succeeded', (job) => {
          if (this.beeOptions.sendEvents) {
            this.emit('completed', { job });
          }
          this.activeJobs.delete(job.id);
        });
        
        queue.on('failed', (job: BeeQueueJob, err: Error) => {
          if (this.beeOptions.sendEvents) {
            this.emit('failed', { job, error: err });
          }
          this.activeJobs.delete(job.id);
        });
      }
      
      this.queues.set(name, queue);
    }
    
    return this.queues.get(name);
  }

  createJob(data: JobData, options?: QueueOptions): BeeQueueJob {
    const queue = this.getQueue(data.type);
    const job = queue.createJob(data);
    
    if (this.beeOptions.getEvents) {
      this.emit('created', { job });
    }
    
    return job;
  }

  getJobs(state?: string, start?: number, end?: number): Promise<BeeQueueJob[]> {
    const queue = this.getQueue(state || 'default');
    return queue.getJobs(start, end);
  }

  async getJob(jobId: string): Promise<BeeQueueJob | null> {
    for (const [name, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }
    
    return null;
  }

  async close(): Promise<void> {
    const promises = Array.from(this.queues.values()).map(queue => queue.close());
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
    
    const waitingJobs = allJobs.filter(job => job.data.status === 'waiting');
    const activeJobs = allJobs.filter(job => job.data.status === 'active');
    const completedJobs = allJobs.filter(job => job.data.status === 'succeeded');
    const failedJobs = allJobs.filter(job => job.data.status === 'failed');
    const delayedJobs = allJobs.filter(job => job.data.status === 'delayed');
    
    const stats: QueueStats = {
      pending: waitingJobs.length,
      active: activeJobs.length,
      concurrency: this.concurrency,
      queues: {} as Record<string, any>
    };
    
    return stats;
  }

  /**
   * Static factory method
   */
  public static createQueue(options: QueueOptions = {}): AsyncQueue {
    return new AsyncQueueWrapper(options);
  }
}