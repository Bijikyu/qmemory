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
import {
  DatabaseConnectionPool,
  databaseConnectionPool as globalDatabaseConnectionPool,
} from './database/connection-pool-manager.js';

// Interface for database configuration
interface DatabaseConfig {
  min?: number;
  max?: number;
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

// Interface for pool statistics
interface PoolStatistics {
  active: number;
  idle: number;
  healthy: number;
  total: number;
  waiting: number;
  max: number;
  min: number;
  dbType: string;
}

// Interface for health status
interface PoolHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  stats: PoolStatistics;
  issues: string[];
}

// Interface for global statistics
interface GlobalPoolStatistics {
  totalPools: number;
  totalConnections: number;
  totalActiveConnections: number;
  totalWaitingRequests: number;
  poolsByType: Record<string, number>;
  overallHealth: 'healthy' | 'warning' | 'critical';
}

// Create singleton instance for immediate use across the application
const databaseConnectionPool = new DatabaseConnectionPool();

// Convenience functions for common operations
const createDatabasePool = (databaseUrl: string, config: DatabaseConfig = {}): Promise<void> =>
  globalDatabaseConnectionPool.createPool(databaseUrl, config as any);

const acquireDatabaseConnection = async (databaseUrl: string): Promise<any> =>
  globalDatabaseConnectionPool.acquireConnection(databaseUrl);

const releaseDatabaseConnection = (databaseUrl: string, connection: any): Promise<void> =>
  globalDatabaseConnectionPool.releaseConnection(databaseUrl, connection);

const executeDatabaseQuery = async (
  databaseUrl: string,
  query: string,
  params: any[] = []
): Promise<any> => globalDatabaseConnectionPool.executeQuery(databaseUrl, query, params);

const getDatabasePoolStats = (): any => globalDatabaseConnectionPool.getAllStats();

const getDatabasePoolHealth = (): any => globalDatabaseConnectionPool.getAllHealthStatus();

const shutdownDatabasePools = async (): Promise<void> => globalDatabaseConnectionPool.shutdown();

// Additional convenience functions for advanced pool management
const getDatabasePool = (databaseUrl: string): SimpleDatabasePool | null =>
  globalDatabaseConnectionPool.getPool(databaseUrl);

const createOrGetDatabasePool = async (
  databaseUrl: string,
  config: DatabaseConfig = {}
): Promise<SimpleDatabasePool> =>
  globalDatabaseConnectionPool.getOrCreatePool(databaseUrl, config as any);

const removeDatabasePool = async (databaseUrl: string): Promise<void> =>
  globalDatabaseConnectionPool.removePool(databaseUrl);

const getAllDatabasePoolUrls = (): string[] => globalDatabaseConnectionPool.getPoolUrls();

const getAllDatabasePools = (): SimpleDatabasePool[] => globalDatabaseConnectionPool.getAllPools();

const getGlobalDatabaseStatistics = (): GlobalPoolStatistics =>
  globalDatabaseConnectionPool.getGlobalStats();

const performGlobalDatabaseHealthCheck = async (): Promise<Record<string, PoolHealthStatus>> =>
  globalDatabaseConnectionPool.performGlobalHealthCheck();

const getDatabasePoolCount = (): number => globalDatabaseConnectionPool.getPoolCount();

const hasDatabasePool = (databaseUrl: string): boolean =>
  globalDatabaseConnectionPool.hasPool(databaseUrl);

const getDatabasePoolsByType = (dbType: string): SimpleDatabasePool[] =>
  globalDatabaseConnectionPool.getPoolsByType(dbType);

const getDatabasePoolUrlsByType = (dbType: string): string[] =>
  globalDatabaseConnectionPool.getPoolUrlsByType(dbType);

export {
  // Core classes
  SimpleDatabasePool,
  DatabaseConnectionPool,
  databaseConnectionPool,

  // Basic pool operations
  createDatabasePool,
  getDatabasePool,
  createOrGetDatabasePool,
  removeDatabasePool,

  // Connection management
  acquireDatabaseConnection,
  releaseDatabaseConnection,

  // Query execution
  executeDatabaseQuery,

  // Statistics and health
  getDatabasePoolStats,
  getDatabasePoolHealth,
  getGlobalDatabaseStatistics,
  performGlobalDatabaseHealthCheck,

  // Pool enumeration and inspection
  getAllDatabasePoolUrls,
  getAllDatabasePools,
  getDatabasePoolCount,
  hasDatabasePool,
  getDatabasePoolsByType,
  getDatabasePoolUrlsByType,

  // Lifecycle management
  shutdownDatabasePools,

  // Type exports for TypeScript users
  type DatabaseConfig,
  type PoolStatistics,
  type PoolHealthStatus,
  type GlobalPoolStatistics,
};
