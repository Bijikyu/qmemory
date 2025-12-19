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
import SimpleDatabasePool from './database/simple-pool.js';
import { DatabaseConnectionPool, databaseConnectionPool as globalDatabaseConnectionPool, } from './database/connection-pool-manager.js';
// Create singleton instance for immediate use across the application
const databaseConnectionPool = new DatabaseConnectionPool();
// Convenience functions for common operations
const createDatabasePool = (databaseUrl, config = {}) => globalDatabaseConnectionPool.createPool(databaseUrl, config);
const acquireDatabaseConnection = async (databaseUrl) => globalDatabaseConnectionPool.acquireConnection(databaseUrl);
const releaseDatabaseConnection = (databaseUrl, connection) => globalDatabaseConnectionPool.releaseConnection(databaseUrl, connection);
const executeDatabaseQuery = async (databaseUrl, query, params = []) => globalDatabaseConnectionPool.executeQuery(databaseUrl, query, params);
const getDatabasePoolStats = () => globalDatabaseConnectionPool.getAllStats();
const getDatabasePoolHealth = () => globalDatabaseConnectionPool.getAllHealthStatus();
const shutdownDatabasePools = async () => globalDatabaseConnectionPool.shutdown();
// Additional convenience functions for advanced pool management
const getDatabasePool = (databaseUrl) => globalDatabaseConnectionPool.getPool(databaseUrl);
const createOrGetDatabasePool = async (databaseUrl, config = {}) => globalDatabaseConnectionPool.getOrCreatePool(databaseUrl, config);
const removeDatabasePool = async (databaseUrl) => globalDatabaseConnectionPool.removePool(databaseUrl);
const getAllDatabasePoolUrls = () => globalDatabaseConnectionPool.getPoolUrls();
const getAllDatabasePools = () => globalDatabaseConnectionPool.getAllPools();
const getGlobalDatabaseStatistics = () => globalDatabaseConnectionPool.getGlobalStats();
const performGlobalDatabaseHealthCheck = async () => globalDatabaseConnectionPool.performGlobalHealthCheck();
const getDatabasePoolCount = () => globalDatabaseConnectionPool.getPoolCount();
const hasDatabasePool = (databaseUrl) => globalDatabaseConnectionPool.hasPool(databaseUrl);
const getDatabasePoolsByType = (dbType) => globalDatabaseConnectionPool.getPoolsByType(dbType);
const getDatabasePoolUrlsByType = (dbType) => globalDatabaseConnectionPool.getPoolUrlsByType(dbType);
export { 
// Core classes
SimpleDatabasePool, DatabaseConnectionPool, databaseConnectionPool, 
// Basic pool operations
createDatabasePool, getDatabasePool, createOrGetDatabasePool, removeDatabasePool, 
// Connection management
acquireDatabaseConnection, releaseDatabaseConnection, 
// Query execution
executeDatabaseQuery, 
// Statistics and health
getDatabasePoolStats, getDatabasePoolHealth, getGlobalDatabaseStatistics, performGlobalDatabaseHealthCheck, 
// Pool enumeration and inspection
getAllDatabasePoolUrls, getAllDatabasePools, getDatabasePoolCount, hasDatabasePool, getDatabasePoolsByType, getDatabasePoolUrlsByType, 
// Lifecycle management
shutdownDatabasePools, };
