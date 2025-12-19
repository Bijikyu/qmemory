const mockCreatePool = jest.fn().mockResolvedValue(undefined);
const mockGetPool = jest.fn().mockReturnValue(null);
const mockGetOrCreatePool = jest.fn().mockResolvedValue({} as any);
const mockRemovePool = jest.fn().mockResolvedValue(undefined);
const mockGetPoolUrls = jest.fn().mockReturnValue(['redis://example']);
const mockGetAllPools = jest.fn().mockReturnValue([{ dbType: 'redis' }]);
const mockGetAllStats = jest.fn().mockReturnValue({
  'redis://example': {
    active: 1,
    idle: 2,
    healthy: 2,
    total: 3,
    waiting: 0,
    max: 5,
    min: 1,
    dbType: 'redis',
  },
});
const mockGetAllHealthStatus = jest.fn().mockReturnValue({
  'redis://example': {
    status: 'healthy',
    stats: mockGetAllStats().['redis://example'],
    issues: [],
  },
});
const mockGetGlobalStats = jest.fn().mockReturnValue({
  totalPools: 1,
  totalConnections: 3,
  totalActiveConnections: 1,
  totalWaitingRequests: 0,
  poolsByType: { redis: 1 },
  overallHealth: 'healthy',
});
const mockExecuteQuery = jest.fn().mockResolvedValue('query-result');
const mockAcquireConnection = jest.fn().mockResolvedValue({ id: 'conn' });
const mockReleaseConnection = jest.fn().mockResolvedValue(undefined);
const mockPerformGlobalHealthCheck = jest.fn().mockResolvedValue(
  mockGetAllHealthStatus(),
);
const mockShutdown = jest.fn().mockResolvedValue(undefined);
const mockGetPoolCount = jest.fn().mockReturnValue(1);
const mockHasPool = jest.fn().mockReturnValue(true);
const mockGetPoolsByType = jest.fn().mockReturnValue([{ dbType: 'redis' }]);
const mockGetPoolUrlsByType = jest.fn().mockReturnValue(['redis://example']);

jest.mock('../../lib/database/connection-pool-manager.js', () => {
  class DatabaseConnectionPoolMock {
    createPool = mockCreatePool;
    getPool = mockGetPool;
    getOrCreatePool = mockGetOrCreatePool;
    removePool = mockRemovePool;
    getPoolUrls = mockGetPoolUrls;
    getAllPools = mockGetAllPools;
    getAllStats = mockGetAllStats;
    getAllHealthStatus = mockGetAllHealthStatus;
    getGlobalStats = mockGetGlobalStats;
    executeQuery = mockExecuteQuery;
    acquireConnection = mockAcquireConnection;
    releaseConnection = mockReleaseConnection;
    performGlobalHealthCheck = mockPerformGlobalHealthCheck;
    shutdown = mockShutdown;
    getPoolCount = mockGetPoolCount;
    hasPool = mockHasPool;
    getPoolsByType = mockGetPoolsByType;
    getPoolUrlsByType = mockGetPoolUrlsByType;
  }

  return {
    DatabaseConnectionPool: DatabaseConnectionPoolMock,
    databaseConnectionPool: new DatabaseConnectionPoolMock(),
  };
});

import {
  createDatabasePool,
  acquireDatabaseConnection,
  releaseDatabaseConnection,
  executeDatabaseQuery,
  getDatabasePoolStats,
  getDatabasePoolHealth,
  shutdownDatabasePools,
  getDatabasePool,
  createOrGetDatabasePool,
  removeDatabasePool,
  getAllDatabasePoolUrls,
  getAllDatabasePools,
  getGlobalDatabaseStatistics,
  performGlobalDatabaseHealthCheck,
  getDatabasePoolCount,
  hasDatabasePool,
  getDatabasePoolsByType,
  getDatabasePoolUrlsByType,
  databaseConnectionPool,
} from '../../lib/database-pool.js';

describe('database-pool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createDatabasePool delegates to pool manager', async () => {
    await createDatabasePool('redis://localhost', { maxConnections: 10 });
    expect(mockCreatePool).toHaveBeenCalledWith('redis://localhost', {
      maxConnections: 10,
    });
  });

  test('executeDatabaseQuery proxies to pool manager and returns result', async () => {
    const result = await executeDatabaseQuery(
      'redis://localhost',
      'ping',
      [],
      { maxConnections: 5 },
    );

    expect(mockExecuteQuery).toHaveBeenCalledWith(
      'redis://localhost',
      'ping',
      [],
      { maxConnections: 5 },
    );
    expect(result).toBe('query-result');
  });

  test('statistics helpers expose typed data', () => {
    const stats = getDatabasePoolStats();
    const health = getDatabasePoolHealth();
    const globalStats = getGlobalDatabaseStatistics();

    expect(stats['redis://example'].total).toBe(3);
    expect(health['redis://example'].status).toBe('healthy');
    expect(globalStats.totalPools).toBe(1);
  });

  test('connection lifecycle helpers forward interactions', async () => {
    await acquireDatabaseConnection('redis://localhost');
    expect(mockAcquireConnection).toHaveBeenCalled();

    await releaseDatabaseConnection('redis://localhost', { id: 'conn' });
    expect(mockReleaseConnection).toHaveBeenCalledWith('redis://localhost', {
      id: 'conn',
    });

    await shutdownDatabasePools();
    expect(mockShutdown).toHaveBeenCalled();
  });

  test('pool enumeration helpers expose data sets', async () => {
    await createOrGetDatabasePool('redis://localhost');
    expect(mockGetOrCreatePool).toHaveBeenCalled();

    await removeDatabasePool('redis://localhost');
    expect(mockRemovePool).toHaveBeenCalled();

    expect(getDatabasePool('redis://example')).toBeNull();
    expect(getAllDatabasePoolUrls()).toEqual(['redis://example']);
    expect(getAllDatabasePools()).toEqual([{ dbType: 'redis' }]);
    expect(getDatabasePoolCount()).toBe(1);
    expect(hasDatabasePool('redis://example')).toBe(true);
    expect(getDatabasePoolsByType('redis')).toEqual([{ dbType: 'redis' }]);
    expect(getDatabasePoolUrlsByType('redis')).toEqual(['redis://example']);
  });

  test('performGlobalDatabaseHealthCheck forwards to manager', async () => {
    const health = await performGlobalDatabaseHealthCheck();
    expect(health['redis://example'].status).toBe('healthy');
    expect(mockPerformGlobalHealthCheck).toHaveBeenCalled();
  });

  test('local databaseConnectionPool instance exposes same API', async () => {
    await databaseConnectionPool.createPool('redis://secondary');
    expect(mockCreatePool).toHaveBeenCalledWith('redis://secondary', undefined);
  });
});
