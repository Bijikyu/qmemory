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
import SimpleDatabasePool from './simple-pool.js';
class DatabaseConnectionPool {
  private pools: Map<string, SimpleDatabasePool>;

  constructor() {
    this.pools = new Map();
  }
  /**
   * Create a new pool for a database URL
   *
   * @param {string} databaseUrl - Database connection URL
   * @param {PoolConfig} config - Pool configuration
   */
  async createPool(databaseUrl, config = {}) {
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
   * Create or get an existing pool (lazy initialization)
   *
   * @param {string} databaseUrl - Database URL
   * @param {PoolConfig} config - Pool configuration
   * @returns {Promise<SimpleDatabasePool>} Pool instance
   */
  async getOrCreatePool(databaseUrl, config = {}) {
    let pool = this.getPool(databaseUrl);
    if (!pool) {
      await this.createPool(databaseUrl, config);
      pool = this.getPool(databaseUrl);
    }
    return pool;
  }
  /**
   * Remove a pool
   *
   * @param {string} databaseUrl - Database URL
   */
  async removePool(databaseUrl) {
    const pool = this.pools.get(databaseUrl);
    if (pool) {
      await pool.shutdown();
      this.pools.delete(databaseUrl);
    }
  }
  /**
   * Get all pool URLs
   *
   * @returns {string[]} Array of database URLs
   */
  getPoolUrls() {
    return Array.from(this.pools.keys());
  }
  /**
   * Get all pools
   *
   * @returns {SimpleDatabasePool[]} Array of pools
   */
  getAllPools() {
    return Array.from(this.pools.values());
  }
  /**
   * Get statistics for all pools
   *
   * @returns {Record<string, PoolStats>} Statistics by database URL
   */
  getAllStats() {
    const stats = {};
    for (const [url, pool] of this.pools) {
      stats[url] = pool.getStats();
    }
    return stats;
  }
  /**
   * Get health status for all pools
   *
   * @returns {Record<string, HealthStatus>} Health status by database URL
   */
  getAllHealthStatus() {
    const health = {};
    for (const [url, pool] of this.pools) {
      health[url] = pool.getHealthStatus();
    }
    return health;
  }
  /**
   * Get global statistics across all pools
   *
   * @returns {GlobalStats} Global statistics
   */
  getGlobalStats() {
    const pools = this.getAllPools();
    const stats = this.getAllStats();
    let totalConnections = 0;
    let totalActiveConnections = 0;
    let totalWaitingRequests = 0;
    const poolsByType = {};
    let overallHealth = 'healthy';
    for (const pool of pools) {
      const poolStats = pool.getStats();
      totalConnections += poolStats.total;
      totalActiveConnections += poolStats.active;
      totalWaitingRequests += poolStats.waiting;
      poolsByType[poolStats.dbType] = (poolsByType[poolStats.dbType] || 0) + 1;
      const poolHealth = pool.getHealthStatus();
      if (poolHealth.status === 'critical') {
        overallHealth = 'critical';
      } else if (poolHealth.status === 'warning' && overallHealth === 'healthy') {
        overallHealth = 'warning';
      }
    }
    return {
      totalPools: pools.length,
      totalConnections,
      totalActiveConnections,
      totalWaitingRequests,
      poolsByType,
      overallHealth,
    };
  }
  /**
   * Execute a query on the appropriate pool
   *
   * @param {string} databaseUrl - Database URL
   * @param {string|Function} query - Query to execute
   * @param {Array} params - Query parameters
   * @param {PoolConfig} config - Pool configuration (for lazy creation)
   * @returns {Promise<any>} Query result
   */
  async executeQuery(databaseUrl, query, params, config = {}) {
    const pool = await this.getOrCreatePool(databaseUrl, config);
    return await pool.executeQuery(query, params);
  }
  /**
   * Acquire a connection from the appropriate pool
   *
   * @param {string} databaseUrl - Database URL
   * @param {PoolConfig} config - Pool configuration (for lazy creation)
   * @returns {Promise<any>} Database connection
   */
  async acquireConnection(databaseUrl, config = {}) {
    const pool = await this.getOrCreatePool(databaseUrl, config);
    return await pool.acquireConnection();
  }
  /**
   * Release a connection back to the appropriate pool
   *
   * @param {string} databaseUrl - Database URL
   * @param {any} connection - Connection to release
   */
  async releaseConnection(databaseUrl, connection) {
    const pool = this.getPool(databaseUrl);
    if (pool) {
      await pool.releaseConnection(connection);
    }
  }
  /**
   * Perform health check on all pools
   *
   * @returns {Promise<Record<string, HealthStatus>>} Health status by database URL
   */
  async performGlobalHealthCheck() {
    const health = {};
    for (const [url, pool] of this.pools) {
      // Trigger health check by accessing the pool's health status
      health[url] = pool.getHealthStatus();
    }
    return health;
  }
  /**
   * Shutdown all pools
   */
  async shutdown() {
    const shutdownPromises = Array.from(this.pools.values()).map(pool => pool.shutdown());
    await Promise.allSettled(shutdownPromises);
    this.pools.clear();
  }
  /**
   * Get pool count
   *
   * @returns {number} Number of pools
   */
  getPoolCount() {
    return this.pools.size;
  }
  /**
   * Check if a pool exists for a database URL
   *
   * @param {string} databaseUrl - Database URL
   * @returns {boolean} True if pool exists
   */
  hasPool(databaseUrl) {
    return this.pools.has(databaseUrl);
  }
  /**
   * Get pools by database type
   *
   * @param {string} dbType - Database type (redis, postgresql, mysql, mongodb)
   * @returns {SimpleDatabasePool[]} Array of pools of the specified type
   */
  getPoolsByType(dbType) {
    return this.getAllPools().filter(pool => {
      const stats = pool.getStats();
      return stats.dbType === dbType;
    });
  }
  /**
   * Get database URLs by type
   *
   * @param {string} dbType - Database type
   * @returns {string[]} Array of database URLs of the specified type
   */
  getPoolUrlsByType(dbType) {
    const urls = [];
    for (const [url, pool] of this.pools) {
      const stats = pool.getStats();
      if (stats.dbType === dbType) {
        urls.push(url);
      }
    }
    return urls;
  }
}
// Singleton instance for application-wide use
const databaseConnectionPool = new DatabaseConnectionPool();
export { DatabaseConnectionPool, databaseConnectionPool };
