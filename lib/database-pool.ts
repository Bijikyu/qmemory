/**
 * Database Connection Pool Manager
 * Provides strict typing and runtime validation around the underlying
 * JavaScript connection pool implementation so TypeScript consumers
 * receive predictable structures and meaningful failures when data
 * falls outside expected contracts.
 */

import SimpleDatabasePool from './database/simple-pool.js';
import {
  DatabaseConnectionPool,
  databaseConnectionPool as sharedDatabaseConnectionPool,
} from './database/connection-pool-manager.js';
import qerrors from 'qerrors';
import { createModuleUtilities, validateObject, validateObjectOrNull } from './common-patterns.js';

const utils = createModuleUtilities('database-pool');

export interface DatabasePoolConfig {
  maxConnections?: number;
  minConnections?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  healthCheckInterval?: number;
  maxQueryTime?: number;
  retryAttempts?: number;
  retryDelay?: number;
  // Additional configuration values are allowed but must be explicitly handled by callers.
  [key: string]: unknown;
}

export interface PoolStatistics {
  active: number;
  idle: number;
  healthy: number;
  total: number;
  waiting: number;
  max: number;
  min: number;
  dbType: string;
}

export interface PoolHealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  stats: PoolStatistics;
  issues: string[];
}

export interface GlobalPoolStatistics {
  totalPools: number;
  totalConnections: number;
  totalActiveConnections: number;
  totalWaitingRequests: number;
  poolsByType: Record<string, number>;
  overallHealth: 'healthy' | 'warning' | 'critical';
}

type QueryFunction = () => Promise<unknown>;
type RedisMethodDescriptor = { method: string };
type QueryDefinition = string | RedisMethodDescriptor | QueryFunction;

type SimpleDatabasePoolInstance = InstanceType<typeof SimpleDatabasePool>;

interface DatabaseConnectionPoolAPI {
  createPool(databaseUrl: string, config?: DatabasePoolConfig): Promise<void>;
  getPool(databaseUrl: string): SimpleDatabasePoolInstance | null | undefined;
  getOrCreatePool(
    databaseUrl: string,
    config?: DatabasePoolConfig
  ): Promise<SimpleDatabasePoolInstance | null | undefined>;
  removePool(databaseUrl: string): Promise<void>;
  getPoolUrls(): unknown;
  getAllPools(): unknown;
  getAllStats(): unknown;
  getAllHealthStatus(): unknown;
  getGlobalStats(): unknown;
  executeQuery(
    databaseUrl: string,
    query: QueryDefinition,
    params?: unknown[],
    config?: DatabasePoolConfig
  ): Promise<unknown>;
  acquireConnection(databaseUrl: string, config?: DatabasePoolConfig): Promise<unknown>;
  releaseConnection(databaseUrl: string, connection: unknown): Promise<void>;
  performGlobalHealthCheck(): Promise<unknown> | unknown;
  shutdown(): Promise<void>;
  getPoolCount(): unknown;
  hasPool(databaseUrl: string): unknown;
  getPoolsByType(dbType: string): unknown;
  getPoolUrlsByType(dbType: string): unknown;
}

type SimpleDatabasePoolContract = {
  getStats: () => unknown;
  getHealthStatus: () => unknown;
  acquireConnection: (...args: unknown[]) => unknown;
  releaseConnection: (...args: unknown[]) => unknown;
  shutdown: (...args: unknown[]) => unknown;
};

// Explicit mapping of supported health states so invalid values surface immediately.
const HEALTH_STATUSES: ReadonlySet<PoolHealthStatus['status']> = new Set([
  'healthy',
  'warning',
  'critical',
]);

// Confirm pool objects either originate from SimpleDatabasePool or satisfy the same surface.
function isSimplePoolInstance(value: unknown): value is SimpleDatabasePoolInstance {
  if (value instanceof SimpleDatabasePool) {
    return true;
  }
  validateObjectOrNull(value, 'pool instance');
  const candidate = value as Partial<SimpleDatabasePoolContract>;
  return (
    typeof candidate.getStats === 'function' &&
    typeof candidate.getHealthStatus === 'function' &&
    typeof candidate.acquireConnection === 'function' &&
    typeof candidate.releaseConnection === 'function' &&
    typeof candidate.shutdown === 'function'
  );
}

// Guard numeric metrics to prevent NaN/Infinity from flowing into consumers.
function assertFiniteNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`${context} must be a finite number`);
  }
  return value;
}

// Ensure descriptive strings remain meaningful for downstream logging.
function assertNonEmptyString(value: unknown, context: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${context} must be a non-empty string`);
  }
  return value;
}

// Confirm arrays contain only strings; mixed types signal data corruption.
function assertStringArray(value: unknown, context: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`${context} must be an array of strings`);
  }
  return value;
}

// Validate that every entry is a SimpleDatabasePool instance for safe method access.
function assertSimplePoolArray(value: unknown, context: string): SimpleDatabasePoolInstance[] {
  if (!Array.isArray(value) || value.some(pool => !isSimplePoolInstance(pool))) {
    throw new Error(`${context} must be an array of SimpleDatabasePool instances`);
  }
  return value as SimpleDatabasePoolInstance[];
}

// Map database type tallies while enforcing numeric counts.
function assertPoolsByTypeRecord(value: unknown, context: string): Record<string, number> {
  if (value === undefined) {
    return {};
  }
  validateObject(value, `${context} must be an object map of pool counts`);
  const record: Record<string, number> = {};
  for (const [key, count] of Object.entries(value as Record<string, unknown>)) {
    record[key] = assertFiniteNumber(count, `${context}.${key}`);
  }
  return record;
}

// Normalize individual pool metric snapshots, rejecting malformed payloads.
function assertPoolStatistics(value: unknown, context: string): PoolStatistics {
  validateObject(value, `${context} must be an object containing pool statistics`);
  const stats = value as Record<string, unknown>;
  return {
    active: assertFiniteNumber(stats.active, `${context}.active`),
    idle: assertFiniteNumber(stats.idle, `${context}.idle`),
    healthy: assertFiniteNumber(stats.healthy, `${context}.healthy`),
    total: assertFiniteNumber(stats.total, `${context}.total`),
    waiting: assertFiniteNumber(stats.waiting, `${context}.waiting`),
    max: assertFiniteNumber(stats.max, `${context}.max`),
    min: assertFiniteNumber(stats.min, `${context}.min`),
    dbType: assertNonEmptyString(stats.dbType, `${context}.dbType`),
  };
}

// Translate arbitrary records into strongly typed stats dictionaries.
function assertPoolStatisticsRecord(
  value: unknown,
  context: string
): Record<string, PoolStatistics> {
  if (value === null || typeof value !== 'object') {
    throw new Error(`${context} must return an object keyed by database URL`);
  }
  const record: Record<string, PoolStatistics> = {};
  for (const [key, stats] of Object.entries(value as Record<string, unknown>)) {
    record[key] = assertPoolStatistics(stats, `${context}[${key}]`);
  }
  return record;
}

// Validate per-pool health entries, including nested statistics and textual issue details.
function assertHealthStatus(value: unknown, context: string): PoolHealthStatus {
  validateObject(value, `${context} must be an object containing pool health data`);
  const health = value as Record<string, unknown>;
  const status = assertNonEmptyString(health.status, `${context}.status`);
  if (!HEALTH_STATUSES.has(status as PoolHealthStatus['status'])) {
    throw new Error(`${context}.status must be one of ${Array.from(HEALTH_STATUSES).join(', ')}`);
  }
  return {
    status: status as PoolHealthStatus['status'],
    stats: assertPoolStatistics(health.stats, `${context}.stats`),
    issues: assertStringArray(health.issues, `${context}.issues`),
  };
}

// Guard health maps to ensure each database URL yields a valid health snapshot.
function assertPoolHealthRecord(value: unknown, context: string): Record<string, PoolHealthStatus> {
  if (value === null || typeof value !== 'object') {
    throw new Error(`${context} must return an object keyed by database URL`);
  }
  const record: Record<string, PoolHealthStatus> = {};
  for (const [key, health] of Object.entries(value as Record<string, unknown>)) {
    record[key] = assertHealthStatus(health, `${context}[${key}]`);
  }
  return record;
}

// Restrict health strings to the sanctioned set emitted by the pool layer.
function assertOverallHealth(
  value: unknown,
  context: string
): GlobalPoolStatistics['overallHealth'] {
  const status = assertNonEmptyString(value, context);
  if (!HEALTH_STATUSES.has(status as PoolHealthStatus['status'])) {
    throw new Error(`${context} must be one of ${Array.from(HEALTH_STATUSES).join(', ')}`);
  }
  return status as GlobalPoolStatistics['overallHealth'];
}

// Validate the aggregated statistics payload pulled from the connection manager.
function assertGlobalStatistics(value: unknown, context: string): GlobalPoolStatistics {
  validateObject(value, `${context} must return an object with global statistics`);
  const stats = value as Record<string, unknown>;
  return {
    totalPools: assertFiniteNumber(stats.totalPools, `${context}.totalPools`),
    totalConnections: assertFiniteNumber(stats.totalConnections, `${context}.totalConnections`),
    totalActiveConnections: assertFiniteNumber(
      stats.totalActiveConnections,
      `${context}.totalActiveConnections`
    ),
    totalWaitingRequests: assertFiniteNumber(
      stats.totalWaitingRequests,
      `${context}.totalWaitingRequests`
    ),
    poolsByType: assertPoolsByTypeRecord(stats.poolsByType, `${context}.poolsByType`),
    overallHealth: assertOverallHealth(stats.overallHealth, `${context}.overallHealth`),
  };
}

// Shared singleton surfaced by the connection-pool manager module (JS implementation).
const connectionPoolManager: DatabaseConnectionPoolAPI =
  sharedDatabaseConnectionPool as unknown as DatabaseConnectionPoolAPI;

// Local instance exported for callers who prefer a dedicated manager object.
const databaseConnectionPool = new DatabaseConnectionPool();

// Provision a pool for the provided database URL, delegating configuration as-is.
function createDatabasePool(databaseUrl: string, config: DatabasePoolConfig = {}): Promise<void> {
  try {
    return connectionPoolManager.createPool(databaseUrl, config);
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-pool.createDatabasePool', {
      databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***:***@'), // Sanitize potential credentials
      configKeys: Object.keys(config),
      hasMaxConnections: config.maxConnections !== undefined,
      hasMinConnections: config.minConnections !== undefined,
    });
    throw error;
  }
}

// Fetch an existing pool while ensuring the returned instance matches the expected class.
function getDatabasePool(databaseUrl: string): SimpleDatabasePoolInstance | null {
  try {
    const pool = connectionPoolManager.getPool(databaseUrl);
    if (pool == null) {
      return null;
    }
    if (!isSimplePoolInstance(pool)) {
      throw new Error('Retrieved pool does not match SimpleDatabasePool instance');
    }
    return pool;
  } catch (error) {
    utils.logError(error as Error, 'getDatabasePool', {
      databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***:***@'), // Sanitize potential credentials
    });
    throw error;
  }
}

// Lazily create or fetch a pool, guaranteeing a valid SimpleDatabasePool is returned.
async function createOrGetDatabasePool(
  databaseUrl: string,
  config: DatabasePoolConfig = {}
): Promise<SimpleDatabasePoolInstance> {
  try {
    const pool = await connectionPoolManager.getOrCreatePool(databaseUrl, config);
    if (!isSimplePoolInstance(pool)) {
      throw new Error('getOrCreatePool must return a SimpleDatabasePool instance');
    }
    return pool;
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-pool.createOrGetDatabasePool', {
      databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***:***@'), // Sanitize potential credentials
      configKeys: Object.keys(config),
      hasMaxConnections: config.maxConnections !== undefined,
      hasMinConnections: config.minConnections !== undefined,
    });
    throw error;
  }
}

// Remove a pool and trigger graceful teardown on the manager layer.
function removeDatabasePool(databaseUrl: string): Promise<void> {
  return connectionPoolManager.removePool(databaseUrl);
}

// Acquire a connection proxy from the appropriate pool.
function acquireDatabaseConnection(
  databaseUrl: string,
  config?: DatabasePoolConfig
): Promise<unknown> {
  try {
    return connectionPoolManager.acquireConnection(databaseUrl, config);
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-pool.acquireDatabaseConnection', {
      databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***:***@'), // Sanitize potential credentials
      hasConfig: config !== undefined,
      configKeys: config ? Object.keys(config) : undefined,
    });
    throw error;
  }
}

// Release a connection back to its pool, mirroring the manager contract.
function releaseDatabaseConnection(databaseUrl: string, connection: unknown): Promise<void> {
  try {
    return connectionPoolManager.releaseConnection(databaseUrl, connection);
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-pool.releaseDatabaseConnection', {
      databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***:***@'), // Sanitize potential credentials
      hasConnection: connection !== undefined && connection !== null,
      connectionType: typeof connection,
    });
    throw error;
  }
}

// Execute a query or queued operation, enforcing parameter list integrity.
function executeDatabaseQuery(
  databaseUrl: string,
  query: QueryDefinition,
  params: unknown[] = [],
  config?: DatabasePoolConfig
): Promise<unknown> {
  try {
    if (!Array.isArray(params)) {
      throw new Error('Query parameters must be supplied as an array');
    }
    return connectionPoolManager.executeQuery(databaseUrl, query, params, config);
  } catch (error) {
    qerrors.qerrors(error as Error, 'database-pool.executeDatabaseQuery', {
      databaseUrl: databaseUrl.replace(/\/\/.*@/, '//***:***@'), // Sanitize potential credentials
      queryType: typeof query,
      isStringQuery: typeof query === 'string',
      isMethodDescriptor: query && typeof query === 'object' && 'method' in query,
      paramCount: Array.isArray(params) ? params.length : -1,
      hasConfig: config !== undefined,
    });
    throw error;
  }
}

// Retrieve statistics for every registered pool.
function getDatabasePoolStats(): Record<string, PoolStatistics> {
  return assertPoolStatisticsRecord(
    connectionPoolManager.getAllStats(),
    'database pool statistics'
  );
}

// Retrieve health snapshots for every registered pool.
function getDatabasePoolHealth(): Record<string, PoolHealthStatus> {
  return assertPoolHealthRecord(connectionPoolManager.getAllHealthStatus(), 'database pool health');
}

// Request a global shutdown across every pool.
function shutdownDatabasePools(): Promise<void> {
  return connectionPoolManager.shutdown();
}

// Enumerate every pooled database URL.
function getAllDatabasePoolUrls(): string[] {
  return assertStringArray(connectionPoolManager.getPoolUrls(), 'connection pool URLs');
}

// Enumerate every SimpleDatabasePool instance.
function getAllDatabasePools(): SimpleDatabasePoolInstance[] {
  return assertSimplePoolArray(connectionPoolManager.getAllPools(), 'connection pool list');
}

// Aggregate cross-pool statistics into a single object.
function getGlobalDatabaseStatistics(): GlobalPoolStatistics {
  return assertGlobalStatistics(
    connectionPoolManager.getGlobalStats(),
    'global database statistics'
  );
}

// Trigger a health check across all pools and return the detailed map.
async function performGlobalDatabaseHealthCheck(): Promise<Record<string, PoolHealthStatus>> {
  const rawHealth = await connectionPoolManager.performGlobalHealthCheck();
  return assertPoolHealthRecord(rawHealth, 'global health check results');
}

// Enumerate database URLs for a specific pool type.
function getDatabasePoolUrlsByType(dbType: string): string[] {
  const normalizedType = assertNonEmptyString(dbType, 'database type');
  return assertStringArray(
    connectionPoolManager.getPoolUrlsByType(normalizedType),
    `connection pool URLs filtered by type ${normalizedType}`
  );
}

// Count the number of active pools across all types.
function getDatabasePoolCount(): number {
  return assertFiniteNumber(connectionPoolManager.getPoolCount(), 'database pool count');
}

// Determine whether a pool already exists for the requested URL.
function hasDatabasePool(databaseUrl: string): boolean {
  const result = connectionPoolManager.hasPool(databaseUrl);
  if (typeof result !== 'boolean') {
    throw new Error('hasPool must return a boolean');
  }
  return result;
}

// Enumerate pools filtered by database type.
function getDatabasePoolsByType(dbType: string): SimpleDatabasePoolInstance[] {
  const normalizedType = assertNonEmptyString(dbType, 'database type');
  return assertSimplePoolArray(
    connectionPoolManager.getPoolsByType(normalizedType),
    `connection pools filtered by type ${normalizedType}`
  );
}

export {
  SimpleDatabasePool,
  DatabaseConnectionPool,
  databaseConnectionPool,
  createDatabasePool,
  getDatabasePool,
  createOrGetDatabasePool,
  removeDatabasePool,
  acquireDatabaseConnection,
  releaseDatabaseConnection,
  executeDatabaseQuery,
  getDatabasePoolStats,
  getDatabasePoolHealth,
  getGlobalDatabaseStatistics,
  performGlobalDatabaseHealthCheck,
  getAllDatabasePoolUrls,
  getAllDatabasePools,
  getDatabasePoolUrlsByType,
  getDatabasePoolCount,
  hasDatabasePool,
  getDatabasePoolsByType,
  shutdownDatabasePools,
};
