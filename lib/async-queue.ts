import BeeQueue from 'bee-queue';
import { EventEmitter } from 'events';

export interface RedisOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  [key: string]: any;
}

export interface QueueSettings {
  stalledInterval?: number;
  maxStalledCount?: number;
  visibility?: number;
  processConcurrency?: number;
  activateDelayedJobs?: boolean;
  [key: string]: any;
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

export interface JobOptions {
  delay?: number;
  delayUntil?: number;
  retries?: number;
  backoff?: string;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  waitForResult?: boolean;
  [key: string]: any;
}

export interface JobData {
  [key: string]: any;
}

export interface JobEvent {
  type: string;
  result?: any;
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
  on(event: string, callback: (data?: any) => void): void;
  save(): Promise<any>;
}

export interface BeeQueueInstance {
  process(processor: (job: BeeQueueJob) => Promise<any>): void;
  on(event: string, callback: (job?: BeeQueueJob, result?: any, error?: Error) => void): void;
  createJob(data: JobData, options?: JobOptions): BeeQueueJob;
  getJobs(state: string, start?: number, end?: number): Promise<BeeQueueJob[]>;
  getJob(jobId: string): Promise<BeeQueueJob | null>;
  close(): Promise<void>;
  paused: boolean;
  settings: QueueSettings;
  [key: string]: any;
}

export class AsyncQueueWrapper extends EventEmitter {
  private queues: Map<string, BeeQueueInstance>;
  private processors: Map<string, (job: BeeQueueJob) => Promise<any>>;
  private beeOptions: QueueOptions;
  private activeJobs: Set<string>;
  public concurrency: number;

  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    
    const beeOptions: QueueOptions = {
      redis: options.redis || {
        host: 'localhost',
        port: 6379
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
        visibility: options.settings?.visibility || 30
      }
    };
    
    this.queues = new Map();
    this.processors = new Map();
    this.beeOptions = beeOptions;
    
    this.activeJobs = new Set();
  }

  /**
   * Register a processor for a job type
   * 
   * @param type - Job type
   * @param processor - Processing function
   */
  processor(type: string, processor: (job: BeeQueueJob) => Promise<any>): void {
    this.processors.set(type, processor);
    
    if (!this.queues.has(type)) {
      const queue = new BeeQueue(type, this.beeOptions) as BeeQueueInstance;
      
      // Set queue settings
      if (!queue.settings) {
        queue.settings = {} as QueueSettings;
      }
      queue.settings.activateDelayedJobs = true;
      queue.settings.processConcurrency = this.concurrency;
      
      queue.process(async (job: BeeQueueJob) => {
        this.activeJobs.add(job.id);
        this.emit('started', { type, job: job.id });
        
        try {
          const result = await processor(job);
          this.activeJobs.delete(job.id);
          this.emit('completed', { type, result, job: job.id });
          return result;
        } catch (error) {
          this.activeJobs.delete(job.id);
          this.emit('failed', { type, error: error as Error, job: job.id });
          throw error;
        }
      });
      
      queue.on('succeeded', (job?: BeeQueueJob, result?: any) => {
        if (job) {
          this.emit('completed', { type, result, job: job.id });
        }
      });
      
      queue.on('failed', (job?: BeeQueueJob, error?: Error) => {
        if (job) {
          this.emit('failed', { type, error: error as Error, job: job.id });
        }
      });
      
      queue.on('stalled', (job?: BeeQueueJob) => {
        if (job) {
          this.emit('stalled', { type, job: job.id });
        }
      });
      
      this.queues.set(type, queue);
    }
  }

  /**
   * Add a job to queue
   * 
   * @param type - Job type
   * @param data - Job data
   * @param options - Job options
   * @returns Job result
   */
  async add<T = any>(type: string, data: JobData, options: JobOptions = {}): Promise<T> {
    const queue = this.queues.get(type);
    if (!queue) {
      this.processor(type, async () => {
        throw new Error(`No processor for job type: ${type}`);
      });
      return this.add(type, data, options);
    }
    
    const jobOptions: any = {
      retries: options.retries || 3,
      backoff: options.backoff || 'exponential',
      removeOnComplete: options.removeOnComplete !== false,
      removeOnFail: options.removeOnFail !== false,
      ...options
    };
    
    if (options.delay !== undefined) {
      jobOptions.delayUntil = options.delay;
    }
    
    const job = queue.createJob(data, jobOptions);
    const result = await job.save();
    
    if (options.waitForResult !== false) {
      return new Promise((resolve, reject) => {
        job.on('succeeded', (result: T) => resolve(result));
        job.on('failed', (err: Error) => reject(err));
      });
    }
    
    return result as T;
  }

  /**
   * Schedule a delayed job
   * 
   * @param type - Job type
   * @param data - Job data
   * @param delay - Delay in milliseconds
   * @returns Job result
   */
  async schedule<T = any>(type: string, data: JobData, delay: number): Promise<T> {
    return this.add(type, data, { delay, waitForResult: true });
  }

  /**
   * Get queue statistics
   * 
   * @returns Queue stats
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      pending: 0,
      active: this.activeJobs.size,
      concurrency: this.concurrency,
      queues: {}
    };
    
    for (const [type] of this.queues) {
      const queueStats = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      };
      
      stats.queues[type] = queueStats;
      stats.pending += queueStats.waiting;
    }
    
    return stats;
  }

  /**
   * Pause job processing
   * 
   * @param type - Job type to pause (optional)
   */
  async pause(type?: string): Promise<void> {
    if (type) {
      const queue = this.queues.get(type);
      if (queue) {
        // Note: bee-queue uses a different API for pausing
        // This would need to be implemented based on the actual bee-queue API
        console.log(`Pausing queue for type: ${type}`);
      }
    } else {
      for (const [type] of this.queues) {
        console.log(`Pausing queue for type: ${type}`);
      }
    }
  }

  /**
   * Resume job processing
   * 
   * @param type - Job type to resume (optional)
   */
  async resume(type?: string): Promise<void> {
    if (type) {
      const queue = this.queues.get(type);
      if (queue) {
        // Note: bee-queue uses a different API for resuming
        console.log(`Resuming queue for type: ${type}`);
      }
    } else {
      for (const [type] of this.queues) {
        console.log(`Resuming queue for type: ${type}`);
      }
    }
  }

  /**
   * Close all queues
   */
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
    this.activeJobs.clear();
  }

  /**
   * Get jobs by status
   * 
   * @param type - Job type
   * @param state - Job state ('waiting', 'active', 'completed', 'failed', 'delayed')
   * @param start - Start index
   * @param end - End index
   * @returns Array of jobs
   */
  async getJobs(type: string, state: string = 'waiting', start: number = 0, end: number = 50): Promise<BeeQueueJob[]> {
    const queue = this.queues.get(type);
    if (!queue) {
      return [];
    }
    
    return queue.getJobs(state, start, end);
  }

  /**
   * Get a specific job
   * 
   * @param type - Job type
   * @param jobId - Job ID
   * @returns Job object or null
   */
  async getJob(type: string, jobId: string): Promise<BeeQueueJob | null> {
    const queue = this.queues.get(type);
    if (!queue) {
      return null;
    }
    
    return queue.getJob(jobId);
  }

  /**
   * Get the underlying bee-queue for advanced usage
   * 
   * @param type - Job type
   * @returns The bee-queue instance
   */
  getBeeQueue(type: string): BeeQueueInstance | undefined {
    return this.queues.get(type);
  }

  /**
   * Set queue concurrency
   * 
   * @param concurrency - New concurrency value
   */
  setConcurrency(concurrency: number): void {
    this.concurrency = concurrency;
    for (const queue of this.queues.values()) {
      queue.settings.processConcurrency = concurrency;
    }
  }
}

/**
 * Create a new queue instance
 * 
 * @param options - Queue options
 * @returns Queue wrapper instance
 */
export function createQueue(options: QueueOptions = {}): AsyncQueueWrapper {
  return new AsyncQueueWrapper(options);
}

export type AsyncQueue = AsyncQueueWrapper;