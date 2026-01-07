/**
 * Express Server for QMemory Library
 * Implements all endpoints expected by frontend integration tests
 */

import express from 'express';
import { storage, User } from './lib/storage.js';
import { greet, add, isEven, dedupe } from './lib/utils.js';
import {
  sendSuccess,
  sendNotFound,
  sendBadRequest,
  sendInternalServerError,
  getTimestamp,
} from './lib/http-utils.js';
import {
  performHealthCheck,
  getRequestMetrics,
  getMemoryUsage,
  getCpuUsage,
  getFilesystemUsage,
} from './lib/health-check.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// In-memory user storage for demo
let users = [];
let userIdCounter = 1;

// Helper functions
function createUser(userData) {
  const user = {
    id: userIdCounter++,
    username: userData.username,
    displayName: userData.displayName || userData.username,
    createdAt: new Date().toISOString(),
    ...userData,
  };
  users.push(user);
  return user;
}

function findUserById(id) {
  return users.find(user => user.id === parseInt(id));
}

function findUserByUsername(username) {
  return users.find(user => user.username === username);
}

function updateUser(id, updateData) {
  const userIndex = users.findIndex(user => user.id === parseInt(id));
  if (userIndex === -1) return null;

  users[userIndex] = { ...users[userIndex], ...updateData, updatedAt: new Date().toISOString() };
  return users[userIndex];
}

function deleteUser(id) {
  const userIndex = users.findIndex(user => user.id === parseInt(id));
  if (userIndex === -1) return false;

  users.splice(userIndex, 1);
  return true;
}

// === HEALTH & SYSTEM ENDPOINTS ===

app.get('/health', async (req, res) => {
  try {
    const healthStatus = await performHealthCheck();
    sendSuccess(res, 'Health check completed', healthStatus);
  } catch (error) {
    sendInternalServerError(res, 'Health check failed');
  }
});

app.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: getTimestamp(),
      requests: getRequestMetrics(),
      memory: getMemoryUsage(),
      cpu: getCpuUsage(),
      filesystem: getFilesystemUsage(),
      users: {
        total: users.length,
        active: users.filter(u => !u.deleted).length,
      },
    };
    sendSuccess(res, 'Metrics retrieved successfully', metrics);
  } catch (error) {
    sendInternalServerError(res, 'Failed to retrieve metrics');
  }
});

app.get('/validation/rules', (req, res) => {
  try {
    const rules = {
      user: {
        username: {
          required: true,
          minLength: 3,
          maxLength: 50,
          pattern: '^[a-zA-Z0-9_-]+$',
        },
        displayName: {
          required: false,
          minLength: 1,
          maxLength: 100,
        },
      },
      utils: {
        math: {
          operation: ['add', 'subtract', 'multiply', 'divide'],
          required: ['a', 'b', 'operation'],
        },
        even: {
          number: {
            type: 'integer',
            min: -Number.MAX_SAFE_INTEGER,
            max: Number.MAX_SAFE_INTEGER,
          },
        },
      },
    };
    sendSuccess(res, 'Validation rules retrieved successfully', rules);
  } catch (error) {
    sendInternalServerError(res, 'Failed to retrieve validation rules');
  }
});

app.get('/', (req, res) => {
  sendSuccess(res, 'QMemory API Server', {
    version: '1.0.2',
    description:
      'A comprehensive production-ready Node.js utility library with MongoDB document operations',
    endpoints: {
      health: 'GET /health',
      metrics: 'GET /metrics',
      validation: 'GET /validation/rules',
      users: 'GET /users, POST /users, GET /users/:id, PUT /users/:id, DELETE /users/:id',
      userByUsername: 'GET /users/by-username/:username',
      clearUsers: 'POST /users/clear',
      utils: {
        greet: 'GET /utils/greet?name=:name',
        math: 'POST /utils/math',
        even: 'GET /utils/even/:number',
        dedupe: 'POST /utils/dedupe',
      },
    },
    timestamp: getTimestamp(),
  });
});

// === USER MANAGEMENT ENDPOINTS ===

app.get('/users', (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedUsers = users.slice(startIndex, endIndex);

    const response = {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit),
      },
    };

    sendSuccess(res, 'Users retrieved successfully', response);
  } catch (error) {
    sendInternalServerError(res, 'Failed to retrieve users');
  }
});

app.post('/users', (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username) {
      return sendBadRequest(res, 'Username is required');
    }

    if (findUserByUsername(username)) {
      return sendBadRequest(res, 'Username already exists');
    }

    const user = createUser({ username, displayName });
    sendSuccess(res, 'User created successfully', user);
  } catch (error) {
    sendInternalServerError(res, 'Failed to create user');
  }
});

app.get('/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }
    sendSuccess(res, 'User found successfully', user);
  } catch (error) {
    sendInternalServerError(res, 'Failed to retrieve user');
  }
});

app.put('/users/:id', (req, res) => {
  try {
    const user = updateUser(req.params.id, req.body);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }
    sendSuccess(res, 'User updated successfully', user);
  } catch (error) {
    sendInternalServerError(res, 'Failed to update user');
  }
});

app.delete('/users/:id', (req, res) => {
  try {
    const deleted = deleteUser(req.params.id);
    if (!deleted) {
      return sendNotFound(res, 'User not found');
    }
    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    sendInternalServerError(res, 'Failed to delete user');
  }
});

app.get('/users/by-username/:username', (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return sendNotFound(res, 'User not found');
    }
    sendSuccess(res, 'User found successfully', user);
  } catch (error) {
    sendInternalServerError(res, 'Failed to retrieve user');
  }
});

app.post('/users/clear', (req, res) => {
  try {
    users = [];
    userIdCounter = 1;
    sendSuccess(res, 'All users cleared successfully');
  } catch (error) {
    sendInternalServerError(res, 'Failed to clear users');
  }
});

// === UTILITY ENDPOINTS ===

app.get('/utils/greet', (req, res) => {
  try {
    const name = (req.query.name as string) || 'World';
    const greeting = greet(name);
    sendSuccess(res, 'Greeting generated successfully', { greeting, name });
  } catch (error) {
    sendInternalServerError(res, 'Failed to generate greeting');
  }
});

app.post('/utils/math', (req, res) => {
  try {
    const { a, b, operation } = req.body;

    if (a === undefined || b === undefined || !operation) {
      return sendBadRequest(res, 'Parameters a, b, and operation are required');
    }

    const validOperations = ['add', 'subtract', 'multiply', 'divide'];
    if (!validOperations.includes(operation)) {
      return sendBadRequest(
        res,
        `Invalid operation. Must be one of: ${validOperations.join(', ')}`
      );
    }

    let result;
    switch (operation) {
      case 'add':
        result = add(a, b);
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return sendBadRequest(res, 'Division by zero is not allowed');
        }
        result = a / b;
        break;
    }

    sendSuccess(res, 'Math operation completed successfully', {
      a,
      b,
      operation,
      result,
    });
  } catch (error) {
    sendInternalServerError(res, 'Failed to perform math operation');
  }
});

app.get('/utils/even/:number', (req, res) => {
  try {
    const number = parseInt(req.params.number);

    if (isNaN(number)) {
      return sendBadRequest(res, 'Parameter must be a valid integer');
    }

    const evenCheck = isEven(number);
    const message = `${number} is ${evenCheck ? 'even' : 'odd'}`;

    sendSuccess(res, 'Even check completed successfully', {
      number,
      isEven: evenCheck,
      message,
    });
  } catch (error) {
    sendInternalServerError(res, 'Failed to check even/odd');
  }
});

app.post('/utils/dedupe', (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return sendBadRequest(res, 'Items must be an array');
    }

    const deduped = dedupe(items);

    sendSuccess(res, 'Array deduplicated successfully', {
      original: items,
      deduped,
      removed: items.length - deduped.length,
    });
  } catch (error) {
    sendInternalServerError(res, 'Failed to deduplicate array');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendInternalServerError(res, 'Internal server error');
});

// 404 handler
app.use((req, res) => {
  sendNotFound(res, 'Endpoint not found');
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`QMemory API Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API documentation: http://localhost:${PORT}/`);
  });
}

export default app;
