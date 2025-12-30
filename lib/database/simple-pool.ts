/**
 * Simple Database Connection Pool Manager
 * Scalable database connection management with pooling and health monitoring
 *
 * Features:
 * - Multi-database support (Redis, PostgreSQL, MySQL, MongoDB)
 * - Dynamic connection sizing (min/max)
 * - Health monitoring with automatic recovery
 * - Query timeouts and retry logic
 * - Waiting queue for connection acquisition
 * - Comprehensive statistics
 * - Graceful shutdown
 *
 * Use cases:
 * - High-throughput applications
 * - Microservices with database dependencies
 * - Connection reuse across requests
 * - Preventing connection exhaustion
 */
/// <reference path="./types.d.ts" />
import { createClient as createRedisClient } from 'redis';
import { MongoClient } from 'mongodb';
import {
  DEFAULT_POOL_MAX_CONNECTIONS,
  DEFAULT_POOL_MIN_CONNECTIONS,
  DEFAULT_POOL_ACQUIRE_TIMEOUT,
  DEFAULT_POOL_IDLE_TIMEOUT,
  DEFAULT_POOL_HEALTH_CHECK_INTERVAL,
  DEFAULT_POOL_MAX_QUERY_TIME,
  DEFAULT_POOL_RETRY_ATTEMPTS,
  DEFAULT_POOL_RETRY_DELAY,
  DEFAULT_DB_CONNECT_TIMEOUT,
  DEFAULT_DB_SOCKET_TIMEOUT,
} from '../../config/localVars.js';
class SimpleDatabasePool {
  private connections: any[] = [];
  private waitingQueue: any[] = [];
  private healthCheckIntervalHandle: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;
  private databaseUrl: string;
  private dbType: string;

  // Circuit breaker state for preventing cascade failures
  private circuitBreakerState: {
    isOpen: boolean;
    failureCount: number;
    lastFailureTime: number;
    nextAttemptTime: number;
  } = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  };

  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // Open after 5 consecutive failures
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // Try again after 60 seconds

  private config: {
    maxConnections: number;
    minConnections: number;
    acquireTimeout: number;
    idleTimeout: number;
    healthCheckInterval: number;
    maxQueryTime: number;
    retryAttempts: number;
    retryDelay: number;
  };

  constructor(databaseUrl: string, config: any = {}) {
    this.connections = [];
    this.waitingQueue = [];
    this.healthCheckIntervalHandle = null;
    this.isInitialized = false;
    this.databaseUrl = databaseUrl;
    this.dbType = this.getDatabaseType(databaseUrl);
    this.config = {
      maxConnections: config.maxConnections ?? Number(DEFAULT_POOL_MAX_CONNECTIONS),
      minConnections: config.minConnections ?? Number(DEFAULT_POOL_MIN_CONNECTIONS),
      acquireTimeout: config.acquireTimeout ?? Number(DEFAULT_POOL_ACQUIRE_TIMEOUT),
      idleTimeout: config.idleTimeout ?? Number(DEFAULT_POOL_IDLE_TIMEOUT),
      healthCheckInterval: config.healthCheckInterval ?? Number(DEFAULT_POOL_HEALTH_CHECK_INTERVAL),
      maxQueryTime: config.maxQueryTime ?? Number(DEFAULT_POOL_MAX_QUERY_TIME),
      retryAttempts: config.retryAttempts ?? Number(DEFAULT_POOL_RETRY_ATTEMPTS),
      retryDelay: config.retryDelay ?? Number(DEFAULT_POOL_RETRY_DELAY),
    };
  }
  async initialize() {
    if (this.isInitialized) return;
    const initPromises = [];
    for (let i = 0; i < this.config.minConnections; i++) {
      initPromises.push(this.createConnection());
    }
    await Promise.allSettled(initPromises);
    this.startHealthMonitoring();
    this.isInitialized = true;
    console.log(
      `[dbPool] Initialized ${this.dbType} pool with ${this.connections.length} connections`
    );
  }
  async createConnection() {
    try {
      const client = await this.createDatabaseClient();
      const connection = {
        client,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isHealthy: true,
        queryCount: 0,
        isInUse: false,
      };
      this.connections.push(connection);
      return connection;
    } catch (error) {
      console.error(`[dbPool] Failed to create connection:`, error.message);
      throw error;
    }
  }
  async createDatabaseClient() {
    switch (this.dbType) {
      case 'redis': {
        const client = createRedisClient({
          url: this.databaseUrl,
          socket: {
            connectTimeout: Number(DEFAULT_DB_CONNECT_TIMEOUT),
          },
        });
        try {
          await client.connect();
          return client;
        } catch (error) {
          console.error(`[dbPool] Redis connection failed:`, error.message);
          throw new Error(`Redis connection failed: ${error.message}`);
        }
      }
      case 'postgresql': {
        const { default: pg } = await import('pg');
        const pool = new pg.Pool({
          connectionString: this.databaseUrl,
          max: 1,
          idleTimeoutMillis: Number(DEFAULT_POOL_IDLE_TIMEOUT),
          connectionTimeoutMillis: Number(DEFAULT_DB_CONNECT_TIMEOUT),
        });
        return pool;
      }
      case 'mysql': {
        const mysql = await import('mysql2/promise');
        return await mysql.default.createConnection({
          uri: this.databaseUrl,
          connectTimeout: Number(DEFAULT_DB_CONNECT_TIMEOUT),
        });
      }
      case 'mongodb': {
        return await MongoClient.connect(this.databaseUrl, {
          maxPoolSize: 1,
          serverSelectionTimeoutMS: Number(DEFAULT_DB_CONNECT_TIMEOUT),
          socketTimeoutMS: Number(DEFAULT_DB_SOCKET_TIMEOUT),
        });
      }
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }
  async acquireConnection() {
    const now = Date.now();

    // Fast path: find available connection using efficient lookup
    const availableConnection = this.findAvailableConnection();
    if (availableConnection) {
      availableConnection.isInUse = true;
      availableConnection.lastUsed = now;
      availableConnection.queryCount++;
      return availableConnection;
    }

    // Try to create new connection if under limit
    if (this.connections.length < this.config.maxConnections) {
      try {
        const connection = await this.createConnection();
        // CRITICAL: Set connection as in-use BEFORE returning to prevent race conditions
        connection.isInUse = true;
        connection.lastUsed = Date.now();
        connection.queryCount++;
        return connection;
      } catch (error) {
        // Fall through to waiting queue
      }
    }

    // Queue-based waiting for better scalability
    return this.queueForConnection(now);
  }

  private findAvailableConnection() {
    // Use efficient lookup instead of sequential iteration
    // Prioritize recently used healthy connections
    const healthyConnections = this.connections.filter(conn => !conn.isInUse && conn.isHealthy);
    if (healthyConnections.length === 0) return null;

    // Sort by last used to reuse connections efficiently
    return healthyConnections.sort((a, b) => b.lastUsed - a.lastUsed)[0];
  }

  private async queueForConnection(startTime: number) {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);

      // Use FIFO queue for fair ordering
      this.waitingQueue.push({
        resolve,
        reject,
        timestamp: startTime,
        timeoutHandle,
      });
    });
  }
  async releaseConnection(connection) {
    // ATOMIC: Mark as not in-use FIRST to prevent race conditions
    connection.isInUse = false;
    connection.lastUsed = Date.now();

    // Get waiter atomically before any other operations
    const waiter = this.waitingQueue.shift();
    if (waiter) {
      if (waiter.timeoutHandle) {
        clearTimeout(waiter.timeoutHandle);
      }

      try {
        // ATOMIC: Mark as in-use BEFORE resolving to prevent race conditions
        connection.isInUse = true;
        connection.queryCount++;
        connection.lastUsed = Date.now();
        waiter.resolve(connection);
      } catch (error) {
        // CRITICAL: If resolution fails, ensure connection is released
        connection.isInUse = false;
        throw error;
      }
    }
  }
  async executeQuery(query, params) {
    // Check circuit breaker state first
    if (this.isCircuitBreakerOpen()) {
      throw new Error('Database circuit breaker is open - temporarily rejecting requests');
    }

    let attempt = 0;
    let connection = null;
    let lastError = null;

    while (attempt < this.config.retryAttempts) {
      try {
        if (!connection) {
          connection = await this.acquireConnection();
        }
        const startTime = Date.now();
        let result;
        switch (this.dbType) {
          case 'redis': {
            const redisClient = connection.client;
            if (query && typeof query === 'object' && query.method && params) {
              const redisQuery = query;
              const method = redisClient[redisQuery.method];
              if (typeof method === 'function') {
                result = await method(...params);
              } else {
                throw new Error(`Invalid Redis method: ${redisQuery.method}`);
              }
            } else if (typeof query === 'string') {
              const method = redisClient[query];
              if (typeof method === 'function') {
                result = await method(...(params || []));
              } else {
                throw new Error(`Invalid Redis method: ${query}`);
              }
            } else {
              throw new Error('Invalid Redis query format');
            }
            break;
          }
          case 'postgresql': {
            const pgPool = connection.client;
            result = await pgPool.query(query, params);
            break;
          }
          case 'mysql': {
            const mysqlConn = connection.client;
            result = await mysqlConn.execute(query, params);
            break;
          }
          case 'mongodb':
            result = await query();
            break;
          default:
            throw new Error(`Unsupported database type: ${this.dbType}`);
        }
        const queryTime = Date.now() - startTime;
        if (queryTime > this.config.maxQueryTime) {
          console.warn(`[dbPool] Slow query detected: ${queryTime}ms`);
        }

        // Reset circuit breaker on success
        this.resetCircuitBreaker();
        return result;
      } catch (error) {
        lastError = error;
        attempt++;
        this.recordFailure();

        if (attempt >= this.config.retryAttempts) {
          throw lastError;
        }

        // Exponential backoff with jitter for better scalability
        const backoffDelay =
          this.config.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      } finally {
        if (connection) {
          await this.releaseConnection(connection);
          connection = null; // Reset for next retry attempt
        }
      }
    }
    throw new Error(
      `Query failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`
    );
  }

  private isCircuitBreakerOpen(): boolean {
    const now = Date.now();
    if (this.circuitBreakerState.isOpen) {
      // Check if timeout has passed
      if (now >= this.circuitBreakerState.nextAttemptTime) {
        this.circuitBreakerState.isOpen = false;
        this.circuitBreakerState.failureCount = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  private recordFailure(): void {
    this.circuitBreakerState.failureCount++;
    this.circuitBreakerState.lastFailureTime = Date.now();

    if (this.circuitBreakerState.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreakerState.isOpen = true;
      this.circuitBreakerState.nextAttemptTime = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT;
      console.warn(
        `[dbPool] Circuit breaker opened due to ${this.circuitBreakerState.failureCount} consecutive failures`
      );
    }
  }

  private resetCircuitBreaker(): void {
    if (this.circuitBreakerState.failureCount > 0) {
      this.circuitBreakerState.failureCount = 0;
      this.circuitBreakerState.lastFailureTime = 0;
      if (this.circuitBreakerState.isOpen) {
        this.circuitBreakerState.isOpen = false;
        console.log(`[dbPool] Circuit breaker reset - database operations restored`);
      }
    }
  }
  async validateConnection(connection) {
    try {
      switch (this.dbType) {
        case 'redis':
          await connection.client.ping();
          break;
        case 'postgresql': {
          const pgPool = connection.client;
          await pgPool.query('SELECT 1');
          break;
        }
        case 'mysql': {
          const mysqlConn = connection.client;
          await mysqlConn.execute('SELECT 1');
          break;
        }
        case 'mongodb': {
          const mongoClient = connection.client;
          await mongoClient.db('admin').command({ ping: 1 });
          break;
        }
        default:
          return false;
      }
      connection.isHealthy = true;
      connection.lastUsed = Date.now();
      return true;
    } catch (error) {
      connection.isHealthy = false;
      return false;
    }
  }
  startHealthMonitoring() {
    this.healthCheckIntervalHandle = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }
  async performHealthCheck() {
    const now = Date.now();
    const unhealthyConnections = [];
    for (const connection of this.connections) {
      const isIdle = !connection.isInUse;
      const isOld = now - connection.lastUsed > this.config.idleTimeout;
      if (isIdle && isOld) {
        unhealthyConnections.push(connection);
        continue;
      }
      if (isIdle) {
        const isHealthy = await this.validateConnection(connection);
        if (!isHealthy) {
          unhealthyConnections.push(connection);
        }
      }
    }
    for (const connection of unhealthyConnections) {
      if (!connection.isInUse) {
        await this.removeConnection(connection);
      } else {
        connection.isHealthy = false;
      }
    }
    const healthyConnections = this.connections.filter(conn => conn.isHealthy);
    if (healthyConnections.length < this.config.minConnections) {
      const needed = this.config.minConnections - healthyConnections.length;
      for (let i = 0; i < needed; i++) {
        try {
          await this.createConnection();
        } catch (error) {
          break;
        }
      }
    }
  }
  async removeConnection(connection) {
    try {
      switch (this.dbType) {
        case 'redis':
          await connection.client.quit();
          break;
        case 'postgresql': {
          const pgPool = connection.client;
          await pgPool.end();
          break;
        }
        case 'mysql': {
          const mysqlConn = connection.client;
          await mysqlConn.end();
          break;
        }
        case 'mongodb': {
          const mongoClient = connection.client;
          await mongoClient.close();
          break;
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }
  getDatabaseType(databaseUrl) {
    const url = databaseUrl.toLowerCase();
    if (url.startsWith('redis://') || url.startsWith('rediss://')) return 'redis';
    if (url.startsWith('postgresql://') || url.startsWith('postgres://')) return 'postgresql';
    if (url.startsWith('mysql://')) return 'mysql';
    if (url.startsWith('mongodb://') || url.startsWith('mongodb+srv://')) return 'mongodb';
    return 'generic';
  }
  getStats() {
    const active = this.connections.filter(conn => conn.isInUse).length;
    const idle = this.connections.filter(conn => !conn.isInUse).length;
    const healthy = this.connections.filter(conn => conn.isHealthy).length;
    return {
      active,
      idle,
      healthy,
      total: this.connections.length,
      waiting: this.waitingQueue.length,
      max: this.config.maxConnections,
      min: this.config.minConnections,
      dbType: this.dbType,
    };
  }
  getHealthStatus() {
    const stats = this.getStats();
    const issues = [];
    let status = 'healthy';
    const utilizationPercent = (stats.active / stats.max) * 100;
    if (utilizationPercent > 90) {
      status = 'critical';
      issues.push(`High connection utilization: ${utilizationPercent.toFixed(1)}%`);
    } else if (utilizationPercent > 75) {
      status = 'warning';
      issues.push(`Elevated connection utilization: ${utilizationPercent.toFixed(1)}%`);
    }
    if (stats.waiting > 0) {
      status = 'warning';
      issues.push(`${stats.waiting} requests waiting for connections`);
    }
    if (stats.healthy < stats.min) {
      status = 'critical';
      issues.push(`Below minimum healthy connections: ${stats.healthy}/${stats.min}`);
    }
    return { status, stats, issues };
  }
  async shutdown() {
    if (this.healthCheckIntervalHandle) {
      clearInterval(this.healthCheckIntervalHandle);
      this.healthCheckIntervalHandle = null;
    }
    for (const waiter of this.waitingQueue) {
      if (waiter.timeoutHandle) {
        clearTimeout(waiter.timeoutHandle);
      }
      waiter.reject(new Error('Database pool shutting down'));
    }
    this.waitingQueue = [];
    const closePromises = this.connections.map(conn => this.removeConnection(conn));
    await Promise.allSettled(closePromises);
    this.connections = [];
    this.isInitialized = false;
    console.log(`[dbPool] ${this.dbType} pool shut down`);
  }
}
export default SimpleDatabasePool;
