import BeeQueue from 'bee-queue';
import { EventEmitter } from 'events';
import {
  DEFAULT_REDIS_HOST,
  DEFAULT_REDIS_PORT,
  DEFAULT_QUEUE_PREFIX,
} from '../../config/localVars.js';
// Simplified wrapper that doesn't try to enforce strict typing on bee-queue
export class AsyncQueueWrapper extends EventEmitter {
  constructor(options = {}) {
    super();
    this.queues = new Map();
    this.processors = new Map();
    this.activeJobs = new Set();
    this.concurrency = options.concurrency || 5;
    this.queues = new Map();
    this.processors = new Map();
    this.activeJobs = new Set();
    this.beeOptions = {
      redis: options.redis || {
        host: DEFAULT_REDIS_HOST,
        port: DEFAULT_REDIS_PORT,
      },
      prefix: options.prefix || DEFAULT_QUEUE_PREFIX,
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
  processor(type, processor) {
    this.processors.set(type, processor);
  }
  getQueue(state = 'default') {
    if (!this.queues.has(state)) {
      const queue = new BeeQueue(`qmemory-${state}`, this.beeOptions);
      // Set up error handling
      queue.on('error', error => {
        console.error(`Queue error for ${state}:`, error);
        this.emit('error', error);
      });
      queue.on('failed', (job, error) => {
        console.error(`Job failed for ${state}:`, error);
        this.emit('failed', { job, error });
      });
      // Process jobs using our registered processors
      queue.process(async job => {
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
  async createJob(data, options = {}) {
    const queue = this.getQueue(data.type || 'default');
    return queue.createJob(data, options);
  }
  async addJob(data, options = {}) {
    const job = await this.createJob(data, options);
    return await job.save();
  }
  async getJobs(start = 0, end = 25, state) {
    const queue = this.getQueue(state || 'default');
    return queue.getJobs(start, end);
  }
  async getJob(jobId) {
    for (const [name, queue] of this.queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }
    return null;
  }
  async close() {
    const promises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(promises);
    this.queues.clear();
    this.activeJobs.clear();
  }
  getActiveJobsCount() {
    return this.activeJobs.size;
  }
  /**
   * Get queue statistics
   */
  async getStats() {
    const allJobs = await this.getJobs();
    const waitingJobs = allJobs.filter(job => job.data.status === 'waiting');
    const activeJobs = allJobs.filter(job => job.data.status === 'active');
    const stats = {
      pending: waitingJobs.length,
      active: activeJobs.length,
      concurrency: this.concurrency,
      queues: {},
    };
    return stats;
  }
  /**
   * Static factory method
   */
  static createQueue(options = {}) {
    return new AsyncQueueWrapper(options);
  }
}
// Export factory function for easier usage
export const createQueue = AsyncQueueWrapper.createQueue;
