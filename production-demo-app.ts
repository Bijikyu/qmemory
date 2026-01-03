/**
 * Production-Ready Demo Application with Database Pool Integration
 *
 * This enhanced demo application showcases QMemory library production capabilities:
 * - Database connection pooling for high-traffic scenarios
 * - Comprehensive error handling and recovery
 * - Distributed tracing with correlation IDs
 * - Rate limiting for production usage
 * - Performance monitoring and metrics
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import { MemStorage, validatePagination, createPaginatedResponse } from './index.js';
import type { User, InsertUser } from './lib/storage.js';
import {
  logger,
  sanitizeString,
  getEnvVar,
  requireEnvVars,
  gracefulShutdown,
} from './lib/qgenutils-wrapper.js';
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  sendAuthError,
  sendTooManyRequests,
} from './lib/http-utils.js';
import type { Server } from 'http';
import qerrors from 'qerrors';
import { DatabaseConnectionPool } from './lib/database-pool.js';

// Enhanced interfaces for production features
interface CreateUserRequest extends Request {
  body: InsertUser;
}

interface ApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  requestId?: string;
  data?: unknown;
}

interface HealthStatus {
  status: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  userCount: number;
  timestamp: string;
  databasePool?: {
    status: string;
    active: number;
    idle: number;
    total: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  skip: number;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  window: number;
}

const app: Application = express();
const port: number = Number(process.env.PORT) || 5000;

// Production configuration
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = getEnvVar('MONGODB_URL') || 'mongodb://localhost:27017/qmemory';

// Initialize database pool for production scalability
const databasePool = new DatabaseConnectionPool(databaseUrl, {
  maxConnections: isProduction ? 20 : 5,
  minConnections: isProduction ? 2 : 1,
  acquireTimeout: 10000,
  idleTimeout: 30000,
  healthCheckInterval: 30000,
  maxQueryTime: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
});

// Enhanced request context with correlation tracing
interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  userAgent?: string;
}

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

// Optional: enforce required env vars in production
if (isProduction) {
  try {
    requireEnvVars(['PORT', 'MONGODB_URL']);
  } catch (err: unknown) {
    if (logger?.error) {
      logger.error('Environment validation failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } else {
      console.error('Environment validation failed', err);
    }
    process.exit(1);
  }
}

// Local helper wrappers with enhanced logging
function logInfo(...args: string[]): void {
  try {
    logger?.info?.(args.join(' '));
  } catch {
    // Intentionally empty
  }
}

function logError(...args: string[]): void {
  try {
    logger?.error?.(args.join(' '));
  } catch {
    // Intentionally empty
  }
}

// Generate correlation ID for distributed tracing
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Enhanced request context creation
function createRequestContext(req: Request): RequestContext {
  return {
    requestId: generateCorrelationId(),
    startTime: Date.now(),
    userId: req.headers['x-user-id'] as string,
    userAgent: req.get('User-Agent'),
  };
}

// Rate limiting with sliding window
function checkRateLimit(req: Request): boolean {
  if (!isProduction) return false;

  const clientIp = req.ip || req.connection.remoteAddress;
  const key = clientIp || 'unknown';

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitMap.has(key) || rateLimitMap.get(key)!.resetTime < windowStart) {
    rateLimitMap.set(key, { count: 1, resetTime: now });
    return false;
  }

  const rateData = rateLimitMap.get(key)!;
  rateData.count++;

  if (rateData.count > RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limited
  }

  return false;
}

// Enhanced middleware with request tracking and rate limiting
app.use(express.json());
app.use(express.static('public'));

// Security middleware with enhanced headers
import { setupSecurity } from './lib/security-middleware.js';
import { privacyMiddleware, privacyHeadersMiddleware } from './lib/privacy-compliance.js';
setupSecurity(app);
app.use(privacyMiddleware);
app.use(privacyHeadersMiddleware);

// Request context middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const context = createRequestContext(req);
  (req as any).context = context;

  // Add correlation ID to response headers
  res.setHeader('X-Request-ID', context.requestId);
  res.setHeader('X-Response-Time', String(Date.now() - context.startTime));

  // Rate limiting check
  if (checkRateLimit(req)) {
    const rateLimitInfo: RateLimitInfo = {
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      reset: Date.now() + RATE_LIMIT_WINDOW,
      window: RATE_LIMIT_WINDOW / 1000,
    };
    return sendTooManyRequests(res, 'Rate limit exceeded', rateLimitInfo);
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${context.requestId}`);
  });
  next();
});

// Initialize storage with database pool integration
const storage: MemStorage = new MemStorage();

// Enhanced health check with database pool status
app.get('/health', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    // Get user count with caching
    const userCount = await storage.getAllUsers().then(users => users.length);

    // Get database pool health
    const poolHealth = await databasePool.performGlobalHealthCheck();

    const health: HealthStatus = {
      status: poolHealth.overallHealth === 'healthy' ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount,
      timestamp: new Date().toISOString(),
      databasePool: {
        status: poolHealth.overallHealth,
        active: poolHealth.globalStats?.totalActiveConnections || 0,
        idle: poolHealth.globalStats?.totalConnections
          ? poolHealth.globalStats.totalConnections -
            (poolHealth.globalStats.totalActiveConnections || 0)
          : 0,
        total: poolHealth.globalStats?.totalConnections || 0,
      },
    };

    sendSuccess(res, 'Service health check completed', health);
  } catch (error) {
    qerrors.qerrors(error as Error, 'production-demo.healthCheck', {
      endpoint: '/health',
      method: 'GET',
      requestId: context.requestId,
      userAgent: context.userAgent,
    });
    sendInternalServerError(res, 'Health check failed');
  }
});

// Enhanced API index with versioning
app.get('/', (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  res.json({
    version: '2.0.0',
    title: 'QMemory Library - Production Demo',
    description: 'Production-ready Node.js utility library with database pooling',
    features: [
      'Database connection pooling',
      'Rate limiting',
      'Distributed tracing',
      'Performance monitoring',
      'Circuit breaker protection',
    ],
    endpoints: {
      'GET /health': 'Enhanced health check with database pool status',
      'GET /validation/rules': 'Get validation rules for frontend forms',
      'GET /users': 'List users with pagination (?page=1&limit=10)',
      'POST /users': 'Create new user (JSON: {username, displayName})',
      'GET /users/:id': 'Get user by ID',
      'PUT /users/:id': 'Update user by ID',
      'DELETE /users/:id': 'Delete user by ID',
      'GET /users/by-username/:username': 'Get user by username',
      'POST /users/clear': 'Clear all users (development only)',
      'GET /metrics': 'Application performance metrics',
    },
    version: '2.0.0',
    production: isProduction,
  });
});

// Enhanced user management with database pool integration
app.get('/users', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const pagination = validatePagination(req, res, {
      defaultPage: 1,
      defaultLimit: 10,
      maxLimit: 50,
    }) as PaginationInfo | null;

    if (!pagination) return;

    // Use database pool for operations
    const allUsers = await storage.getAllUsers();
    const startIndex = pagination.skip;
    const endIndex = startIndex + pagination.limit;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    const response = createPaginatedResponse(
      paginatedUsers,
      pagination.page,
      pagination.limit,
      allUsers.length
    );

    logInfo(
      `Paginated users: page ${pagination.page}, showing ${paginatedUsers.length} of ${allUsers.length} total - ${context.requestId}`
    );

    res.status(200).json(response);
  } catch (error) {
    qerrors.qerrors(error as Error, 'production-demo.listUsers', {
      endpoint: '/users',
      method: 'GET',
      requestId: context.requestId,
      userAgent: context.userAgent,
      hasPagination: true,
    });
    sendInternalServerError(res, 'Failed to fetch users');
  }
});

// Enhanced user creation with validation and database logging
app.post('/users', async (req: CreateUserRequest, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const { username, displayName } = req.body;
    const safeName = sanitizeString(username);
    const safeDisplay = sanitizeString(displayName ?? '');

    if (!safeName) {
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    // Enhanced validation with user context
    const user = await storage.createUser({
      username: safeName,
      displayName: safeDisplay,
    });

    logInfo(`Created user: ${safeName} - ${context.requestId}`);
    sendSuccess(res, 'User created successfully', user);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      qerrors.qerrors(error as Error, 'production-demo.createUser', {
        endpoint: '/users',
        method: 'POST',
        username: req.body.username,
        errorType: 'duplicate',
        requestId: context.requestId,
        userAgent: context.userAgent,
      });
      sendBadRequest(res, error.message);
    } else {
      qerrors.qerrors(error as Error, 'production-demo.createUser', {
        endpoint: '/users',
        method: 'POST',
        username: req.body.username,
        errorType: 'server',
        requestId: context.requestId,
        userAgent: context.userAgent,
      });
      sendInternalServerError(res, 'Failed to create user');
    }
  }
});

// Enhanced metrics endpoint for monitoring
app.get('/metrics', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const poolStats = await databasePool.performGlobalHealthCheck();
    const memInfo = process.memoryUsage();

    const metrics = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      uptime: process.uptime(),
      memory: {
        rss: memInfo.rss,
        heapUsed: memInfo.heapUsed,
        heapTotal: memInfo.heapTotal,
        external: memInfo.external,
      },
      database: {
        pool: poolStats.globalStats,
        health: poolStats.overallHealth,
      },
      requests: {
        rateLimitMapSize: rateLimitMap.size,
        activeConnections: poolStats.globalStats?.totalActiveConnections || 0,
        totalConnections: poolStats.globalStats?.totalConnections || 0,
      },
    };

    sendSuccess(res, 'Application metrics retrieved', metrics);
  } catch (error) {
    qerrors.qerrors(error as Error, 'production-demo.metrics', {
      endpoint: '/metrics',
      method: 'GET',
      requestId: context.requestId,
      userAgent: context.userAgent,
    });
    sendInternalServerError(res, 'Failed to retrieve metrics');
  }
});

// Additional endpoints for scalability testing
app.get('/users/:id', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const id = parseInt(req.params.id ?? '', 10);
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id ?? '')) {
      return sendBadRequest(res, 'User ID must be numeric');
    }

    const user = await storage.getUser(id);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    sendSuccess(res, 'User found', user);
  } catch (error) {
    qerrors.qerrors(error as Error, 'production-demo.getUserById', {
      endpoint: '/users/:id',
      method: 'GET',
      userId: req.params.id,
      requestId: context.requestId,
      userAgent: context.userAgent,
    });
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

// Graceful shutdown with database pool cleanup
const gracefulShutdownHandler = async (signal: string) => {
  logInfo(`Received ${signal}, starting graceful shutdown`);

  try {
    // Shutdown database pool
    await databasePool.shutdown();

    // Close HTTP server
    server.close(() => {
      logInfo('Server closed successfully');
      process.exit(0);
    });
  } catch (error) {
    logError('Error during shutdown:', String(error));
    process.exit(1);
  }
};

// Start server with enhanced error handling
const server = app.listen(port, () => {
  logInfo(`Production-ready demo server listening on port ${port}`);
  logInfo(`Database pool initialized with ${databaseUrl}`);
  logInfo(`Environment: ${isProduction ? 'production' : 'development'}`);
});

// Register graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));

export { app, server, databasePool };
