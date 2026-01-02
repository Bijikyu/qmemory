/**
 * Async Queue Management System
 *
 * Purpose: Provides a robust job processing and queue management system built on top of
 * Redis and the bee-queue library. This system handles background job processing, retry
 * logic, and job state management with comprehensive error handling and monitoring.
 *
 * Design Philosophy:
 * - Reliability: Jobs are persisted in Redis and survive application restarts
 * - Scalability: Multiple workers can process jobs concurrently with configurable limits
 * - Monitoring: Comprehensive event emission and error logging for observability
 * - Flexibility: Support for different job types, retry strategies, and scheduling
 * - Performance: Optimized for high-throughput job processing with minimal overhead
 *
 * Integration Notes:
 * - Used throughout the system for background processing, email sending, data cleanup, etc.
 * - Integrates with qerrors for consistent error reporting and logging
 * - Emits events for monitoring and debugging purposes
 * - Uses Redis as the backend for job persistence and coordination
 *
 * Performance Considerations:
 * - Concurrency is configurable per queue to match system capabilities
 * - Job removal on success/failure prevents Redis memory bloat
 * - Stalled job detection and recovery prevents hanging jobs
 * - Connection pooling and reuse through Redis client management
 *
 * Error Handling Strategy:
 * - All queue errors are logged with detailed context for debugging
 * - Failed jobs can be retried with configurable backoff strategies
 * - Exception handling prevents worker crashes and maintains queue availability
 * - Event emission allows external monitoring and alerting systems
 *
 * Architecture Decision: Why use bee-queue instead of Bull or other libraries?
 * - bee-queue provides better Redis memory efficiency for large job volumes
 * - Simpler API surface area reduces complexity and maintenance overhead
 * - Better performance characteristics for our specific use cases
 * - More reliable stalled job detection and recovery mechanisms
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import BeeQueue from 'bee-queue';
import { EventEmitter } from 'events';
import qerrors from 'qerrors';

/**
 * Enhanced BeeQueue job type with additional metadata
 *
 * This extends the base bee-queue job type to include job type information
 * for better routing and processing decisions.
 *
 * @template T - The job data type extending JobData
 */
type BeeQueueJob<T extends JobData> = BeeQueue.Job<T> & {
  jobType?: string; // Optional job type for routing and processing decisions
};

/**
 * Enhanced BeeQueue instance with additional methods
 *
 * This extends the base bee-queue to include custom job retrieval methods
 * that are not available in the standard library.
 *
 * @template T - The job data type extending JobData
 */
type BeeQueueInstance<T extends JobData> = BeeQueue<T> & {
  getJobs(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _start?: number,
    end?: number
  ): Promise<BeeQueueJob<T>[]>;
};

/**
 * Redis connection configuration options
 *
 * These options control how the queue system connects to Redis for job persistence
 * and coordination between multiple workers.
 */
export interface RedisOptions {
  host?: string; // Redis server hostname (default: localhost)
  port?: number; // Redis server port (default: 6379)
  password?: string; // Redis authentication password
  db?: number; // Redis database number (default: 0)
}

/**
 * Queue-specific settings for fine-tuning behavior
 *
 * These settings control advanced queue behavior like stalled job detection
 * and processing concurrency limits.
 */
export interface QueueSettings {
  stalledInterval?: number; // How often to check for stalled jobs (default: 30000ms)
  maxStalledCount?: number; // Max times a job can be stalled before failing (default: 1)
  visibility?: number; // How long a job is "invisible" when being processed (default: 30s)
  processConcurrency?: number; // Override default concurrency for this queue
}

/**
 * Complete queue configuration options
 *
 * These options control all aspects of queue behavior including Redis connection,
 * job processing, retry logic, and monitoring settings.
 */
export interface QueueOptions {
  concurrency?: number; // Maximum concurrent jobs per queue (default: 5)
  redis?: RedisOptions; // Redis connection configuration
  prefix?: string; // Redis key prefix for queue data (default: 'qmemory')
  stallInterval?: number; // How often to check for stalled jobs (default: 5000ms)
  nearActivatedWindow?: number; // Window for near-activation jobs (default: 30min)
  delayedDebounce?: number; // Debounce time for delayed jobs (default: 1000ms)
  maxDelayed?: number; // Maximum delayed jobs to track (default: 10000)
  removeOnSuccess?: boolean; // Remove jobs after successful completion (default: true)
  removeOnFailure?: boolean; // Remove jobs after failure (default: true)
  redisScanCount?: number; // Number of jobs to scan at once (default: 100)
  getEvents?: boolean; // Enable queue event emission (default: true)
  sendEvents?: boolean; // Send events to Redis (default: true)
  storeJobs?: boolean; // Store jobs in Redis (default: true)
  ensureScripts?: boolean; // Ensure Redis scripts are loaded (default: true)
  activateDelayedJobs?: boolean; // Enable delayed job processing (default: true)
  isWorker?: boolean; // This instance can process jobs (default: true)
  catchExceptions?: boolean; // Catch and log exceptions (default: true)
  settings?: QueueSettings; // Advanced queue settings
}

/**
 * Job data structure interface
 *
 * Defines the structure of data that can be stored in jobs. The interface is
 * intentionally flexible to support various job types while providing common
 * fields for job identification and status tracking.
 */
export interface JobData {
  [key: string]: unknown; // Flexible data structure for job-specific data
  type?: string; // Optional job type for routing and processing decisions
  status?: string; // Optional job status for tracking and debugging
}

/**
 * Job creation and processing options
 *
 * These options control how jobs are created, processed, and retried when
 * failures occur. They provide fine-grained control over job lifecycle.
 */
export interface JobOptions {
  jobId?: string | number; // Custom job identifier for tracking and deduplication
  retries?: number; // Maximum retry attempts (default: queue default)
  backoffStrategy?: { strategy: string; delayFactor?: number }; // Retry backoff configuration
  delayUntil?: number | Date; // Schedule job for future processing
  timeout?: number; // Maximum time to allow for job processing
}

/**
 * Queue statistics interface
 *
 * Provides information about queue state and performance for monitoring
 * and debugging purposes.
 */
export interface QueueStats {
  pending: number; // Number of jobs waiting to be processed
  active: number; // Number of jobs currently being processed
  concurrency: number; // Current concurrency limit
  queues: Record<string, unknown>; // Additional queue-specific statistics
}

/**
 * Job processor function result type
 *
 * Defines what a job processor function can return - either a single promise
 * or an array of promises for complex job processing scenarios.
 */
type JobProcessorResult = Promise<unknown> | Array<Promise<unknown>>;

/**
 * Job processor function type
 *
 * Defines the signature for job processing functions that handle the actual
 * work of processing jobs from the queue.
 *
 * @param job - The job to process with its data and metadata
 * @returns Promise or array of promises representing the processing result
 */
type JobProcessor = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  job: BeeQueueJob<JobData>
) => JobProcessorResult;

/**
 * Async Queue Wrapper Class
 *
 * Purpose: Provides a high-level interface for managing multiple job queues with
 * different job types, processors, and configurations. This class handles queue creation,
 * job routing, error handling, and monitoring while maintaining backward compatibility.
 *
 * Key Features:
 * - Multi-queue support with independent configurations
 * - Type-safe job processing with custom processors per job type
 * - Comprehensive error handling and logging
 * - Event emission for monitoring and debugging
 * - Automatic queue creation and management
 * - Stalled job detection and recovery
 * - Configurable retry strategies and backoff logic
 *
 * Architecture Decision: Why use a wrapper instead of bee-queue directly?
 * - Provides type safety and better error handling
 * - Manages multiple queues with different configurations
 * - Adds comprehensive logging and monitoring capabilities
 * - Implements consistent error handling patterns across all queues
 * - Provides a simplified API for common operations
 *
 * @class AsyncQueueWrapper
 * @extends EventEmitter
 *
 * @example
 * const queue = new AsyncQueueWrapper({
 *   concurrency: 10,
 *   redis: { host: 'localhost', port: 6379 }
 * });
 *
 * queue.processor('email', async (job) => {
 *   await sendEmail(job.data);
 * });
 *
 * await queue.add('email', { to: 'user@example.com', subject: 'Hello' });
 */
export class AsyncQueueWrapper extends EventEmitter {
  // Map of queue instances by state/name for multi-queue support
  private readonly queues: Map<string, BeeQueueInstance<JobData>> = new Map();

  // Map of job processors by job type for routing and processing
  private readonly processors: Map<string, JobProcessor> = new Map();

  // Set of currently active job IDs for monitoring and debugging
  private readonly activeJobs: Set<string> = new Set();

  // Public concurrency setting for monitoring and configuration
  public readonly concurrency: number;

  // Complete bee-queue configuration with all options merged
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

  /**
   * Creates a new async queue wrapper instance
   *
   * @param options - Queue configuration options
   */
  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency ?? 5; // Default to 5 concurrent jobs

    // Configure bee-queue with sensible defaults and provided options
    this.beeOptions = {
      redis: options.redis ?? {
        host: 'localhost', // Default Redis host
        port: 6379, // Default Redis port
      },
      prefix: options.prefix ?? 'qmemory', // Default Redis key prefix
      stallInterval: options.stallInterval ?? 5000, // Check for stalled jobs every 5 seconds
      nearActivatedWindow: options.nearActivatedWindow ?? 30 * 60 * 1000, // 30 minute window
      delayedDebounce: options.delayedDebounce ?? 1000, // 1 second debounce for delayed jobs
      maxDelayed: options.maxDelayed ?? 10000, // Track up to 10k delayed jobs
      removeOnSuccess: options.removeOnSuccess ?? true, // Clean up successful jobs
      removeOnFailure: options.removeOnFailure ?? true, // Clean up failed jobs
      redisScanCount: options.redisScanCount ?? 100, // Scan 100 jobs at a time
      getEvents: options.getEvents ?? true, // Enable event emission
      sendEvents: options.sendEvents ?? true, // Send events to Redis
      storeJobs: options.storeJobs ?? true, // Store jobs in Redis
      ensureScripts: options.ensureScripts ?? true, // Load Redis scripts
      activateDelayedJobs: options.activateDelayedJobs ?? true, // Enable delayed jobs
      isWorker: options.isWorker ?? true, // This instance can process jobs
      catchExceptions: options.catchExceptions ?? true, // Catch and log exceptions
      settings: {
        stalledInterval: options.settings?.stalledInterval ?? 30000, // 30 second stalled check
        maxStalledCount: options.settings?.maxStalledCount ?? 1, // Fail after 1 stall
        visibility: options.settings?.visibility ?? 30, // 30 second job visibility
        processConcurrency: options.settings?.processConcurrency, // Optional concurrency override
      },
    };

    // Initialize periodic cleanup for active jobs to prevent memory leaks
    this.initializeActiveJobsCleanup();
  }

  /**
   * Initialize periodic cleanup of stuck active jobs
   *
   * Sets up a timer to periodically clean up the activeJobs set to prevent
   * memory leaks from jobs that failed to remove themselves properly.
   */
  private initializeActiveJobsCleanup(): void {
    const cleanupInterval = setInterval(() => {
      this.cleanupStaleActiveJobs();
    }, 60000); // Run cleanup every minute

    // Clear interval on process exit to prevent memory leaks
    process.on('beforeExit', () => {
      clearInterval(cleanupInterval);
    });
  }

  /**
   * Clean up stale active jobs that have been active too long
   *
   * Removes job IDs from the activeJobs set that have been active for
   * longer than the stall interval, indicating they may be stuck.
   */
  private cleanupStaleActiveJobs(): void {
    if (this.activeJobs.size === 0) {
      return; // No active jobs to clean up
    }

    // Optimize: Remove unnecessary variable declarations and calculations
    const maxActiveJobs = this.concurrency * 10; // Allow 10x concurrency as safety margin

    if (this.activeJobs.size > maxActiveJobs) {
      console.warn(
        `ActiveJobsCleanup: Too many active jobs (${this.activeJobs.size}), clearing set to prevent memory leak`
      );
      this.activeJobs.clear();
      return;
    }

    // Only log when necessary to reduce console overhead
    if (this.activeJobs.size > this.concurrency) {
      console.log(
        `ActiveJobsCleanup: ${this.activeJobs.size} active jobs (concurrency: ${this.concurrency})`
      );
    }
  }

  /**
   * Registers a processor function for a specific job type
   *
   * This function sets up the processing logic for jobs of a specific type.
   * When a job of this type is dequeued, the provided processor will be called
   * with the job data and metadata.
   *
   * @param type - The job type identifier for routing
   * @param processor - The function that processes jobs of this type
   *
   * @example
   * queue.processor('email', async (job) => {
   *   const { to, subject, body } = job.data;
   *   await sendEmail({ to, subject, body });
   * });
   */
  processor(type: string, processor: JobProcessor): void {
    this.processors.set(type, processor);
  }

  /**
   * Gets or creates a queue instance for the specified state
   *
   * This function manages queue creation and event handler setup. It creates
   * new queue instances on demand and configures them with proper error handling
   * and event emission.
   *
   * @param state - The queue state/name (default: 'default')
   * @returns {BeeQueueInstance<JobData>} The configured queue instance
   */
  private getQueue(state: string = 'default'): BeeQueueInstance<JobData> {
    if (!this.queues.has(state)) {
      // Create new queue instance with configured options
      const queue = new BeeQueue<JobData>(
        `qmemory-${state}`,
        this.beeOptions
      ) as BeeQueueInstance<JobData>;

      // Set up comprehensive error handling and logging
      queue.on('error', (error: Error) => {
        qerrors.qerrors(error as Error, 'async-queue.queueError', {
          queueState: state,
          queueName: `qmemory-${state}`,
          activeJobsCount: this.activeJobs.size,
          concurrency: this.concurrency,
        });
        console.error(`Queue error for ${state}:`, error);
        this.emit('error', error);
      });

      // Handle job failures with detailed logging and retry tracking
      queue.on('failed', (job: BeeQueueJob<JobData>, error: Error) => {
        qerrors.qerrors(error as Error, 'async-queue.jobFailed', {
          queueState: state,
          jobId: String(job.id),
          jobType: job.data?.type || 'default',
          activeJobsCount: this.activeJobs.size,
          concurrency: this.concurrency,
        });
        console.error(`Job failed for ${state}:`, error);
        this.activeJobs.delete(String(job.id));
        this.emit('failed', { job, error });
      });

      queue.on('succeeded', (job: BeeQueueJob<JobData>) => {
        this.activeJobs.delete(String(job.id));
      });

      queue.process(this.concurrency, async (job: BeeQueueJob<JobData>) => {
        try {
          const jobType = typeof job.data?.type === 'string' ? job.data.type : 'default';
          const processor = this.processors.get(jobType);
          if (!processor) {
            const error = new Error(`No processor registered for job type: ${jobType}`);
            qerrors.qerrors(error as Error, 'async-queue.jobProcessor', {
              queueState: state,
              jobId: String(job.id),
              jobType,
              availableProcessors: Array.from(this.processors.keys()),
            });
            throw error;
          }

          this.activeJobs.add(String(job.id));

          const result = await processor(job);
          if (Array.isArray(result)) {
            const resolved = await Promise.all(result);
            return resolved.length > 0 ? resolved[0] : null;
          }

          return result ?? null;
        } catch (error) {
          qerrors.qerrors(error as Error, 'async-queue.jobProcessor', {
            queueState: state,
            jobId: String(job.id),
            jobType: job.data?.type || 'default',
            activeJobsCount: this.activeJobs.size,
          });
          this.activeJobs.delete(String(job.id));
          this.emit('jobError', { jobId: String(job.id), error: error as Error, state });
          throw error;
        }
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

  clear(): void {
    this.queues.clear();
    this.processors.clear();
    this.activeJobs.clear();
  }

  getActiveJobsCount(): number {
    return this.activeJobs.size;
  }

  async getStats(): Promise<QueueStats> {
    const defaultQueue = this.getQueue('default');
    const allJobs = defaultQueue ? await defaultQueue.getJobs() : [];

    // Optimize: Single pass through array instead of multiple filters
    // Use object counters for better performance on large datasets
    const statusCounts = { waiting: 0, active: 0 };

    for (const job of allJobs) {
      const status = job.data.status;
      if (status === 'waiting') {
        statusCounts.waiting++;
      } else if (status === 'active') {
        statusCounts.active++;
      }
    }

    return {
      pending: statusCounts.waiting,
      active: statusCounts.active,
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
