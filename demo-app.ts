/**
 * QMemory Library Demo Application - Frontend-Backend Integration Fixed
 * Demonstrates core functionality with a simple Express.js API
 *
 * Fixes applied:
 * - All frontend-called endpoints are properly implemented
 * - Unused test endpoints removed for cleaner API surface
 * - Better error handling and response consistency
 * - Frontend-backend integration validation
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
} from './lib/http-utils.js';
import type { Server } from 'http';
import qerrors from 'qerrors';

// Define interfaces for complex objects
interface CreateUserRequest extends Request {
  body: InsertUser;
}

interface ApiResponse {
  message: string;
  timestamp: string;
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
}

interface PaginationInfo {
  page: number;
  limit: number;
  skip: number;
}

const app: Application = express();
const port: number = Number(process.env.PORT) || 5000;

// Optional: enforce required env vars in production
if (process.env.NODE_ENV === 'production') {
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

// Local helper wrappers
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

function sanitizeInput(str: string): string {
  try {
    return sanitizeString(str);
  } catch (error) {
    logError('sanitizeInput failed', String(error));
    return '';
  }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize storage
const storage: MemStorage = new MemStorage();

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
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

// Health check endpoint - USED BY FRONTEND
app.get('/health', async (req: Request, res: Response) => {
  try {
    const userCount = (await storage.getAllUsers()).length;
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

    // Get all users and search by username (since MemStorage doesn't have username search)
    const allUsers = await storage.getAllUsers();
    const user = allUsers.find(u => u.username === trimmedUsername);

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
app.post('/utils/dedupe', (req: Request, res: Response) => {
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

    // Perform deduplication while preserving order
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

    sendSuccess(res, 'Deduplication completed', {
      original: items,
      deduped: deduped,
      removed: removed,
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
