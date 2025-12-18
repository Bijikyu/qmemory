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
import DatabaseConnectionPool from './database/connection-pool-manager.js';

// Interface for database configuration
interface DatabaseConfig {
  min?: number;
  max?: number;
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

// Interface for pool statistics
interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  [databaseUrl: string]: any;
}

// Interface for health status
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  pools: Record<string, any>;
  timestamp: Date;
}

// Create singleton instance for immediate use across the application
const databaseConnectionPool = new DatabaseConnectionPool();

// Convenience functions for common operations
const createDatabasePool = (databaseUrl: string, config: DatabaseConfig = {}): Promise<void> =>
  databaseConnectionPool.createPool(databaseUrl, config);

const acquireDatabaseConnection = async (databaseUrl: string): Promise<any> =>
  databaseConnectionPool.acquireConnection(databaseUrl);

const releaseDatabaseConnection = (databaseUrl: string, connection: any): Promise<void> =>
  databaseConnectionPool.releaseConnection(databaseUrl, connection);

const executeDatabaseQuery = async (databaseUrl: string, query: string, params: any[] = []): Promise<any> =>
  databaseConnectionPool.executeQuery(databaseUrl, query, params);

const getDatabasePoolStats = (): any =>
  databaseConnectionPool.getPoolStats();

const getDatabasePoolHealth = (): any =>
  databaseConnectionPool.getHealthStatus();

const shutdownDatabasePools = async (): Promise<void> =>
  databaseConnectionPool.shutdown();

export {
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