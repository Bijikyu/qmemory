import { EventEmitter } from 'events';

import {
  AsyncQueueWrapper,
  createQueue,
  type JobData,
} from '../../lib/async-queue.js';

type ProcessHandler = (job: FakeJob) => Promise<unknown>;

class FakeJob extends EventEmitter {
  public id: string;
  public progress = 0;
  public status: string;
  public options: Record<string, unknown> = {};
  public readonly data: JobData;
  public queue!: FakeBeeQueue;

  constructor(data: JobData) {
    super();
    this.data = data;
    this.status = data.status ?? 'waiting';
    this.id = `job-${FakeJob.sequence++}`;
  }

  setId(id: string): this {
    this.id = String(id);
    return this;
  }

  retries(count: number): this {
    this.options.retries = count;
    return this;
  }

  backoff(strategy: string, delayFactor?: number): this {
    this.options.backoff = { strategy, delayFactor };
    return this;
  }

  delayUntil(timestamp: number | Date): this {
    this.options.delayUntil = timestamp;
    return this;
  }

  timeout(milliseconds: number): this {
    this.options.timeout = milliseconds;
    return this;
  }

  async save(): Promise<this> {
    this.queue.jobs.push(this);
    return this;
  }

  static sequence = 0;
}

class FakeBeeQueue extends EventEmitter {
  public static instances: FakeBeeQueue[] = [];
  public readonly jobs: FakeJob[] = [];
  public handler?: ProcessHandler;
  public readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
    FakeBeeQueue.instances.push(this);
  }

  process(concurrencyOrHandler: number | ProcessHandler, handler?: ProcessHandler): void {
    if (typeof concurrencyOrHandler === 'function') {
      this.handler = concurrencyOrHandler;
    } else if (handler) {
      this.handler = handler;
    }
  }

  createJob(data: JobData): FakeJob {
    const job = new FakeJob(data);
    job.queue = this;
    return job;
  }

  async getJobs(start?: number, end?: number): Promise<FakeJob[]> {
    if (start === undefined) {
      return [...this.jobs];
    }
    if (end === undefined) {
      return this.jobs.slice(start);
    }
    return this.jobs.slice(start, end + 1);
  }

  async getJob(jobId: string): Promise<FakeJob | null> {
    return this.jobs.find((job) => job.id === jobId) ?? null;
  }

  async close(): Promise<void> {
    this.jobs.length = 0;
  }
}

jest.mock('bee-queue', () => ({
  __esModule: true,
  default: FakeBeeQueue,
}));

describe('async-queue wrapper', () => {
  afterEach(() => {
    FakeBeeQueue.instances.length = 0;
    FakeJob.sequence = 0;
    jest.clearAllMocks();
  });

  test('createJob applies job options and returns queue job', async () => {
    const queue = new AsyncQueueWrapper({ concurrency: 2 });
    queue.processor('default', async () => null);

    const job = await queue.createJob(
      { type: 'default', status: 'waiting' },
      {
        jobId: 'custom-id',
        retries: 3,
        backoffStrategy: { strategy: 'fixed', delayFactor: 500 },
        delayUntil: 12345,
        timeout: 2000,
      },
    );

    expect(job.id).toBe('custom-id');
    expect(job.options.retries).toBe(3);
    expect(job.options.backoff).toEqual({ strategy: 'fixed', delayFactor: 500 });
    expect(job.options.delayUntil).toBe(12345);
    expect(job.options.timeout).toBe(2000);
  });

  test('addJob saves job to queue and updates statistics', async () => {
    const queue = createQueue({ concurrency: 1 });
    queue.processor('default', async () => null);

    const job = await queue.addJob({ type: 'default', status: 'waiting' });
    expect(job.save).toBeDefined();
    expect(FakeBeeQueue.instances[0].jobs).toHaveLength(1);

    const stats = await queue.getStats();
    expect(stats.pending).toBeGreaterThanOrEqual(1);
  });

  test('processor executes handler and clears active jobs', async () => {
    const queue = new AsyncQueueWrapper();
    const handler = jest.fn(async () => 'processed');
    queue.processor('default', handler);

    const job = await queue.addJob({ type: 'default', status: 'active' });
    const instance = FakeBeeQueue.instances[0];

    expect(instance.handler).toBeDefined();
    const result = await instance.handler?.(job);
    expect(result).toBe('processed');
    expect(handler).toHaveBeenCalled();
    expect(queue.getActiveJobsCount()).toBe(0);
  });
});
