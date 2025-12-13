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

class SimpleDatabasePool {
  constructor(databaseUrl, config = {}) {
    this.databaseUrl = databaseUrl;
    this.dbType = this.getDatabaseType(databaseUrl);
    
    this.config = {
      maxConnections: config.maxConnections ?? 20,
      minConnections: config.minConnections ?? 5,
      acquireTimeout: config.acquireTimeout ?? 10000,
      idleTimeout: config.idleTimeout ?? 300000,
      healthCheckInterval: config.healthCheckInterval ?? 60000,
      maxQueryTime: config.maxQueryTime ?? 30000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000
    };
    
    this.connections = [];
    this.waitingQueue = [];
    this.healthCheckIntervalHandle = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the pool with minimum connections
   */
  async initialize() {
    if (this.isInitialized) return;
    
    const initPromises = [];
    for (let i = 0; i < this.config.minConnections; i++) {
      initPromises.push(this.createConnection());
    }
    
    await Promise.allSettled(initPromises);
    this.startHealthMonitoring();
    this.isInitialized = true;
    
    console.log(`[dbPool] Initialized ${this.dbType} pool with ${this.connections.length} connections`);
  }

  /**
   * Create a new database connection
   */
  async createConnection() {
    try {
      const client = await this.createDatabaseClient();
      
      const connection = {
        client,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        isHealthy: true,
        queryCount: 0,
        isInUse: false
      };
      
      this.connections.push(connection);
      return connection;
    } catch (error) {
      console.error(`[dbPool] Failed to create connection:`, error.message);
      throw error;
    }
  }

  /**
   * Create database client based on URL type
   */
  async createDatabaseClient() {
    switch (this.dbType) {
      case 'redis': {
        const Redis = require('redis');
        const client = Redis.createClient({
          url: this.databaseUrl,
          socket: {
            connectTimeout: 10000,
            lazyConnect: true
          }
        });
        await client.connect();
        return client;
      }
      
      case 'postgresql': {
        const { Pool: PgPool } = require('pg');
        const pool = new PgPool({
          connectionString: this.databaseUrl,
          max: 1,
          idleTimeoutMillis: 300000,
          connectionTimeoutMillis: 10000
        });
        return pool;
      }
      
      case 'mysql': {
        const mysql = require('mysql2/promise');
        return await mysql.createConnection({
          uri: this.databaseUrl,
          connectTimeout: 10000
        });
      }
      
      case 'mongodb': {
        const { MongoClient } = require('mongodb');
        return await MongoClient.connect(this.databaseUrl, {
          maxPoolSize: 1,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 30000
        });
      }
      
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  /**
   * Acquire a connection from the pool
   * 
   * @returns {Promise<Object>} Database connection
   */
  async acquireConnection() {
    const now = Date.now();
    
    for (const conn of this.connections) {
      if (!conn.isInUse && conn.isHealthy) {
        conn.isInUse = true;
        conn.lastUsed = now;
        conn.queryCount++;
        return conn;
      }
    }
    
    if (this.connections.length < this.config.maxConnections) {
      try {
        const connection = await this.createConnection();
        connection.isInUse = true;
        connection.queryCount++;
        return connection;
      } catch (error) {
        // Fall through to waiting queue
      }
    }
    
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);
      
      this.waitingQueue.push({
        resolve,
        reject,
        timestamp: now,
        timeoutHandle
      });
    });
  }

  /**
   * Release a connection back to the pool
   * 
   * @param {Object} connection - Connection to release
   */
  async releaseConnection(connection) {
    connection.isInUse = false;
    connection.lastUsed = Date.now();
    
    const waiter = this.waitingQueue.shift();
    if (waiter) {
      if (waiter.timeoutHandle) {
        clearTimeout(waiter.timeoutHandle);
      }
      connection.isInUse = true;
      connection.queryCount++;
      waiter.resolve(connection);
    }
  }

  /**
   * Execute a query with automatic connection management
   * 
   * @param {string|Object} query - Query to execute
   * @param {Array} params - Query parameters
   * @returns {Promise<*>} Query result
   */
  async executeQuery(query, params) {
    let attempt = 0;
    
    while (attempt < this.config.retryAttempts) {
      let connection = null;
      
      try {
        connection = await this.acquireConnection();
        const startTime = Date.now();
        let result;
        
        switch (this.dbType) {
          case 'redis':
            if (query && typeof query === 'object' && query.method && params) {
              result = await connection.client[query.method](...params);
            } else {
              result = await connection.client[query](...(params || []));
            }
            break;
            
          case 'postgresql':
            result = await connection.client.query(query, params);
            break;
            
          case 'mysql':
            result = await connection.client.execute(query, params);
            break;
            
          case 'mongodb':
            result = await query;
            break;
            
          default:
            throw new Error(`Unsupported database type: ${this.dbType}`);
        }
        
        const queryTime = Date.now() - startTime;
        if (queryTime > this.config.maxQueryTime) {
          console.warn(`[dbPool] Slow query detected: ${queryTime}ms`);
        }
        
        return result;
      } catch (error) {
        attempt++;
        if (attempt >= this.config.retryAttempts) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
      } finally {
        if (connection) {
          await this.releaseConnection(connection);
        }
      }
    }
    
    throw new Error(`Query failed after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Validate a connection's health
   */
  async validateConnection(connection) {
    try {
      switch (this.dbType) {
        case 'redis':
          await connection.client.ping();
          break;
        case 'postgresql':
          await connection.client.query('SELECT 1');
          break;
        case 'mysql':
          await connection.client.execute('SELECT 1');
          break;
        case 'mongodb':
          await connection.client.db('admin').command({ ping: 1 });
          break;
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

  /**
   * Start health monitoring interval
   */
  startHealthMonitoring() {
    this.healthCheckIntervalHandle = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all connections
   */
  async performHealthCheck() {
    const now = Date.now();
    const unhealthyConnections = [];
    
    for (const connection of this.connections) {
      const isIdle = !connection.isInUse;
      const isOld = (now - connection.lastUsed) > this.config.idleTimeout;
      
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

  /**
   * Remove a connection from the pool
   */
  async removeConnection(connection) {
    try {
      switch (this.dbType) {
        case 'redis':
          await connection.client.quit();
          break;
        case 'postgresql':
          await connection.client.end();
          break;
        case 'mysql':
          await connection.client.end();
          break;
        case 'mongodb':
          await connection.client.close();
          break;
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  /**
   * Determine database type from URL
   */
  getDatabaseType(databaseUrl) {
    const url = databaseUrl.toLowerCase();
    if (url.startsWith('redis://') || url.startsWith('rediss://')) return 'redis';
    if (url.startsWith('postgresql://') || url.startsWith('postgres://')) return 'postgresql';
    if (url.startsWith('mysql://')) return 'mysql';
    if (url.startsWith('mongodb://') || url.startsWith('mongodb+srv://')) return 'mongodb';
    return 'generic';
  }

  /**
   * Get pool statistics
   * 
   * @returns {Object} Pool stats
   */
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
      dbType: this.dbType
    };
  }

  /**
   * Get health status
   * 
   * @returns {Object} Health status
   */
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

  /**
   * Graceful shutdown
   */
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

module.exports = SimpleDatabasePool;