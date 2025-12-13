/**
 * Database Connection Pool Manager
 * 
 * Manages multiple database connection pools, providing centralized coordination
 * for multi-database applications. This class handles pool lifecycle,
 * connection routing, and health monitoring across all database instances.
 * 
 * Features:
 * - Multi-database pool management
 * - Automatic pool creation and initialization
 * - Connection routing by database URL
 * - Global health monitoring
 * - Statistics aggregation
 * - Graceful shutdown coordination
 */

const SimpleDatabasePool = require('./simple-pool');

class DatabaseConnectionPool {
  constructor() {
    this.pools = new Map();
  }

  /**
   * Create a new pool for a database URL
   * 
   * @param {string} databaseUrl - Database connection URL
   * @param {Object} config - Pool configuration
   */
  async createPool(databaseUrl, config) {
    if (this.pools.has(databaseUrl)) {
      return;
    }
    
    const pool = new SimpleDatabasePool(databaseUrl, config);
    await pool.initialize();
    this.pools.set(databaseUrl, pool);
  }

  /**
   * Get an existing pool
   * 
   * @param {string} databaseUrl - Database URL
   * @returns {SimpleDatabasePool|null} Pool or null
   */
  getPool(databaseUrl) {
    return this.pools.get(databaseUrl) || null;
  }

  /**
   * Acquire connection from a pool
   * 
   * @param {string} databaseUrl - Database URL
   * @returns {Promise<Object>} Connection
   */
  async acquireConnection(databaseUrl) {
    const pool = this.pools.get(databaseUrl);
    if (!pool) {
      throw new Error(`No pool exists for database: ${databaseUrl}`);
    }
    return await pool.acquireConnection();
  }

  /**
   * Release connection back to pool
   * 
   * @param {string} databaseUrl - Database URL
   * @param {Object} connection - Connection to release
   */
  async releaseConnection(databaseUrl, connection) {
    const pool = this.pools.get(databaseUrl);
    if (!pool) {
      throw new Error(`No pool exists for database: ${databaseUrl}`);
    }
    await pool.releaseConnection(connection);
  }

  /**
   * Execute query on a pool
   * 
   * @param {string} databaseUrl - Database URL
   * @param {string|Object} query - Query
   * @param {Array} params - Parameters
   * @returns {Promise<*>} Result
   */
  async executeQuery(databaseUrl, query, params) {
    const pool = this.pools.get(databaseUrl);
    if (!pool) {
      throw new Error(`No pool exists for database: ${databaseUrl}`);
    }
    return await pool.executeQuery(query, params);
  }

  /**
   * Get stats for all pools
   * 
   * @returns {Object} Stats by database URL
   */
  getPoolStats() {
    const stats = {};
    this.pools.forEach((pool, databaseUrl) => {
      stats[databaseUrl] = pool.getStats();
    });
    return stats;
  }

  /**
   * Get health status for all pools
   * 
   * @returns {Object} Health by database URL
   */
  getHealthStatus() {
    const health = {};
    this.pools.forEach((pool, databaseUrl) => {
      health[databaseUrl] = pool.getHealthStatus();
    });
    return health;
  }

  /**
   * Shutdown all pools
   */
  async shutdown() {
    const pools = Array.from(this.pools.values());
    const shutdownPromises = pools.map(pool => pool.shutdown());
    await Promise.allSettled(shutdownPromises);
    this.pools.clear();
    
    console.log('[dbPool] All pools shut down');
  }
}

module.exports = DatabaseConnectionPool;