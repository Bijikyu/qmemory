/**
 * Advanced Async Queue System
 * Production-ready background job processing with priority, delays, retries, and bounded memory
 * 
 * Features:
 * - Priority-based job processing
 * - Delayed job execution
 * - Automatic retries with exponential backoff
 * - Bounded memory usage to prevent leaks
 * - EventEmitter pattern for real-time monitoring
 * - Configurable concurrency limits
 * - Comprehensive statistics tracking
 * - Health status monitoring
 * - Graceful shutdown capabilities
 * 
 * Use cases:
 * - Moving I/O operations out of request paths
 * - Background job processing
 * - Rate-limited API calls
 * - Email/notification queues
 * - Data processing pipelines
 */

const { EventEmitter } = require('events');

class AsyncQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxConcurrency: options.maxConcurrency ?? 5,
      maxQueueSize: options.maxQueueSize ?? 1000,
      defaultTimeout: options.defaultTimeout ?? 30000,
      retryDelay: options.retryDelay ?? 5000,
      maxRetries: options.maxRetries ?? 3,
      enablePriority: options.enablePriority ?? true,
      enableDelay: options.enableDelay ?? true,
      maxJobHistory: options.maxJobHistory ?? 1000,
      processingInterval: options.processingInterval ?? 1000
    };
    
    this.pendingJobs = [];
    this.activeJobs = new Map();
    this.completedJobs = new Set();
    this.failedJobs = new Set();
    this.processors = new Map();
    this.processingInterval = null;
    this.isPaused = false;
    
    this.stats = {
      totalJobs: 0,
      pendingJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      averageProcessingTime: 0,
      queueUtilization: 0
    };
    
    this.startProcessing();
  }

  /**
   * Register a processor for a specific job type
   * 
   * @param {string} jobType - Type of job to process
   * @param {Function} processor - Async function to process job
   */
  registerProcessor(jobType, processor) {
    if (typeof processor !== 'function') {
      throw new Error('Processor must be a function');
    }
    this.processors.set(jobType, processor);
    console.log(`[asyncQueue] Registered processor for job type: ${jobType}`);
  }

  /**
   * Add a job to the queue
   * 
   * @param {string} type - Job type
   * @param {*} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise} Resolves when job completes
   */
  addJob(type, data, options = {}) {
    return new Promise((resolve, reject) => {
      if (this.pendingJobs.length >= this.options.maxQueueSize) {
        reject(new Error('Queue is full'));
        return;
      }
      
      const job = {
        id: this.generateJobId(),
        type,
        data,
        priority: options.priority ?? 0,
        attempts: 0,
        maxAttempts: options.maxRetries ?? this.options.maxRetries,
        delay: options.delay ?? 0,
        createdAt: Date.now(),
        scheduledAt: Date.now() + (options.delay ?? 0),
        timeout: options.timeout ?? this.options.defaultTimeout,
        resolve,
        reject
      };
      
      this.pendingJobs.push(job);
      this.stats.totalJobs++;
      this.stats.pendingJobs++;
      this.updateUtilization();
      
      this.emit('jobAdded', { id: job.id, type: job.type, priority: job.priority });
      console.log(`[asyncQueue] Job added: ${job.id} (${type})`);
    });
  }

  /**
   * Start the queue processing loop
   */
  startProcessing() {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(() => {
      if (!this.isPaused) {
        this.processQueue();
      }
    }, this.options.processingInterval);
    
    console.log('[asyncQueue] Queue processing started');
  }

  /**
   * Process jobs in the queue
   */
  async processQueue() {
    if (this.activeJobs.size >= this.options.maxConcurrency) {
      return;
    }
    
    const now = Date.now();
    const availableSlots = this.options.maxConcurrency - this.activeJobs.size;
    const jobsToProcess = [];
    
    let i = 0;
    while (i < this.pendingJobs.length && jobsToProcess.length < availableSlots) {
      const job = this.pendingJobs[i];
      
      if (job.scheduledAt <= now) {
        jobsToProcess.push(job);
        const lastIndex = this.pendingJobs.length - 1;
        this.pendingJobs[i] = this.pendingJobs[lastIndex];
        this.pendingJobs.pop();
        this.stats.pendingJobs--;
      } else {
        i++;
      }
    }
    
    if (this.options.enablePriority) {
      jobsToProcess.sort((a, b) => b.priority - a.priority);
    }
    
    for (const job of jobsToProcess) {
      this.processJob(job);
    }
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    const processor = this.processors.get(job.type);
    
    if (!processor) {
      this.failJob(job, new Error(`No processor registered for job type: ${job.type}`));
      return;
    }
    
    this.activeJobs.set(job.id, job);
    this.stats.activeJobs++;
    job.attempts++;
    
    const startTime = Date.now();
    this.emit('jobStarted', { id: job.id, type: job.type, attempt: job.attempts });
    
    const timeoutHandle = setTimeout(() => {
      this.failJob(job, new Error(`Job timeout after ${job.timeout}ms`));
    }, job.timeout);
    
    try {
      const result = await processor(job);
      clearTimeout(timeoutHandle);
      
      const processingTime = Date.now() - startTime;
      this.updateProcessingTimeStats(processingTime);
      
      this.completeJob(job, result);
    } catch (error) {
      clearTimeout(timeoutHandle);
      this.handleJobFailure(job, error);
    }
  }

  /**
   * Complete a job successfully
   */
  completeJob(job, result) {
    this.activeJobs.delete(job.id);
    
    this.completedJobs.add(job.id);
    if (this.completedJobs.size > this.options.maxJobHistory) {
      const oldest = this.completedJobs.values().next().value;
      if (oldest) this.completedJobs.delete(oldest);
    }
    
    this.stats.activeJobs--;
    this.stats.completedJobs++;
    this.updateUtilization();
    
    job.resolve(result);
    this.emit('jobCompleted', { id: job.id, type: job.type, result });
    
    console.log(`[asyncQueue] Job completed: ${job.id} (${job.type})`);
  }

  /**
   * Handle job failure
   */
  handleJobFailure(job, error) {
    if (job.attempts >= job.maxAttempts) {
      this.failJob(job, error);
    } else {
      this.retryJob(job, error);
    }
  }

  /**
   * Fail a job permanently
   */
  failJob(job, error) {
    this.activeJobs.delete(job.id);
    
    this.failedJobs.add(job.id);
    if (this.failedJobs.size > this.options.maxJobHistory) {
      const oldest = this.failedJobs.values().next().value;
      if (oldest) this.failedJobs.delete(oldest);
    }
    
    this.stats.activeJobs--;
    this.stats.failedJobs++;
    this.updateUtilization();
    
    job.reject(error);
    this.emit('jobFailed', { id: job.id, type: job.type, error: error.message });
    
    console.error(`[asyncQueue] Job failed: ${job.id} (${job.type}) - ${error.message}`);
  }

  /**
   * Retry a job with exponential backoff
   */
  retryJob(job, error) {
    this.activeJobs.delete(job.id);
    this.stats.activeJobs--;
    
    const retryDelay = this.options.retryDelay * Math.pow(2, job.attempts - 1);
    job.scheduledAt = Date.now() + retryDelay;
    
    this.pendingJobs.push(job);
    this.stats.pendingJobs++;
    this.updateUtilization();
    
    this.emit('jobRetry', { id: job.id, type: job.type, attempt: job.attempts, nextAttempt: job.attempts + 1 });
    
    console.warn(`[asyncQueue] Job retry scheduled: ${job.id} (${job.type}) - attempt ${job.attempts + 1} in ${retryDelay}ms`);
  }

  /**
   * Update processing time statistics (exponential moving average)
   */
  updateProcessingTimeStats(processingTime) {
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * 0.9) + (processingTime * 0.1);
  }

  /**
   * Update queue utilization
   */
  updateUtilization() {
    this.stats.queueUtilization = (this.pendingJobs.length / this.options.maxQueueSize) * 100;
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get current queue statistics
   * 
   * @returns {Object} Queue statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get queue health status
   * 
   * @returns {Object} Health status with issues
   */
  getHealthStatus() {
    const stats = this.getStats();
    const issues = [];
    let status = 'healthy';
    
    if (stats.queueUtilization > 80) {
      status = 'critical';
      issues.push(`High queue utilization: ${stats.queueUtilization.toFixed(1)}%`);
    } else if (stats.queueUtilization > 60) {
      status = 'warning';
      issues.push(`Elevated queue utilization: ${stats.queueUtilization.toFixed(1)}%`);
    }
    
    const totalProcessed = stats.completedJobs + stats.failedJobs;
    if (totalProcessed > 0) {
      const failureRate = (stats.failedJobs / totalProcessed) * 100;
      if (failureRate > 20) {
        status = 'critical';
        issues.push(`High failure rate: ${failureRate.toFixed(1)}%`);
      } else if (failureRate > 10) {
        if (status !== 'critical') status = 'warning';
        issues.push(`Elevated failure rate: ${failureRate.toFixed(1)}%`);
      }
    }
    
    if (stats.averageProcessingTime > 30000) {
      status = 'critical';
      issues.push(`Very high average processing time: ${stats.averageProcessingTime.toFixed(0)}ms`);
    } else if (stats.averageProcessingTime > 10000) {
      if (status !== 'critical') status = 'warning';
      issues.push(`High average processing time: ${stats.averageProcessingTime.toFixed(0)}ms`);
    }
    
    return { status, stats, issues };
  }

  /**
   * Get pending job count by type
   * 
   * @returns {Object} Count by job type
   */
  getPendingByType() {
    const counts = {};
    for (const job of this.pendingJobs) {
      counts[job.type] = (counts[job.type] || 0) + 1;
    }
    return counts;
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.isPaused = true;
    console.log('[asyncQueue] Queue processing paused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.isPaused = false;
    console.log('[asyncQueue] Queue processing resumed');
  }

  /**
   * Clear all pending jobs
   * 
   * @returns {number} Number of jobs cleared
   */
  clearPendingJobs() {
    const count = this.pendingJobs.length;
    
    for (const job of this.pendingJobs) {
      job.reject(new Error('Job cleared from queue'));
    }
    
    this.pendingJobs = [];
    this.stats.pendingJobs = 0;
    this.updateUtilization();
    
    console.log(`[asyncQueue] Cleared ${count} pending jobs`);
    return count;
  }

  /**
   * Get job by ID
   * 
   * @param {string} jobId - Job ID
   * @returns {Object|null} Job or null
   */
  getJob(jobId) {
    const active = this.activeJobs.get(jobId);
    if (active) return { ...active, status: 'active' };
    
    const pending = this.pendingJobs.find(j => j.id === jobId);
    if (pending) return { ...pending, status: 'pending' };
    
    if (this.completedJobs.has(jobId)) return { id: jobId, status: 'completed' };
    if (this.failedJobs.has(jobId)) return { id: jobId, status: 'failed' };
    
    return null;
  }

  /**
   * Graceful shutdown
   * 
   * @param {number} maxWaitTime - Maximum time to wait for active jobs
   * @returns {Promise<void>}
   */
  async shutdown(maxWaitTime = 30000) {
    console.log('[asyncQueue] Initiating graceful shutdown...');
    
    this.pause();
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    const startTime = Date.now();
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    for (const job of this.activeJobs.values()) {
      job.reject(new Error('Queue shutdown - job cancelled'));
    }
    this.activeJobs.clear();
    
    for (const job of this.pendingJobs) {
      job.reject(new Error('Queue shutdown - job cancelled'));
    }
    this.pendingJobs = [];
    
    this.processors.clear();
    this.completedJobs.clear();
    this.failedJobs.clear();
    
    this.removeAllListeners();
    
    console.log('[asyncQueue] Queue shutdown complete');
  }
}

/**
 * Create a new async queue
 * 
 * @param {Object} options - Queue options
 * @returns {AsyncQueue} New queue instance
 */
function createAsyncQueue(options = {}) {
  return new AsyncQueue(options);
}

let defaultQueue = null;

/**
 * Get or create the default async queue
 * 
 * @param {Object} options - Queue options (only used on first call)
 * @returns {AsyncQueue} Default queue instance
 */
function getDefaultQueue(options = {}) {
  if (!defaultQueue) {
    defaultQueue = new AsyncQueue({
      maxConcurrency: 3,
      maxQueueSize: 500,
      defaultTimeout: 15000,
      retryDelay: 2000,
      maxRetries: 2,
      ...options
    });
  }
  return defaultQueue;
}

/**
 * Shutdown the default queue
 * 
 * @returns {Promise<void>}
 */
async function shutdownDefaultQueue() {
  if (defaultQueue) {
    await defaultQueue.shutdown();
    defaultQueue = null;
  }
}

/**
 * Simple async task runner with queue
 * 
 * @param {Function} task - Async task function
 * @param {Object} options - Task options
 * @returns {Promise} Task result
 */
async function queueTask(task, options = {}) {
  const queue = getDefaultQueue();
  const taskId = `task_${Date.now()}`;
  
  if (!queue.processors.has('__default__')) {
    queue.registerProcessor('__default__', async (job) => {
      return await job.data.task();
    });
  }
  
  return queue.addJob('__default__', { task }, options);
}

module.exports = {
  AsyncQueue,
  createAsyncQueue,
  getDefaultQueue,
  shutdownDefaultQueue,
  queueTask
};
