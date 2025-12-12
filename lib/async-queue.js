/**
 * Simple Async Queue
 * Basic async job processing using Node.js built-in EventEmitter
 * 
 * This provides a simplified queue implementation that can be replaced
 * with more sophisticated npm queue packages if needed.
 */

const { EventEmitter } = require('events');

class AsyncQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    this.queue = [];
    this.active = 0;
    this.processors = new Map();
  }

  /**
   * Register a processor for a job type
   * 
   * @param {string} type - Job type
   * @param {Function} processor - Processing function
   */
  processor(type, processor) {
    this.processors.set(type, processor);
  }

  /**
   * Add a job to the queue
   * 
   * @param {string} type - Job type
   * @param {*} data - Job data
   * @returns {Promise} Job result
   */
  async add(type, data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ type, data, resolve, reject });
      this.process();
    });
  }

  /**
   * Process jobs from the queue
   */
  async process() {
    if (this.active >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.active++;
    const job = this.queue.shift();
    
    try {
      const processor = this.processors.get(job.type);
      if (!processor) {
        throw new Error(`No processor for job type: ${job.type}`);
      }
      
      const result = await processor(job.data);
      job.resolve(result);
      this.emit('completed', { type: job.type, result });
    } catch (error) {
      job.reject(error);
      this.emit('failed', { type: job.type, error });
    } finally {
      this.active--;
      // Process next job
      setImmediate(() => this.process());
    }
  }

  /**
   * Get queue statistics
   * 
   * @returns {Object} Queue stats
   */
  getStats() {
    return {
      pending: this.queue.length,
      active: this.active,
      concurrency: this.concurrency
    };
  }
}

/**
 * Create a new queue instance
 * 
 * @param {Object} options - Queue options
 * @returns {AsyncQueue} Queue instance
 */
function createQueue(options = {}) {
  return new AsyncQueue(options);
}

module.exports = {
  AsyncQueue,
  createQueue
};
