/**
 * Database Connection Pool Manager
 * Scalable database connection management with pooling and health monitoring
 * 
 * Refactored for Single Responsibility Principle - now delegates to specialized modules:
 * - Simple pool implementation: database/simple-pool.js
 * - Connection pool manager: database/connection-pool-manager.js
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

const SimpleDatabasePool = require('./database/simple-pool');
const DatabaseConnectionPool = require('./database/connection-pool-manager');

// Create singleton instance for immediate use across the application
const databaseConnectionPool = new DatabaseConnectionPool();

// Convenience functions for common operations
const createDatabasePool = (databaseUrl, config) =>
  databaseConnectionPool.createPool(databaseUrl, config);

const acquireDatabaseConnection = (databaseUrl) =>
  databaseConnectionPool.acquireConnection(databaseUrl);

const releaseDatabaseConnection = (databaseUrl, connection) =>
  databaseConnectionPool.releaseConnection(databaseUrl, connection);

const executeDatabaseQuery = (databaseUrl, query, params) =>
  databaseConnectionPool.executeQuery(databaseUrl, query, params);

const getDatabasePoolStats = () =>
  databaseConnectionPool.getPoolStats();

const getDatabasePoolHealth = () =>
  databaseConnectionPool.getHealthStatus();

const shutdownDatabasePools = () =>
  databaseConnectionPool.shutdown();

module.exports = {
  SimpleDatabasePool,
  DatabaseConnectionPool,
  databaseConnectionPool,
  createDatabasePool,
  acquireDatabaseConnection,
  releaseDatabaseConnection,
  executeDatabaseQuery,
  getDatabasePoolStats,
  getDatabasePoolHealth,
  shutdownDatabasePools
};