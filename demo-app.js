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

const express = require('express');
const {
  MemStorage,
  sendNotFound,
  sendInternalServerError,
  ensureMongoDB,
  validatePagination,
  createPaginatedResponse
} = require('./index');
const { logger, sanitizeString, getEnvVar, requireEnvVars, gracefulShutdown } = require('./lib/qgenutils-wrapper');

const app = express();
// Prefer typed/env-aware port retrieval via qgenutils
const port = getEnvVar('PORT', process.env.PORT || 5000, 'number');

// Optional: enforce required env vars in production
if (process.env.NODE_ENV === 'production') {
  try {
    requireEnvVars(['PORT']);
  } catch (err) {
    if (logger && logger.error) {
      logger.error('Environment validation failed', { error: err.message });
    } else {
      // Fallback logging
      console.error('Environment validation failed', err);
    }
    process.exit(1);
  }
}

// Local helper wrappers forward to qgenutils.logger for structured logging
function logInfo(...args) { try { logger && logger.info && logger.info(args.join(' ')); } catch (_) {} }
function logError(...args) { try { logger && logger.error && logger.error(args.join(' ')); } catch (_) {} }
function sendSuccess(res, message, data) { // send standard 200 response
  try {
    const payload = { message, timestamp: new Date().toISOString() };
    if (data !== undefined) payload.data = data; // include optional data
    res.status(200).json(payload);
    logger && logger.debug && logger.debug('sendSuccess response sent', { message });
  } catch (error) {
    logError('sendSuccess failed', error);
  }
}
function sendBadRequest(res, message) { // send standard 400 response
  try {
    const payload = { message, timestamp: new Date().toISOString() };
    res.status(400).json(payload);
    logger && logger.debug && logger.debug('sendBadRequest response sent', { message });
  } catch (error) {
    logError('sendBadRequest failed', error);
  }
}

function sanitizeInput(str) { // robust input sanitization via qgenutils
  try {
    return sanitizeString(str);
  } catch (error) {
    logError('sanitizeInput failed', error);
    return '';
  }
}

// Middleware
app.use(express.json()); // body parser for JSON payloads, ensures consistent req.body
app.use(express.static('public')); // serve static files for documentation and example assets

// Initialize storage
const storage = new MemStorage(); // in-memory store is used to keep the demo self contained

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now(); // capture start time to calculate response duration
  res.on('finish', () => {
    const duration = Date.now() - start; // measure request processing time
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`); // log concise request details for monitoring
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => { // returns service status to support uptime monitoring
  try {
    const userCount = (await storage.getAllUsers()).length; // await to get accurate user total
    const health = {
      status: 'healthy', // simple status message used by monitoring tools
      uptime: process.uptime(), // uptime info provides quick readiness metric
      memory: process.memoryUsage(), // snapshot of memory usage for debugging
      userCount, // confirm storage interaction
      timestamp: new Date().toISOString()
    };
    sendSuccess(res, 'Service is healthy', health); // send standardized success
  } catch (error) {
    logError('Health check failed', error); // log for operator visibility
    sendInternalServerError(res, 'Health check failed');
  }
});

// Demo API endpoints
app.get('/', (req, res) => { // basic API index for manual exploration
  res.json({
    title: 'QMemory Library Demo',
    description: 'Production-ready Node.js utility library demonstration',
    endpoints: {
      'GET /health': 'Health check and system status',
      'GET /users': 'List users with pagination (?page=1&limit=10)',
      'POST /users': 'Create new user (JSON: {username, displayName})', // updated to reflect display name usage
      'GET /users/:id': 'Get user by ID',
      'DELETE /users/:id': 'Delete user by ID',
      'POST /users/clear': 'Clear all users (development only)'
    },
    examples: {
      createUser: {
        method: 'POST',
        url: '/users',
        body: { username: 'johndoe', displayName: 'John Doe' } // changed example payload field
      }
    }
  });
});

// User management endpoints
app.get('/users', async (req, res) => { // paginated user listing with query parameter support
  try {
    // Validate pagination parameters and get configuration
    const pagination = validatePagination(req, res, {
      defaultPage: 1,
      defaultLimit: 10,
      maxLimit: 50
    });
    
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
    
    logInfo(`Paginated users: page ${pagination.page}, showing ${paginatedUsers.length} of ${allUsers.length} total`);
    res.status(200).json(response);
  } catch (error) {
    logError('Failed to fetch users', error);
    sendInternalServerError(res, 'Failed to fetch users');
  }
});

app.post('/users', async (req, res) => { // create a user for demo operations
  try {
    const { username, displayName } = req.body; // get required username and optional display name
    const safeName = sanitizeInput(username); // sanitize inputs to prevent XSS and maintain consistent storage
    const safeDisplay = sanitizeInput(displayName); // sanitize optional display name field

    if (!safeName) { // ensure sanitized username exists
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    const user = await storage.createUser({ username: safeName, displayName: safeDisplay }); // pass only fields used by storage
    logInfo(`Created user: ${safeName}`); // record creation event for auditing
    sendSuccess(res, 'User created successfully', user);
  } catch (error) {
    if (error.message.includes('already exists')) {
      sendBadRequest(res, error.message); // duplicate user results in 400
    } else {
      logError('Failed to create user', error); // other errors flagged as 500
      sendInternalServerError(res, 'Failed to create user');
    }
  }
});

app.get('/users/:id', async (req, res) => { // fetch a single user by id
  try {
    const id = parseInt(req.params.id, 10); // parse as base-10 integer for clarity
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id)) { // validate numeric input strictly
      return sendBadRequest(res, 'User ID must be numeric'); // reject non-numeric IDs with 400
    }
    const user = await storage.getUser(id); // await user fetch to ensure data

    if (!user) { // handle unknown id
      return sendNotFound(res, 'User not found');
    }

    sendSuccess(res, 'User found', user);
  } catch (error) {
    logError('Failed to fetch user', error); // log before sending generic error
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

app.delete('/users/:id', async (req, res) => { // remove a user by id
  try {
    const id = parseInt(req.params.id, 10); // parse as base-10 integer for consistency
    if (!Number.isInteger(id) || !/^\d+$/.test(req.params.id)) { // enforce numeric id format
      return sendBadRequest(res, 'User ID must be numeric'); // reject invalid ids with 400
    }
    const deleted = await storage.deleteUser(id); // await deletion result

    if (!deleted) { // handle missing user
      return sendNotFound(res, 'User not found');
    }

    logInfo(`Deleted user with ID: ${id}`); // audit deletion event
    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    logError('Failed to delete user', error); // preserve stack for debugging
    sendInternalServerError(res, 'Failed to delete user');
  }
});

app.post('/users/clear', async (req, res) => { // wipe storage when testing
  if (process.env.NODE_ENV === 'production') {
    return sendBadRequest(res, 'Clear operation not allowed in production'); // protect production data
  }

  try {
    await storage.clear(); // await to ensure cleanup completes
    logInfo('Cleared all users'); // log maintenance activity
    sendSuccess(res, 'All users cleared successfully');
  } catch (error) {
    logError('Failed to clear users', error); // log for debugging
    sendInternalServerError(res, 'Failed to clear users');
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logError('Unhandled error:', error); // capture unexpected issues
  if (res.headersSent) { // delegate to default handler if headers already sent
    return next(error);
  }
  sendInternalServerError(res, 'An unexpected error occurred'); // hide error specifics from clients
});

// 404 handler
app.use((req, res) => {
  sendNotFound(res, 'Endpoint not found'); // unified not-found response
});

// Graceful shutdown via qgenutils
function registerGracefulShutdown(serverInstance) {
  try {
    gracefulShutdown(serverInstance, null, 10000); // handles SIGTERM/SIGINT
  } catch (err) {
    logError('Failed to register graceful shutdown', err);
  }
}


let server; // holds HTTP server instance when started manually or via CLI
if (require.main === module) { // start server only when running this file directly
  server = app.listen(port, '0.0.0.0', () => { // bind to all interfaces for demo usage
    logInfo(`QMemory Demo App listening on port ${port}`); // log startup details for monitoring
    logInfo('Environment:', process.env.NODE_ENV || 'development'); // log running mode for clarity

    // Create some sample data in development
    if (process.env.NODE_ENV !== 'production') { // avoid polluting production DB
      storage.createUser({ username: 'demo', displayName: 'Demo User' }) // sample uses displayName to match route
        .then(() => logInfo('Created demo user'))
        .catch(err => logError('Failed to create demo user:', err));
    }
    // Register shutdown handlers after server starts
    registerGracefulShutdown(server);
  });
}

module.exports = { app, server }; // export server for tests and app for external usage
