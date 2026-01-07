/**
 * Scalability Patches for Database Operations
 *
 * Addresses critical scalability bottlenecks:
 * 1. Database connection timeouts
 * 2. Query performance monitoring
 * 3. Memory leak prevention
 * 4. Connection pool optimization
 */

import type { Response } from 'express';
import type { MongoServerError } from 'mongodb';
import { sendInternalServerError, sendServiceUnavailable } from './http-utils.js';

/**
 * Enhanced database operation with timeout and performance monitoring
 */
export const scalableDbOperation = async <TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  options: {
    timeout?: number;
    retries?: number;
    res?: Response | null;
  } = {}
): Promise<TResult | null> => {
  const { timeout = 30000, retries = 3, res } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const startTime = Date.now();

    try {
      // Add timeout to prevent hanging operations
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Database operation timeout after ${timeout}ms: ${operationName} (attempt ${attempt})`
            )
          );
        }, timeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);

      // Log performance metrics
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        // Slow operation (>5s)
        console.warn(`SLOW DB OPERATION: ${operationName} took ${duration}ms (attempt ${attempt})`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Log retry attempt
      if (attempt < retries) {
        console.warn(`DB operation failed, retrying (${attempt}/${retries}): ${operationName}`, {
          error: error.message,
        });

        // Exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // All retries failed
  console.error(`DB operation failed after ${retries} attempts: ${operationName}`, {
    error: lastError?.message,
  });

  if (res && lastError) {
    sendInternalServerError(res, 'Database operation failed after multiple retries');
  }

  return null;
};

/**
 * Memory-efficient batch operation processor
 */
export class BatchProcessor<T> {
  private queue: Array<() => Promise<T>> = [];
  private batchSize: number;
  private maxConcurrency: number;
  private processing: boolean = false;

  constructor(batchSize = 10, maxConcurrency = 5) {
    this.batchSize = batchSize;
    this.maxConcurrency = maxConcurrency;
  }

  add(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batch = this.queue.splice(0, Math.min(this.batchSize, this.queue.length));

    try {
      // Process batch with concurrency limit
      const promises = batch.map(async op => {
        try {
          return await op();
        } catch (error) {
          console.error('Batch operation failed:', error);
          throw error;
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      this.processing = false;

      // Continue processing if more items in queue
      if (this.queue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  getStats(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
    };
  }
}

/**
 * Simple connection pool manager
 */
export class SimpleConnectionPool {
  private connections: any[] = [];
  private maxConnections: number;
  private waiting: Array<{
    resolve: (conn: any) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
  }

  async getConnection(createConnection: () => Promise<any>): Promise<any> {
    // Check for available connection
    const availableConnection = this.connections.find(conn => !conn.inUse);
    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();
      return availableConnection.connection;
    }

    // Create new connection if under limit
    if (this.connections.length < this.maxConnections) {
      const connection = await createConnection();
      const pooledConnection = {
        connection,
        inUse: true,
        created: Date.now(),
        lastUsed: Date.now(),
      };
      this.connections.push(pooledConnection);
      return connection;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      this.waiting.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        const waitingIndex = this.waiting.findIndex(w => w.timestamp === Date.now());
        if (waitingIndex >= 0) {
          this.waiting.splice(waitingIndex, 1);
          reject(new Error('Connection timeout - no available connections'));
        }
      }, 30000);
    });
  }

  releaseConnection(connection: any): void {
    const pooledConnection = this.connections.find(pc => pc.connection === connection);
    if (pooledConnection) {
      pooledConnection.inUse = false;
      pooledConnection.lastUsed = Date.now();

      // Resolve next waiting request
      if (this.waiting.length > 0) {
        const nextWaiting = this.waiting.shift();
        if (nextWaiting) {
          pooledConnection.inUse = true;
          nextWaiting.resolve(connection);
        }
      }
    }
  }

  getStats(): { total: number; inUse: number; available: number; waiting: number } {
    const inUse = this.connections.filter(c => c.inUse).length;
    const available = this.connections.filter(c => !c.inUse).length;

    return {
      total: this.connections.length,
      inUse,
      available,
      waiting: this.waiting.length,
    };
  }
}

export { scalableDbOperation, BatchProcessor, SimpleConnectionPool };
