import { setImmediate } from 'timers';

/**
 * QMemory Library Demo Application - Complete API Implementation
 *
 * This is a comprehensive demonstration of the QMemory library's capabilities,
 * showcasing user management, HTTP utilities, storage operations, and security
 * middleware integration. It serves as both a learning tool and a reference
 * implementation for developers using the library.
 *
 * Key Features Demonstrated:
 * - User CRUD operations with validation and error handling
 * - HTTP utility usage for consistent API responses
 * - Security middleware integration for production-ready applications
 * - Pagination support for large datasets
 * - Frontend-backend integration patterns
 * - Comprehensive logging and monitoring
 * - Environment configuration management
 *
 * API Endpoints:
 * - GET / - API information and documentation
 * - GET /health - Service health check
 * - GET /users - Paginated user listing
 * - POST /users - User creation with validation
 * - GET /users/:id - User retrieval by ID
 * - GET /users/by-username/:username - User retrieval by username
 * - PUT /users/:id - User update with validation
 * - DELETE /users/:id - User deletion
 * - GET /validation/rules - Validation rules for frontend
 *
 * Security Features:
 * - Input sanitization and validation
 * - Rate limiting and request throttling
 * - CORS configuration for web applications
 * - Privacy compliance headers
 * - Comprehensive error handling
 * - Request logging and monitoring
 *
 * Performance Optimizations:
 * - Response caching where appropriate
 * - Efficient database queries
 * - Pagination for large datasets
 * - Memory usage monitoring
 * - Graceful shutdown handling
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

/**
 * Type definitions for the demo application
 *
 * These interfaces define the structure of request/response objects
 * used throughout the demo API. They provide type safety and
 * serve as documentation for the API contract.
 */

/**
 * Extended request interface for user creation endpoints
 *
 * This interface extends the base Express Request type to include
 * typed body property for user creation requests, ensuring
 * type safety and better IntelliSense support.
 */
interface CreateUserRequest extends Request {
  body: InsertUser; // Typed body containing user creation data
}

/**
 * Standard API response structure
 *
 * This interface defines the consistent response format used
 * across all API endpoints, providing uniform structure for
 * frontend applications to consume.
 */
interface ApiResponse {
  message: string; // Human-readable response message
  timestamp: string; // ISO timestamp for request correlation
  data?: unknown; // Optional payload data for successful responses
}

/**
 * Health check response structure
 *
 * This interface defines the comprehensive health information
 * returned by the health check endpoint, including system
 * metrics and service status for monitoring purposes.
 */
interface HealthStatus {
  status: string; // Service health status ('healthy', 'degraded', 'unhealthy')
  uptime: number; // Server uptime in seconds
  memory: {
    // Memory usage statistics
    rss: number; // Resident Set Size memory usage
    heapTotal: number; // Total heap size allocated
    heapUsed: number; // Actual heap memory usage
    external: number; // External memory usage
    arrayBuffers: number; // Array buffer memory usage
  };
  userCount: number; // Current number of users in storage
  timestamp: string; // ISO timestamp of health check
}

/**
 * Pagination parameters structure
 *
 * This interface defines the pagination parameters used
 * throughout the API for consistent paginated responses.
 */
interface PaginationInfo {
  page: number; // Current page number (1-based)
  limit: number; // Items per page
  skip: number; // Number of items to skip (calculated)
}

// Initialize Express application instance
const app: Application = express();

// Configure server port with environment variable support
const port: number = Number(process.env.PORT) || 5000;

/**
 * Production environment validation
 *
 * In production mode, we enforce that all required environment
 * variables are properly configured. This prevents runtime failures
 * due to missing configuration and ensures production deployments
 * are properly set up.
 *
 * Required Variables:
 * - PORT: Server listening port
 */
if (process.env.NODE_ENV === 'production') {
  try {
    requireEnvVars(['PORT']); // Validate required environment variables
  } catch (err: unknown) {
    // Log environment validation failures appropriately
    if (logger?.error) {
      logger.error('Environment validation failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } else {
      console.error('Environment validation failed', err);
    }
    // Exit with error code to signal configuration failure
    process.exit(1);
  }
}

/**
 * Local helper wrapper functions
 *
 * These functions provide safe logging and input sanitization
 * with error handling to prevent application crashes due to
 * logging failures or sanitization errors.
 */

/**
 * Safe information logging wrapper
 *
 * This function provides error-handled logging to prevent application
 * crashes when the logging system encounters errors. It ensures the
 * application continues running even if logging infrastructure fails.
 *
 * @param args - Arguments to log (will be joined with spaces)
 */
function logInfo(...args: string[]): void {
  try {
    logger?.info?.(args.join(' '));
  } catch {
    // Intentionally empty - prevent logging failures from crashing application
  }
}

/**
 * Safe error logging wrapper
 *
 * This function provides error-handled error logging to prevent
 * application crashes when the error logging system encounters errors.
 * It ensures that even logging failures don't prevent error reporting.
 *
 * @param args - Arguments to log (will be joined with spaces)
 */
function logError(...args: string[]): void {
  try {
    logger?.error?.(args.join(' '));
  } catch {
    // Intentionally empty - prevent logging failures from crashing application
  }
}

/**
 * Safe input sanitization wrapper
 *
 * This function provides error-handled input sanitization to prevent
 * application crashes when the sanitization system encounters errors.
 * It returns an empty string as a safe fallback when sanitization fails.
 *
 * @param str - Input string to sanitize
 * @returns {string} Sanitized string or empty string on error
 */
function sanitizeInput(str: string): string {
  try {
    return sanitizeString(str);
  } catch (error) {
    logError('sanitizeInput failed', String(error));
    return ''; // Return safe empty string fallback
  }
}

/**
 * Express.js middleware configuration
 *
 * This section configures all necessary middleware for the demo application.
 * Middleware order is critical for proper functionality - each middleware
 * builds on the previous one's output.
 */

// Parse JSON request bodies - must come before other middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'));

/**
 * Security and privacy middleware configuration
 *
 * Security middleware must be applied after body parsing to ensure
 * request bodies are available for security analysis. Privacy middleware
 * ensures compliance with data protection regulations.
 *
 * Order: Security → Privacy (privacy may need to process after security)
 */
import { setupSecurity } from '../lib/security-middleware.js';
import { privacyMiddleware, privacyHeadersMiddleware } from '../lib/privacy-compliance.js';

setupSecurity(app); // Apply security headers and protections
app.use(privacyMiddleware); // Apply privacy compliance checks
app.use(privacyHeadersMiddleware); // Add privacy-related headers

// Initialize in-memory storage for user management
const storage: MemStorage = new MemStorage();

/**
 * Request logging middleware
 *
 * This middleware logs all incoming requests with timing information
 * to provide basic request monitoring and debugging capabilities.
 * It measures request duration and logs HTTP method, URL, status code,
 * and processing time in milliseconds.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now(); // Record request start time

  // Log when response is finished (sent to client)
  res.on('finish', () => {
    const duration = Date.now() - start; // Calculate total processing time
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });

  next(); // Continue to next middleware in chain
});

// CORE ENDPOINTS USED BY FRONTEND

// Validation rules endpoint - USED BY FRONTEND
app.get('/validation/rules', (req: Request, res: Response) => {
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
    sendSuccess(res, 'Validation rules retrieved', validationRules);
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.validationRules', {
      endpoint: '/validation/rules',
      method: 'GET',
      userAgent: req.get('User-Agent'),
    });
    sendInternalServerError(res, 'Failed to get validation rules');
  }
});

// Cache for health check metrics to avoid expensive operations
let healthCache: { userCount: number; timestamp: number } | null = null;
const HEALTH_CACHE_TTL = 30000; // 30 seconds cache

/**
 * Get cached user count for health checks
 *
 * Returns cached user count if still valid, otherwise fetches fresh data.
 * This prevents expensive database operations on frequent health checks.
 */
async function getCachedUserCount(): Promise<number> {
  const now = Date.now();

  // Return cached data if still valid
  if (healthCache && now - healthCache.timestamp < HEALTH_CACHE_TTL) {
    return healthCache.userCount;
  }

  // Fetch fresh data and update cache
  try {
    const users = await storage.getAllUsers();
    healthCache = {
      userCount: users.length,
      timestamp: now,
    };
    return healthCache.userCount;
  } catch (error) {
    // If fetch fails, return stale cache if available, otherwise 0
    console.error('Failed to fetch user count for health check:', error);
    return healthCache?.userCount ?? 0;
  }
}

// Health check endpoint - USED BY FRONTEND
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Use cached user count to avoid expensive database operations on health checks
    const userCount = await getCachedUserCount();
    const health: HealthStatus = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount,
      timestamp: new Date().toISOString(),
    };
    sendSuccess(res, 'Service is healthy', health);
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.healthCheck', {
      endpoint: '/health',
      method: 'GET',
      userAgent: req.get('User-Agent'),
    });
    sendInternalServerError(res, 'Health check failed');
  }
});

// API index - USED BY FRONTEND
app.get('/', (req: Request, res: Response) => {
  res.json({
    title: 'QMemory Library Demo',
    description: 'Production-ready Node.js utility library demonstration',
    endpoints: {
      'GET /health': 'Health check and system status',
      'GET /validation/rules': 'Get validation rules for frontend forms',
      'GET /users': 'List users with pagination (?page=1&limit=10)',
      'POST /users': 'Create new user (JSON: {username, displayName})',
      'GET /users/:id': 'Get user by ID',
      'PUT /users/:id': 'Update user by ID',
      'DELETE /users/:id': 'Delete user by ID',
      'GET /users/by-username/:username': 'Get user by username',
      'POST /users/clear': 'Clear all users (development only)',
      'GET /utils/greet': 'Greeting utility',
      'POST /utils/math': 'Math operations utility',
      'GET /utils/even/:num': 'Even/odd check utility',
      'POST /utils/dedupe': 'Array deduplication utility',
      'GET /metrics': 'Application performance metrics',
    },
  });
});

// USER MANAGEMENT ENDPOINTS - ALL USED BY FRONTEND

// List users with pagination - USED BY FRONTEND
app.get('/users', async (req: Request, res: Response) => {
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
      `Paginated users: page ${pagination.page}, showing ${paginatedUsers.length} of ${allUsers.length} total`
    );
    res.status(200).json(response);
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.listUsers', {
      endpoint: '/users',
      method: 'GET',
      userAgent: req.get('User-Agent'),
      hasPagination: true,
    });
    logError('Failed to fetch users', String(error));
    sendInternalServerError(res, 'Failed to fetch users');
  }
});

// Create user - USED BY FRONTEND
app.post('/users', async (req: CreateUserRequest, res: Response) => {
  try {
    const { username, displayName } = req.body;
    const safeName = sanitizeInput(username);
    const safeDisplay = sanitizeInput(displayName ?? '');

    if (!safeName) {
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    const user = await storage.createUser({ username: safeName, displayName: safeDisplay });
    logInfo(`Created user: ${safeName}`);
    sendSuccess(res, 'User created successfully', user);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      qerrors.qerrors(error as Error, 'demo-app.createUser', {
        endpoint: '/users',
        method: 'POST',
        username: req.body.username,
        errorType: 'duplicate',
        userAgent: req.get('User-Agent'),
      });
      sendBadRequest(res, error.message);
    } else {
      qerrors.qerrors(error as Error, 'demo-app.createUser', {
        endpoint: '/users',
        method: 'POST',
        username: req.body.username,
        errorType: 'server',
        userAgent: req.get('User-Agent'),
      });
      sendInternalServerError(res, 'Failed to create user');
    }
  }
});

// Get user by ID - USED BY FRONTEND
app.get('/users/:id', async (req: Request, res: Response) => {
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
    qerrors.qerrors(error as Error, 'demo-app.getUserById', {
      endpoint: '/users/:id',
      method: 'GET',
      userId: req.params.id,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to fetch user', String(error));
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

// Get user by username - USED BY FRONTEND
app.get('/users/by-username/:username', async (req: Request, res: Response) => {
  try {
    const username = req.params.username;
    if (!username || typeof username !== 'string') {
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    const trimmedUsername = username.trim();

    // Use direct username lookup for better performance
    const user = await storage.getUserByUsername(trimmedUsername);

    if (!user) {
      return sendNotFound(res, 'User not found');
    }

    sendSuccess(res, 'User found', user);
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.getUserByUsername', {
      endpoint: '/users/by-username/:username',
      method: 'GET',
      username: req.params.username,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to fetch user by username', String(error));
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

// Update user - USED BY FRONTEND
app.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? '', 10);
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id ?? '')) {
      return sendBadRequest(res, 'User ID must be numeric');
    }

    const { username, displayName, githubId, avatar } = req.body;
    const updates: any = {};

    // Sanitize and validate provided fields
    if (username !== undefined) {
      const safeName = sanitizeInput(username);
      if (!safeName) {
        return sendBadRequest(res, 'Username must be a non-empty string');
      }
      updates.username = safeName;
    }

    if (displayName !== undefined) {
      updates.displayName = sanitizeInput(displayName) || null;
    }

    if (githubId !== undefined) {
      updates.githubId = sanitizeInput(githubId) || null;
    }

    if (avatar !== undefined) {
      updates.avatar = sanitizeInput(avatar) || null;
    }

    const updatedUser = await storage.updateUser(id, updates);
    if (!updatedUser) {
      return sendNotFound(res, 'User not found');
    }

    logInfo(`Updated user with ID: ${id}`);
    sendSuccess(res, 'User updated successfully', updatedUser);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      qerrors.qerrors(error as Error, 'demo-app.updateUser', {
        endpoint: '/users/:id',
        method: 'PUT',
        userId: req.params.id,
        errorType: 'duplicate',
        userAgent: req.get('User-Agent'),
      });
      sendBadRequest(res, error.message);
    } else {
      qerrors.qerrors(error as Error, 'demo-app.updateUser', {
        endpoint: '/users/:id',
        method: 'PUT',
        userId: req.params.id,
        errorType: 'server',
        userAgent: req.get('User-Agent'),
      });
      logError('Failed to update user', String(error));
      sendInternalServerError(res, 'Failed to update user');
    }
  }
});

// Delete user - USED BY FRONTEND
app.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id ?? '', 10);
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id ?? '')) {
      return sendBadRequest(res, 'User ID must be numeric');
    }
    const deleted = await storage.deleteUser(id);

    if (!deleted) {
      return sendNotFound(res, 'User not found');
    }

    logInfo(`Deleted user with ID: ${id}`);
    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.deleteUser', {
      endpoint: '/users/:id',
      method: 'DELETE',
      userId: req.params.id,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to delete user', String(error));
    sendInternalServerError(res, 'Failed to delete user');
  }
});

// Clear all users - USED BY FRONTEND
app.post('/users/clear', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return sendBadRequest(res, 'Clear operation not allowed in production');
  }

  try {
    await storage.clear();
    logInfo('Cleared all users');
    sendSuccess(res, 'All users cleared successfully');
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.clearUsers', {
      endpoint: '/users/clear',
      method: 'POST',
      environment: process.env.NODE_ENV,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to clear users', String(error));
    sendInternalServerError(res, 'Failed to clear users');
  }
});

// UTILITY ENDPOINTS - ALL USED BY FRONTEND

// Greeting utility - USED BY FRONTEND
app.get('/utils/greet', (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string) || 'World';
    const safeName = sanitizeInput(name);
    sendSuccess(res, 'Greeting generated', { greeting: `Hello, ${safeName}!` });
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.generateGreeting', {
      endpoint: '/utils/greet',
      method: 'GET',
      name: req.query.name,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to generate greeting', String(error));
    sendInternalServerError(res, 'Failed to generate greeting');
  }
});

// Math operations utility - USED BY FRONTEND
app.post('/utils/math', (req: Request, res: Response) => {
  try {
    const { a, b, operation } = req.body;

    if (a === undefined || b === undefined || operation === undefined) {
      return sendBadRequest(res, 'Missing required fields: a, b, and operation');
    }

    const safeOperation = sanitizeInput(String(operation));
    const validOperations = ['add', 'subtract', 'multiply', 'divide'];
    if (!validOperations.includes(safeOperation)) {
      return sendBadRequest(res, 'Invalid operation. Supported: add, subtract, multiply, divide');
    }

    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (isNaN(numA) || isNaN(numB) || !isFinite(numA) || !isFinite(numB)) {
      return sendBadRequest(res, 'Please enter valid finite numbers');
    }

    if (safeOperation === 'add') {
      const sum = numA + numB;
      sendSuccess(res, 'Math operation completed', {
        result: sum,
        operation: `${numA} + ${numB} = ${sum}`,
      });
    } else if (safeOperation === 'subtract') {
      const difference = numA - numB;
      sendSuccess(res, 'Math operation completed', {
        result: difference,
        operation: `${numA} - ${numB} = ${difference}`,
      });
    } else if (safeOperation === 'multiply') {
      const product = numA * numB;
      sendSuccess(res, 'Math operation completed', {
        result: product,
        operation: `${numA} * ${numB} = ${product}`,
      });
    } else if (safeOperation === 'divide') {
      if (numB === 0) {
        return sendBadRequest(res, 'Division by zero is not allowed');
      }
      const quotient = numA / numB;
      sendSuccess(res, 'Math operation completed', {
        result: quotient,
        operation: `${numA} / ${numB} = ${quotient}`,
      });
    } else {
      return sendBadRequest(res, 'Unsupported operation');
    }
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.mathOperation', {
      endpoint: '/utils/math',
      method: 'POST',
      operation: req.body.operation,
      hasA: req.body.a !== undefined,
      hasB: req.body.b !== undefined,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to perform math operation', String(error));
    sendInternalServerError(res, 'Failed to perform math operation');
  }
});

// Even/odd check utility - USED BY FRONTEND
app.get('/utils/even/:num', (req: Request, res: Response) => {
  try {
    const sanitizedNum = sanitizeInput(req.params.num);

    if (!sanitizedNum || !/^-?\d+$/.test(sanitizedNum)) {
      return sendBadRequest(res, 'Please enter a valid integer');
    }

    const num = parseInt(sanitizedNum, 10);

    if (isNaN(num) || !isFinite(num)) {
      return sendBadRequest(res, 'Please enter a valid integer');
    }

    const isEvenResult = num % 2 === 0;
    sendSuccess(res, 'Even check completed', {
      number: num,
      isEven: isEvenResult,
      message: `${num} is ${isEvenResult ? 'even' : 'odd'}`,
    });
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.checkEvenOdd', {
      endpoint: '/utils/even/:num',
      method: 'GET',
      num: req.params.num,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to check even/odd', String(error));
    sendInternalServerError(res, 'Failed to check even/odd');
  }
});

// Array deduplication utility - USED BY FRONTEND
app.post('/utils/dedupe', async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return sendBadRequest(res, 'Items must be an array');
    }

    if (items.length === 0) {
      return sendSuccess(res, 'Deduplication completed', {
        original: [],
        deduped: [],
        removed: 0,
      });
    }

    // For small arrays, use synchronous processing
    if (items.length <= 1000) {
      const seen = new Set();
      const deduped = [];

      for (const item of items) {
        const key = typeof item === 'string' ? item : JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      const removed = items.length - deduped.length;
      return sendSuccess(res, 'Deduplication completed', {
        original: items,
        deduped: deduped,
        removed: removed,
      });
    }

    // For large arrays, use chunked async processing to prevent event loop blocking
    const chunkSize = 1000;
    const seen = new Set();
    const deduped = [];

    // Process chunks asynchronously with yield points
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      // Process chunk
      for (const item of chunk) {
        const key = typeof item === 'string' ? item : JSON.stringify(item);
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      // Yield control to event loop every chunk (except last chunk)
      if (i + chunkSize < items.length) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }

    sendSuccess(res, 'Deduplication completed', {
      original: items,
      deduped: deduped,
      removed: items.length - deduped.length,
      processed: 'chunked',
    });
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.dedupeArray', {
      endpoint: '/utils/dedupe',
      method: 'POST',
      isArray: Array.isArray(req.body.items),
      itemCount: req.body.items ? req.body.items.length : 0,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to dedupe array', String(error));
    sendInternalServerError(res, 'Failed to dedupe array');
  }
});

// Metrics endpoint - USED BY FRONTEND
app.get('/metrics', (req: Request, res: Response) => {
  try {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
    sendSuccess(res, 'Metrics retrieved', metrics);
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.getMetrics', {
      endpoint: '/metrics',
      method: 'GET',
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to get metrics', String(error));
    sendInternalServerError(res, 'Failed to get metrics');
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  qerrors.qerrors(error as Error, 'demo-app.unhandledError', {
    endpoint: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    headersSent: res.headersSent,
  });
  logError('Unhandled error:', error.message);
  if (res.headersSent) {
    return next(error);
  }
  sendInternalServerError(res, 'An unexpected error occurred');
});

// 404 handler
app.use((req: Request, res: Response) => {
  sendNotFound(res, 'Endpoint not found');
});

// Graceful shutdown
function registerGracefulShutdown(serverInstance: Server | undefined): void {
  try {
    gracefulShutdown(serverInstance);
  } catch (err: unknown) {
    logError('Failed to register graceful shutdown', String(err));
  }
}

let server: Server | undefined;
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  server = app.listen(port, '0.0.0.0', () => {
    logInfo(`QMemory Demo App listening on port ${port}`);
    logInfo('Environment:', process.env.NODE_ENV ?? 'development');

    // Create some sample data in development
    if (process.env.NODE_ENV !== 'production') {
      storage
        .createUser({ username: 'demo', displayName: 'Demo User' })
        .then(() => logInfo('Created demo user'))
        .catch(err => logError('Failed to create demo user:', String(err)));
    }
    registerGracefulShutdown(server);
  });
}

export { app, server };
