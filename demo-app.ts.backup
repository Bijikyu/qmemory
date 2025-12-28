/**
 * QMemory Library Demo Application
 * Demonstrates core functionality with a simple Express.js API
 *
 * This demo application showcases the practical usage of the qmemory library
 * in a real Express.js server environment. It provides a complete REST API
 * for user management operations using the library's utilities.
 *
 * Design rationale:
 * - Demonstrates library integration patterns for real applications
 * - Shows proper error handling using library HTTP utilities
 * - Provides working examples of all major library features
 * - Serves as both documentation and functional testing platform
 *
 * Architecture decisions:
 * - Uses in-memory storage for simplicity and quick demonstration
 * - Implements comprehensive logging for debugging and monitoring
 * - Follows REST conventions for intuitive API design
 * - Includes health checks for production readiness demonstration
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
// Prefer typed/env-aware port retrieval via qgenutils
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
      // Fallback logging
      console.error('Environment validation failed', err);
    }
    process.exit(1);
  }
}

// Local helper wrappers forward to qgenutils.logger for structured logging
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
  // robust input sanitization via qgenutils
  try {
    return sanitizeString(str);
  } catch (error) {
    logError('sanitizeInput failed', String(error));
    return '';
  }
}

// Middleware
app.use(express.json()); // body parser for JSON payloads, ensures consistent req.body
app.use(express.static('public')); // serve static files for documentation and example assets

// Initialize storage
const storage: MemStorage = new MemStorage(); // in-memory store is used to keep the demo self contained

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now(); // capture start time to calculate response duration
  res.on('finish', () => {
    const duration = Date.now() - start; // measure request processing time
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`); // log concise request details for monitoring
  });
  next();
});

// Validation rules endpoint
app.get('/validation/rules', (req: Request, res: Response) => {
  // Expose validation rules for frontend use
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
    // qerrors already handles error logging and analysis
    sendInternalServerError(res, 'Failed to get validation rules');
  }
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  // returns service status to support uptime monitoring
  try {
    const userCount = (await storage.getAllUsers()).length; // await to get accurate user total
    const health: HealthStatus = {
      status: 'healthy', // simple status message used by monitoring tools
      uptime: process.uptime(), // uptime info provides quick readiness metric
      memory: process.memoryUsage(), // snapshot of memory usage for debugging
      userCount, // confirm storage interaction
      timestamp: new Date().toISOString(),
    };
    sendSuccess(res, 'Service is healthy', health); // send standardized success
  } catch (error) {
    qerrors(error as Error, 'demo-app.healthCheck', {
      endpoint: '/health',
      method: 'GET',
      userAgent: req.get('User-Agent'),
    });
    // qerrors already handles error logging and analysis // log for operator visibility
    sendInternalServerError(res, 'Health check failed');
  }
});

// Demo API endpoints
app.get('/', (req: Request, res: Response) => {
  // basic API index for manual exploration
  res.json({
    title: 'QMemory Library Demo',
    description: 'Production-ready Node.js utility library demonstration',
    endpoints: {
      'GET /health': 'Health check and system status',
      'GET /users': 'List users with pagination (?page=1&limit=10)',
      'POST /users': 'Create new user (JSON: {username, displayName})', // updated to reflect display name usage
      'GET /users/:id': 'Get user by ID',
      'DELETE /users/:id': 'Delete user by ID',
      'POST /users/clear': 'Clear all users (development only)',
    },
    examples: {
      createUser: {
        method: 'POST',
        url: '/users',
        body: { username: 'johndoe', displayName: 'John Doe' }, // changed example payload field
      },
    },
  });
});

// User management endpoints
app.get('/users', async (req: Request, res: Response) => {
  // paginated user listing with query parameter support
  try {
    // Validate pagination parameters and get configuration
    const pagination = validatePagination(req, res, {
      defaultPage: 1,
      defaultLimit: 10,
      maxLimit: 50,
    }) as PaginationInfo | null;

    // If validation failed, response was already sent
    if (!pagination) return;

    // Get all users from storage
    const allUsers = await storage.getAllUsers();

    // Apply pagination to the results
    const startIndex = pagination.skip;
    const endIndex = startIndex + pagination.limit;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    // Create complete paginated response with metadata
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

app.post('/users', async (req: CreateUserRequest, res: Response) => {
  // create a user for demo operations
  try {
    const { username, displayName } = req.body; // get required username and optional display name
    const safeName = sanitizeInput(username); // sanitize inputs to prevent XSS and maintain consistent storage
    const safeDisplay = sanitizeInput(displayName ?? ''); // sanitize optional display name field

    if (!safeName) {
      // ensure sanitized username exists
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    const user = await storage.createUser({ username: safeName, displayName: safeDisplay }); // pass only fields used by storage
    logInfo(`Created user: ${safeName}`); // record creation event for auditing
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
      sendBadRequest(res, error.message); // duplicate user results in 400
    } else {
      qerrors.qerrors(error as Error, 'demo-app.createUser', {
        endpoint: '/users',
        method: 'POST',
        username: req.body.username,
        errorType: 'server',
        userAgent: req.get('User-Agent'),
      });
      // qerrors already handles error logging and analysis
      sendInternalServerError(res, 'Failed to create user');
    }
  }
});

app.get('/users/:id', async (req: Request, res: Response) => {
  // fetch a single user by id
  try {
    const id = parseInt(req.params.id ?? '', 10); // parse as base-10 integer for clarity
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id ?? '')) {
      // validate numeric input strictly
      return sendBadRequest(res, 'User ID must be numeric'); // reject non-numeric IDs with 400
    }
    const user = await storage.getUser(id); // await user fetch to ensure data

    if (!user) {
      // handle unknown id
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
    logError('Failed to fetch user', String(error)); // log before sending generic error
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

app.get('/users/by-username/:username', async (req: Request, res: Response) => {
  // fetch a single user by username
  try {
    const username = req.params.username; // get username from URL parameter
    if (!username || typeof username !== 'string') {
      // validate username parameter
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    // Trim username to match stored usernames (storage uses .trim())
    const trimmedUsername = username.trim();

    // Get all users and search by username (since MemStorage doesn't have username search)
    const allUsers = await storage.getAllUsers();
    const user = allUsers.find(u => u.username === trimmedUsername);

    if (!user) {
      // handle unknown username
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
    logError('Failed to fetch user by username', String(error)); // log before sending generic error
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

app.delete('/users/:id', async (req: Request, res: Response) => {
  // remove a user by id
  try {
    const id = parseInt(req.params.id ?? '', 10); // parse as base-10 integer for consistency
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id ?? '')) {
      // enforce numeric id format
      return sendBadRequest(res, 'User ID must be numeric'); // reject invalid ids with 400
    }
    const deleted = await storage.deleteUser(id); // await deletion result

    if (!deleted) {
      // handle missing user
      return sendNotFound(res, 'User not found');
    }

    logInfo(`Deleted user with ID: ${id}`); // audit deletion event
    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.deleteUser', {
      endpoint: '/users/:id',
      method: 'DELETE',
      userId: req.params.id,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to delete user', String(error)); // preserve stack for debugging
    sendInternalServerError(res, 'Failed to delete user');
  }
});

app.put('/users/:id', async (req: Request, res: Response) => {
  // update a user by id
  try {
    const id = parseInt(req.params.id ?? '', 10); // parse as base-10 integer for consistency
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id ?? '')) {
      // enforce numeric id format
      return sendBadRequest(res, 'User ID must be numeric'); // reject invalid ids with 400
    }

    const { username, displayName, githubId, avatar } = req.body; // get optional update fields
    const updates: any = {}; // build updates object

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

    // Use the actual update functionality
    const updatedUser = await storage.updateUser(id, updates);
    if (!updatedUser) {
      return sendNotFound(res, 'User not found');
    }

    logInfo(`Updated user with ID: ${id}`); // audit update event
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
      sendBadRequest(res, error.message); // username conflict
    } else {
      qerrors.qerrors(error as Error, 'demo-app.updateUser', {
        endpoint: '/users/:id',
        method: 'PUT',
        userId: req.params.id,
        errorType: 'server',
        userAgent: req.get('User-Agent'),
      });
      logError('Failed to update user', String(error)); // preserve stack for debugging
      sendInternalServerError(res, 'Failed to update user');
    }
  }
});

app.post('/users/clear', async (req: Request, res: Response) => {
  // wipe storage when testing
  if (process.env.NODE_ENV === 'production') {
    return sendBadRequest(res, 'Clear operation not allowed in production'); // protect production data
  }

  try {
    await storage.clear(); // await to ensure cleanup completes
    logInfo('Cleared all users'); // log maintenance activity
    sendSuccess(res, 'All users cleared successfully');
  } catch (error) {
    qerrors.qerrors(error as Error, 'demo-app.clearUsers', {
      endpoint: '/users/clear',
      method: 'POST',
      environment: process.env.NODE_ENV,
      userAgent: req.get('User-Agent'),
    });
    logError('Failed to clear users', String(error)); // log for debugging
    sendInternalServerError(res, 'Failed to clear users');
  }
});

// HTTP Testing endpoints for frontend utility testing
app.get('/test/404', (req: Request, res: Response) => {
  // Dedicated endpoint for testing 404 Not Found responses
  sendNotFound(res, 'Test 404 Not Found response');
});

app.post('/test/409', (req: Request, res: Response) => {
  // Dedicated endpoint for testing 409 Conflict responses
  sendConflict(res, 'Test 409 Conflict response');
});

app.get('/test/500', (req: Request, res: Response) => {
  // Dedicated endpoint for testing 500 Server Error responses
  sendInternalServerError(res, 'Test 500 Server Error response');
});

app.get('/test/503', (req: Request, res: Response) => {
  // Dedicated endpoint for testing 503 Service Unavailable responses
  sendServiceUnavailable(res, 'Test 503 Service Unavailable response');
});

app.post('/test/validation', (req: Request, res: Response) => {
  // Dedicated endpoint for testing validation error responses
  sendBadRequest(res, 'Test validation error response');
});

app.get('/test/auth', (req: Request, res: Response) => {
  // Dedicated endpoint for testing authentication error responses
  sendAuthError(res, 'Test authentication error response');
});

// Utility endpoints for frontend integration
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

app.post('/utils/math', (req: Request, res: Response) => {
  try {
    const { a, b, operation } = req.body;

    // Validate required fields
    if (a === undefined || b === undefined || operation === undefined) {
      return sendBadRequest(res, 'Missing required fields: a, b, and operation');
    }

    // Sanitize operation parameter
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

app.get('/utils/even/:num', (req: Request, res: Response) => {
  try {
    // Sanitize and validate input parameter
    const sanitizedNum = sanitizeInput(req.params.num);

    // Check if sanitization produced valid input before parsing
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
  logError('Unhandled error:', error.message); // capture unexpected issues
  if (res.headersSent) {
    // delegate to default handler if headers already sent
    return next(error);
  }
  sendInternalServerError(res, 'An unexpected error occurred'); // hide error specifics from clients
});

// 404 handler
app.use((req: Request, res: Response) => {
  sendNotFound(res, 'Endpoint not found'); // unified not-found response
});

// Graceful shutdown via qgenutils
function registerGracefulShutdown(serverInstance: Server | undefined): void {
  try {
    gracefulShutdown(serverInstance); // handles SIGTERM/SIGINT
  } catch (err: unknown) {
    logError('Failed to register graceful shutdown', String(err));
  }
}

let server: Server | undefined; // holds HTTP server instance when started manually or via CLI
// start server only when running this file directly (check if this is the main module)
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  server = app.listen(port, '0.0.0.0', () => {
    // bind to all interfaces for demo usage
    logInfo(`QMemory Demo App listening on port ${port}`); // log startup details for monitoring
    logInfo('Environment:', process.env.NODE_ENV ?? 'development'); // log running mode for clarity

    // Create some sample data in development
    if (process.env.NODE_ENV !== 'production') {
      // avoid polluting production DB
      storage
        .createUser({ username: 'demo', displayName: 'Demo User' }) // sample uses displayName to match route
        .then(() => logInfo('Created demo user'))
        .catch(err => logError('Failed to create demo user:', String(err)));
    }
    // Register shutdown handlers after server starts
    registerGracefulShutdown(server);
  });
}

export { app, server }; // export server for tests and app for external usage
