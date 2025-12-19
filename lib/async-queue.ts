import BeeQueue from 'bee-queue';
import { EventEmitter } from 'events';

type BeeQueueJob<T extends JobData> = BeeQueue.Job<T> & {
  jobType?: string;
};

type BeeQueueInstance<T extends JobData> = BeeQueue<T> & {
  getJobs(start?: number, end?: number): Promise<BeeQueueJob<T>[]>;
};

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
  type?: string;
  status?: string;
}

export interface JobOptions {
  jobId?: string | number;
  retries?: number;
  backoffStrategy?: { strategy: string; delayFactor?: number };
  delayUntil?: number | Date;
  timeout?: number;
}

export interface QueueStats {
  pending: number;
  active: number;
  concurrency: number;
  queues: Record<string, unknown>;
}

type JobProcessorResult = Promise<unknown> | Array<Promise<unknown>>;
type JobProcessor = (job: BeeQueueJob<JobData>) => JobProcessorResult;

export class AsyncQueueWrapper extends EventEmitter {
  private readonly queues: Map<string, BeeQueueInstance<JobData>> = new Map();
  private readonly processors: Map<string, JobProcessor> = new Map();
  private readonly activeJobs: Set<string> = new Set();
  public readonly concurrency: number;
  private readonly beeOptions: BeeQueue.QueueSettings & {
    redis?: RedisOptions;
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
    settings: QueueSettings;
  };

  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency ?? 5;

    this.beeOptions = {
      redis: options.redis ?? {
        host: 'localhost',
        port: 6379,
      },
      prefix: options.prefix ?? 'qmemory',
      stallInterval: options.stallInterval ?? 5000,
      nearActivatedWindow: options.nearActivatedWindow ?? 30 * 60 * 1000,
      delayedDebounce: options.delayedDebounce ?? 1000,
      maxDelayed: options.maxDelayed ?? 10000,
      removeOnSuccess: options.removeOnSuccess ?? true,
      removeOnFailure: options.removeOnFailure ?? true,
      redisScanCount: options.redisScanCount ?? 100,
      getEvents: options.getEvents ?? true,
      sendEvents: options.sendEvents ?? true,
      storeJobs: options.storeJobs ?? true,
      ensureScripts: options.ensureScripts ?? true,
      activateDelayedJobs: options.activateDelayedJobs ?? true,
      isWorker: options.isWorker ?? true,
      catchExceptions: options.catchExceptions ?? true,
      settings: {
        stalledInterval: options.settings?.stalledInterval ?? 30000,
        maxStalledCount: options.settings?.maxStalledCount ?? 1,
        visibility: options.settings?.visibility ?? 30,
        processConcurrency: options.settings?.processConcurrency,
      },
    };
  }

  processor(type: string, processor: JobProcessor): void {
    this.processors.set(type, processor);
  }

  private getQueue(state: string = 'default'): BeeQueueInstance<JobData> {
    if (!this.queues.has(state)) {
      const queue = new BeeQueue<JobData>(
        `qmemory-${state}`,
        this.beeOptions
      ) as BeeQueueInstance<JobData>;

      queue.on('error', (error: Error) => {
        console.error(`Queue error for ${state}:`, error);
        this.emit('error', error);
      });

      queue.on('failed', (job: BeeQueueJob<JobData>, error: Error) => {
        console.error(`Job failed for ${state}:`, error);
        this.activeJobs.delete(String(job.id));
        this.emit('failed', { job, error });
      });

      queue.on('succeeded', (job: BeeQueueJob<JobData>) => {
        this.activeJobs.delete(String(job.id));
      });

      queue.process(this.concurrency, async (job: BeeQueueJob<JobData>) => {
        const jobType = typeof job.data?.type === 'string' ? job.data.type : 'default';
        const processor = this.processors.get(jobType);
        if (!processor) {
          throw new Error(`No processor registered for job type: ${jobType}`);
        }

        this.activeJobs.add(String(job.id));

        const result = await processor(job);
        if (Array.isArray(result)) {
          const resolved = await Promise.all(result);
          return resolved.length > 0 ? resolved[0] : null;
        }

        return result ?? null;
      });

      this.queues.set(state, queue);
    }

    return this.queues.get(state)!;
  }

  async createJob(data: JobData, options: JobOptions = {}): Promise<BeeQueueJob<JobData>> {
    const queue = this.getQueue(data.type ?? 'default');
    const job = queue.createJob(data);

    if (options.jobId !== undefined) {
      job.setId(String(options.jobId));
    }
    if (typeof options.retries === 'number') {
      job.retries(options.retries);
    }
    if (options.backoffStrategy) {
      job.backoff(options.backoffStrategy.strategy, options.backoffStrategy.delayFactor);
    }
    if (options.delayUntil !== undefined) {
      job.delayUntil(options.delayUntil);
    }
    if (options.timeout !== undefined) {
      job.timeout(options.timeout);
    }

    return job;
  }

  async addJob(data: JobData, options: JobOptions = {}): Promise<BeeQueueJob<JobData>> {
    const job = await this.createJob(data, options);
    return job.save();
  }

  async getJobs(
    start: number = 0,
    end: number = 25,
    state?: string
  ): Promise<BeeQueueJob<JobData>[]> {
    const queue = this.getQueue(state ?? 'default');
    return queue.getJobs(start, end);
  }

  async getJob(jobId: string): Promise<BeeQueueJob<JobData> | null> {
    for (const [, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }
    return null;
  }

  async close(): Promise<void> {
    const closing = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closing);
    this.queues.clear();
    this.processors.clear();
    this.activeJobs.clear();
  }

  getActiveJobsCount(): number {
    return this.activeJobs.size;
  }

  async getStats(): Promise<QueueStats> {
    const allJobs = await this.getJobs();
    const waitingJobs = allJobs.filter(job => job.data.status === 'waiting');
    const activeJobs = allJobs.filter(job => job.data.status === 'active');

    return {
      pending: waitingJobs.length,
      active: activeJobs.length,
      concurrency: this.concurrency,
      queues: {},
    };
  }

  public static createQueue(options: QueueOptions = {}): AsyncQueueWrapper {
    return new AsyncQueueWrapper(options);
  }
}

export const createQueue = AsyncQueueWrapper.createQueue;

export type AsyncQueue = AsyncQueueWrapper;
