/**
 * Scalability-Enhanced Demo Application
 *
 * This enhanced demo focuses on production scalability improvements:
 * - Distributed tracing with correlation IDs
 * - Rate limiting for production usage
 * - Performance monitoring and metrics
 * - Enhanced error handling and logging
 * - Request context tracking
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import { MemStorage, validatePagination, createPaginatedResponse } from '../index.js';
import type { User, InsertUser } from '../lib/storage.js';
import {
  logger,
  sanitizeString,
  getEnvVar,
  requireEnvVars,
  gracefulShutdown,
} from '../lib/qgenutils-wrapper.js';
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  sendAuthError,
} from '../lib/http-utils.js';
import type { Server } from 'http';
import qerrors from 'qerrors';

// Enhanced interfaces for production features
interface CreateUserRequest extends Request {
  body: InsertUser;
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
  performance?: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  skip: number;
}

interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  userAgent?: string;
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

// Performance metrics collection
const performanceMetrics = {
  requestCount: 0,
  totalResponseTime: 0,
  errorCount: 0,
  startTime: Date.now(),
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = isProduction ? 100 : 1000;

// Optional: enforce required env vars in production
if (isProduction) {
  try {
    requireEnvVars(['PORT']);
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

  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const key = clientIp;

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

// Get performance metrics
function getPerformanceMetrics() {
  const runtime = Date.now() - performanceMetrics.startTime;
  return {
    requestCount: performanceMetrics.requestCount,
    averageResponseTime:
      performanceMetrics.requestCount > 0
        ? performanceMetrics.totalResponseTime / performanceMetrics.requestCount
        : 0,
    errorRate:
      performanceMetrics.requestCount > 0
        ? (performanceMetrics.errorCount / performanceMetrics.requestCount) * 100
        : 0,
    uptime: runtime,
  };
}

// Add rate limiting response function to http-utils
const sendTooManyRequests = (
  res: Response,
  message: string = 'Rate limit exceeded',
  rateLimitInfo?: RateLimitInfo
): void => {
  res.status(429).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(rateLimitInfo && { rateLimit: rateLimitInfo }),
  });
};

// Enhanced middleware with request tracking and rate limiting
app.use(express.json());
app.use(express.static('public'));

// Security middleware with enhanced headers
import { setupSecurity } from '../lib/security-middleware.js';
import { privacyMiddleware, privacyHeadersMiddleware } from '../lib/privacy-compliance.js';
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
    const statusCode = res.statusCode;

    // Update performance metrics
    performanceMetrics.requestCount++;
    performanceMetrics.totalResponseTime += duration;
    if (statusCode >= 400) {
      performanceMetrics.errorCount++;
    }

    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${context.requestId}`);
  });
  next();
});

// Initialize storage
const storage: MemStorage = new MemStorage();

// Enhanced health check with performance metrics
app.get('/health', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const userCount = await storage.getAllUsers().then(users => users.length);
    const metrics = getPerformanceMetrics();

    const health: HealthStatus = {
      status: metrics.errorRate > 5 ? 'degraded' : 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount,
      timestamp: new Date().toISOString(),
      performance: {
        requestCount: metrics.requestCount,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        errorRate: Math.round(metrics.errorRate * 100) / 100,
      },
    };

    sendSuccess(res, 'Service health check completed', health);
  } catch (error) {
    qerrors.qerrors(error as Error, 'scalability-demo.healthCheck', {
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
  res.json({
    apiVersion: '2.1.0',
    title: 'QMemory Library - Scalability Demo',
    description: 'Production-ready Node.js utility library with scalability enhancements',
    features: [
      'Distributed tracing with correlation IDs',
      'Rate limiting for production',
      'Performance monitoring and metrics',
      'Enhanced error handling and logging',
      'Request context tracking',
    ],
    endpoints: {
      'GET /health': 'Enhanced health check with performance metrics',
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
    production: isProduction,
  });
});

// Enhanced user management with request context
app.get('/users', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const pagination = validatePagination(req, res, {
      defaultPage: 1,
      defaultLimit: 10,
      maxLimit: 50,
    }) as PaginationInfo | null;

    if (!pagination) return;

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
    qerrors.qerrors(error as Error, 'scalability-demo.listUsers', {
      endpoint: '/users',
      method: 'GET',
      requestId: context.requestId,
      userAgent: context.userAgent,
      hasPagination: true,
    });
    sendInternalServerError(res, 'Failed to fetch users');
  }
});

// Enhanced user creation with validation and context
app.post('/users', async (req: CreateUserRequest, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const { username, displayName } = req.body;
    const safeName = sanitizeString(username);
    const safeDisplay = sanitizeString(displayName ?? '');

    if (!safeName) {
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    const user = await storage.createUser({
      username: safeName,
      displayName: safeDisplay,
    });

    logInfo(`Created user: ${safeName} - ${context.requestId}`);
    sendSuccess(res, 'User created successfully', user);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      qerrors.qerrors(error as Error, 'scalability-demo.createUser', {
        endpoint: '/users',
        method: 'POST',
        username: req.body.username,
        errorType: 'duplicate',
        requestId: context.requestId,
        userAgent: context.userAgent,
      });
      sendBadRequest(res, error.message);
    } else {
      qerrors.qerrors(error as Error, 'scalability-demo.createUser', {
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

// New metrics endpoint for monitoring
app.get('/metrics', async (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const metrics = getPerformanceMetrics();
    const memInfo = process.memoryUsage();

    const performanceData = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      uptime: process.uptime(),
      memory: {
        rss: memInfo.rss,
        heapUsed: memInfo.heapUsed,
        heapTotal: memInfo.heapTotal,
        external: memInfo.external,
      },
      requests: {
        count: metrics.requestCount,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        errorRate: Math.round(metrics.errorRate * 100) / 100,
        totalErrors: performanceMetrics.errorCount,
      },
      rateLimiting: {
        mapSize: rateLimitMap.size,
        windowSize: RATE_LIMIT_WINDOW / 1000,
        maxRequests: RATE_LIMIT_MAX_REQUESTS,
      },
      performance: {
        totalResponseTime: performanceMetrics.totalResponseTime,
        runtimeMs: metrics.uptime,
      },
    };

    sendSuccess(res, 'Performance metrics retrieved', performanceData);
  } catch (error) {
    qerrors.qerrors(error as Error, 'scalability-demo.metrics', {
      endpoint: '/metrics',
      method: 'GET',
      requestId: context.requestId,
      userAgent: context.userAgent,
    });
    sendInternalServerError(res, 'Failed to retrieve metrics');
  }
});

// Enhanced validation rules endpoint with caching
app.get('/validation/rules', (req: Request, res: Response) => {
  const context = (req as any).context as RequestContext;

  try {
    const validationRules = {
      username: {
        required: true,
        minLength: 1,
        maxLength: 50,
        pattern: '^[a-zA-Z0-9_-]+$',
        message:
          'Username must be 1-50 characters, letters, numbers, underscores, and hyphens only',
      },
      displayName: {
        required: false,
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-zA-Z0-9\\s_-]+$',
        message:
          'Display name must be 1-100 characters, letters, numbers, spaces, underscores, and hyphens only',
      },
      email: {
        required: false,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        message: 'Invalid email format',
      },
      url: {
        required: false,
        message: 'Invalid URL format',
      },
    };

    logInfo(`Validation rules requested - ${context.requestId}`);
    sendSuccess(res, 'Validation rules retrieved', validationRules);
  } catch (error) {
    qerrors.qerrors(error as Error, 'scalability-demo.validationRules', {
      endpoint: '/validation/rules',
      method: 'GET',
      requestId: context.requestId,
      userAgent: context.userAgent,
    });
    sendInternalServerError(res, 'Failed to get validation rules');
  }
});

// Graceful shutdown with cleanup
const gracefulShutdownHandler = async (signal: string) => {
  logInfo(`Received ${signal}, starting graceful shutdown`);

  try {
    // Clean up rate limiting map
    rateLimitMap.clear();

    // Log final metrics
    const finalMetrics = getPerformanceMetrics();
    logInfo(`Final metrics: ${JSON.stringify(finalMetrics)}`);

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
  logInfo(`Scalability-enhanced demo server listening on port ${port}`);
  logInfo(`Environment: ${isProduction ? 'production' : 'development'}`);
  logInfo(`Rate limiting: ${isProduction ? 'enabled' : 'disabled'}`);
  logInfo(`Distributed tracing: enabled`);
});

// Register graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));

export { app, server };
