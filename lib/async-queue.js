/**
 * Async Queue Wrapper using bee-queue
 * Advanced async job processing with Redis persistence
 * 
 * This module provides a wrapper around the bee-queue package
 * to maintain backward compatibility with the existing API while
 * leveraging the superior features of the Redis-backed queue system.
 * 
 * Features:
 * - Redis persistence for job durability
 * - Job retries and delays
 * - Advanced job scheduling
 * - Web UI support
 * - Graceful shutdown handling
 * - Job events and metrics
 */

const BeeQueue = require('bee-queue');
const EventEmitter = require('events');

class AsyncQueueWrapper extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    
    // bee-queue specific options
    const beeOptions = {
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
        stalledInterval: options.stalledInterval || 30000,
        maxStalledCount: options.maxStalledCount || 1,
        visibility: options.visibility || 30
      }
    };
    
    this.queues = new Map();
    this.processors = new Map();
    this.beeOptions = beeOptions;
    
    // Queue for backward compatibility stats
    this.activeJobs = new Set();
  }

  /**
   * Register a processor for a job type
   * 
   * @param {string} type - Job type
   * @param {Function} processor - Processing function
   */
  processor(type, processor) {
    this.processors.set(type, processor);
    
    // Get or create queue for this job type
    if (!this.queues.has(type)) {
      const queue = new BeeQueue(type, {
        ...this.beeOptions,
        settings: {
          ...this.beeOptions.settings,
          activateDelayedJobs: true,
          processConcurrency: this.concurrency
        }
      });
      
      // Set up the processor
      queue.process(async (job) => {
        this.activeJobs.add(job.id);
        this.emit('started', { type, job: job.id });
        
        try {
          const result = await processor(job.data);
          this.activeJobs.delete(job.id);
          this.emit('completed', { type, result, job: job.id });
          return result;
        } catch (error) {
          this.activeJobs.delete(job.id);
          this.emit('failed', { type, error, job: job.id });
          throw error;
        }
      });
      
      // Set up event listeners
      queue.on('succeeded', (job, result) => {
        this.emit('completed', { type, result, job: job.id });
      });
      
      queue.on('failed', (job, err) => {
        this.emit('failed', { type, error: err, job: job.id });
      });
      
      queue.on('stalled', (job) => {
        this.emit('stalled', { type, job: job.id });
      });
      
      this.queues.set(type, queue);
    }
  }

  /**
   * Add a job to queue
   * 
   * @param {string} type - Job type
   * @param {*} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise} Job result
   */
  async add(type, data, options = {}) {
    const queue = this.queues.get(type);
    if (!queue) {
      // Create queue on the fly for backward compatibility
      this.processor(type, async () => {
        throw new Error(`No processor for job type: ${type}`);
      });
      return this.add(type, data, options);
    }
    
    const jobOptions = {
      delayUntil: options.delay,
      retries: options.retries || 3,
      backoff: options.backoff || 'exponential',
      removeOnComplete: options.removeOnComplete !== false,
      removeOnFail: options.removeOnFail !== false,
      ...options
    };
    
    const job = queue.createJob(data, jobOptions);
    const result = await job.save();
    
    // For backward compatibility, we return a promise that resolves when the job completes
    if (options.waitForResult !== false) {
      return new Promise((resolve, reject) => {
        job.on('succeeded', (result) => resolve(result));
        job.on('failed', (err) => reject(err));
      });
    }
    
    return result;
  }

  /**
   * Schedule a delayed job
   * 
   * @param {string} type - Job type
   * @param {*} data - Job data
   * @param {number} delay - Delay in milliseconds
   * @returns {Promise} Job result
   */
  async schedule(type, data, delay) {
    return this.add(type, data, { delay, waitForResult: true });
  }

  /**
   * Get queue statistics
   * 
   * @returns {Object} Queue stats
   */
  getStats() {
    const stats = {
      pending: 0,
      active: this.activeJobs.size,
      concurrency: this.concurrency,
      queues: {}
    };
    
    // Aggregate stats from all queues
    for (const [type, queue] of this.queues) {
      // Get queue-specific stats
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
   * @param {string} type - Job type to pause (optional)
   */
  async pause(type) {
    if (type) {
      const queue = this.queues.get(type);
      if (queue) {
        await queue.pause();
      }
    } else {
      // Pause all queues
      for (const queue of this.queues.values()) {
        await queue.pause();
      }
    }
  }

  /**
   * Resume job processing
   * 
   * @param {string} type - Job type to resume (optional)
   */
  async resume(type) {
    if (type) {
      const queue = this.queues.get(type);
      if (queue) {
        await queue.resume();
      }
    } else {
      // Resume all queues
      for (const queue of this.queues.values()) {
        await queue.resume();
      }
    }
  }

  /**
   * Close all queues
   */
  async close() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    this.queues.clear();
    this.activeJobs.clear();
  }

  /**
   * Get jobs by status
   * 
   * @param {string} type - Job type
   * @param {string} state - Job state ('waiting', 'active', 'completed', 'failed', 'delayed')
   * @param {number} start - Start index
   * @param {number} end - End index
   * @returns {Array} Array of jobs
   */
  async getJobs(type, state = 'waiting', start = 0, end = 50) {
    const queue = this.queues.get(type);
    if (!queue) {
      return [];
    }
    
    return queue.getJobs(state, start, end);
  }

  /**
   * Get a specific job
   * 
   * @param {string} type - Job type
   * @param {string} jobId - Job ID
   * @returns {Object|null} Job object or null
   */
  async getJob(type, jobId) {
    const queue = this.queues.get(type);
    if (!queue) {
      return null;
    }
    
    return queue.getJob(jobId);
  }

  /**
   * Get the underlying bee-queue for advanced usage
   * 
   * @param {string} type - Job type
   * @returns {BeeQueue} The bee-queue instance
   */
  getBeeQueue(type) {
    return this.queues.get(type);
  }

  /**
   * Set queue concurrency
   * 
   * @param {number} concurrency - New concurrency value
   */
  setConcurrency(concurrency) {
    this.concurrency = concurrency;
    for (const queue of this.queues.values()) {
      queue.settings.processConcurrency = concurrency;
    }
  }
}

/**
 * Create a new queue instance
 * 
 * @param {Object} options - Queue options
 * @returns {AsyncQueueWrapper} Queue wrapper instance
 */
function createQueue(options = {}) {
  return new AsyncQueueWrapper(options);
}

// Export the wrapper class and factory function
module.exports = {
  AsyncQueue: AsyncQueueWrapper,
  createQueue
};