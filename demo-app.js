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
  ensureMongoDB
} = require('./index');

const app = express();
const port = process.env.PORT || 5000;

// Local helper functions provide minimal implementations since the library
// no longer exports these utilities
function logInfo(...args) { console.log('[INFO]', ...args); } // unify info logging
function logError(...args) { console.error('[ERROR]', ...args); } // unify error logging
function sendSuccess(res, message, data) { // send standard 200 response
  console.log(`sendSuccess is running with ${message}`); // trace call for debugging
  try {
    const payload = { message, timestamp: new Date().toISOString() };
    if (data !== undefined) payload.data = data; // include optional data
    res.status(200).json(payload);
    console.log(`sendSuccess is returning ${JSON.stringify(payload)}`); // confirm output
  } catch (error) {
    console.error('sendSuccess failed', error); // log failure path
  }
}
function sendBadRequest(res, message) { // send standard 400 response
  console.log(`sendBadRequest is running with ${message}`); // trace call for debugging
  try {
    const payload = { message, timestamp: new Date().toISOString() };
    res.status(400).json(payload);
    console.log('sendBadRequest has run resulting in a final value of 400'); // confirm completion
  } catch (error) {
    console.error('sendBadRequest failed', error); // log failure path
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
app.get('/health', (req, res) => { // returns service status to support uptime monitoring
  try {
    const health = {
      status: 'healthy', // simple status message used by monitoring tools
      uptime: process.uptime(), // uptime info provides quick readiness metric
      memory: process.memoryUsage(), // snapshot of memory usage for debugging
      userCount: storage.getAllUsers().length, // confirm storage interaction
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
      'GET /users': 'List all users',
      'POST /users': 'Create new user (JSON: {username, email})',
      'GET /users/:id': 'Get user by ID',
      'DELETE /users/:id': 'Delete user by ID',
      'POST /users/clear': 'Clear all users (development only)'
    },
    examples: {
      createUser: {
        method: 'POST',
        url: '/users',
        body: { username: 'johndoe', email: 'john@example.com' }
      }
    }
  });
});

// User management endpoints
app.get('/users', (req, res) => { // list all stored users for testing purposes
  try {
    const users = storage.getAllUsers(); // retrieval uses in-memory store API
    sendSuccess(res, `Found ${users.length} users`, users);
  } catch (error) {
    logError('Failed to fetch users', error); // log ensures visibility in dev
    sendInternalServerError(res, 'Failed to fetch users');
  }
});

app.post('/users', async (req, res) => { // create a user for demo operations
  try {
    const { username, email } = req.body; // destructure posted credentials

    if (!username || typeof username !== 'string') { // verify name field quickly
      return sendBadRequest(res, 'Username is required and must be a string');
    }

    const user = await storage.createUser({ username, email }); // delegate to storage API
    logInfo(`Created user: ${username}`); // record creation event for auditing
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

app.get('/users/:id', (req, res) => { // fetch a single user by id
  try {
    const id = parseInt(req.params.id); // parse id from path
    const user = storage.getUser(id); // retrieve user

    if (!user) { // handle unknown id
      return sendNotFound(res, 'User not found');
    }

    sendSuccess(res, 'User found', user);
  } catch (error) {
    logError('Failed to fetch user', error); // log before sending generic error
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

app.delete('/users/:id', (req, res) => { // remove a user by id
  try {
    const id = parseInt(req.params.id); // parse id safely
    const deleted = storage.deleteUser(id); // attempt deletion from storage

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

app.post('/users/clear', (req, res) => { // wipe storage when testing
  if (process.env.NODE_ENV === 'production') {
    return sendBadRequest(res, 'Clear operation not allowed in production'); // protect production data
  }

  try {
    storage.clear(); // reset all demo data
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

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully'); // ensure container stops correctly
  server.close(() => {
    logInfo('Server closed'); // confirm server closed before exiting
    process.exit(0);
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logInfo(`QMemory Demo App listening on port ${port}`); // startup info for operator awareness
  logInfo('Environment:', process.env.NODE_ENV || 'development'); // clarify running mode

  // Create some sample data in development
  if (process.env.NODE_ENV !== 'production') { // avoid polluting production DB
    storage.createUser({ username: 'demo', email: 'demo@example.com' })
      .then(() => logInfo('Created demo user'))
      .catch(err => logError('Failed to create demo user:', err));
  }
});

module.exports = app;
