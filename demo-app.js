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
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendInternalServerError,
  ensureMongoDB,
  logInfo,
  logError
} = require('./index');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize storage
const storage = new MemStorage();

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount: storage.getAllUsers().length,
      timestamp: new Date().toISOString()
    };
    sendSuccess(res, 'Service is healthy', health);
  } catch (error) {
    logError('Health check failed', error);
    sendInternalServerError(res, 'Health check failed');
  }
});

// Demo API endpoints
app.get('/', (req, res) => {
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
app.get('/users', (req, res) => {
  try {
    const users = storage.getAllUsers();
    sendSuccess(res, `Found ${users.length} users`, users);
  } catch (error) {
    logError('Failed to fetch users', error);
    sendInternalServerError(res, 'Failed to fetch users');
  }
});

app.post('/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (!username || typeof username !== 'string') {
      return sendBadRequest(res, 'Username is required and must be a string');
    }
    
    const user = await storage.createUser({ username, email });
    logInfo(`Created user: ${username}`);
    sendSuccess(res, 'User created successfully', user);
  } catch (error) {
    if (error.message.includes('already exists')) {
      sendBadRequest(res, error.message);
    } else {
      logError('Failed to create user', error);
      sendInternalServerError(res, 'Failed to create user');
    }
  }
});

app.get('/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = storage.getUser(id);
    
    if (!user) {
      return sendNotFound(res, 'User not found');
    }
    
    sendSuccess(res, 'User found', user);
  } catch (error) {
    logError('Failed to fetch user', error);
    sendInternalServerError(res, 'Failed to fetch user');
  }
});

app.delete('/users/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = storage.deleteUser(id);
    
    if (!deleted) {
      return sendNotFound(res, 'User not found');
    }
    
    logInfo(`Deleted user with ID: ${id}`);
    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    logError('Failed to delete user', error);
    sendInternalServerError(res, 'Failed to delete user');
  }
});

app.post('/users/clear', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return sendBadRequest(res, 'Clear operation not allowed in production');
  }
  
  try {
    storage.clear();
    logInfo('Cleared all users');
    sendSuccess(res, 'All users cleared successfully');
  } catch (error) {
    logError('Failed to clear users', error);
    sendInternalServerError(res, 'Failed to clear users');
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logError('Unhandled error:', error);
  if (res.headersSent) {
    return next(error);
  }
  sendInternalServerError(res, 'An unexpected error occurred');
});

// 404 handler
app.use((req, res) => {
  sendNotFound(res, 'Endpoint not found');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logInfo('Server closed');
    process.exit(0);
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logInfo(`QMemory Demo App listening on port ${port}`);
  logInfo('Environment:', process.env.NODE_ENV || 'development');
  
  // Create some sample data in development
  if (process.env.NODE_ENV !== 'production') {
    storage.createUser({ username: 'demo', email: 'demo@example.com' })
      .then(() => logInfo('Created demo user'))
      .catch(err => logError('Failed to create demo user:', err));
  }
});

module.exports = app;