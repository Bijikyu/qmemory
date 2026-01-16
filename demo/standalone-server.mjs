/**
 * Standalone Express Server for Frontend-Backend Integration Testing
 * Provides all expected endpoints without complex library dependencies
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demonstration
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

function sendSuccess(res, message, data = null) {
  const response = {
    message,
    timestamp: new Date().toISOString(),
    ...(data !== null && { data }),
  };
  res.status(200).json(response);
}

function sendError(res, statusCode, message) {
  const response = {
    error: {
      type: getErrorType(statusCode),
      message,
      timestamp: new Date().toISOString(),
      requestId: generateUniqueId(),
    },
  };
  res.status(statusCode).json(response);
}

function getErrorType(statusCode) {
  const types = {
    400: 'BAD_REQUEST',
    401: 'AUTHENTICATION_ERROR',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return types[statusCode] || 'ERROR';
}

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

// === HEALTH & SYSTEM ENDPOINTS ===

app.get('/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.2',
    };
    sendSuccess(res, 'Health check completed', healthStatus);
  } catch (error) {
    sendError(res, 500, 'Health check failed');
  }
});

app.get('/metrics', (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      requests: {
        total: 0,
        active: 0,
        errors: 0,
      },
      memory: process.memoryUsage(),
      cpu: {
        usage: process.cpuUsage(),
      },
      users: {
        total: users.length,
        active: users.filter(u => !u.deleted).length,
      },
    };
    sendSuccess(res, 'Metrics retrieved successfully', metrics);
  } catch (error) {
    sendError(res, 500, 'Failed to retrieve metrics');
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
    sendError(res, 500, 'Failed to retrieve validation rules');
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
  });
});

// === USER MANAGEMENT ENDPOINTS ===

app.get('/users', (req, res) => {
  try {
    // Strict validation for pagination parameters
    const pageStr = req.query.page || '1';
    const limitStr = req.query.limit || '10';

    if (!/^\d+$/.test(pageStr) || !/^\d+$/.test(limitStr)) {
      return sendError(res, 400, 'Pagination parameters must be positive integers');
    }

    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, users.length);

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
    sendError(res, 500, 'Failed to retrieve users');
  }
});

app.post('/users', (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username) {
      return sendError(res, 400, 'Username is required');
    }

    if (findUserByUsername(username)) {
      return sendError(res, 409, 'Username already exists');
    }

    const user = createUser({ username, displayName });
    sendSuccess(res, 'User created successfully', user);
  } catch (error) {
    sendError(res, 500, 'Failed to create user');
  }
});

app.get('/users/:id', (req, res) => {
  try {
    const user = findUserById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 'User found successfully', user);
  } catch (error) {
    sendError(res, 500, 'Failed to retrieve user');
  }
});

app.put('/users/:id', (req, res) => {
  try {
    const user = updateUser(req.params.id, req.body);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 'User updated successfully', user);
  } catch (error) {
    sendError(res, 500, 'Failed to update user');
  }
});

app.delete('/users/:id', (req, res) => {
  try {
    const deleted = deleteUser(req.params.id);
    if (!deleted) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to delete user');
  }
});

app.get('/users/by-username/:username', (req, res) => {
  try {
    const user = findUserByUsername(req.params.username);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }
    sendSuccess(res, 'User found successfully', user);
  } catch (error) {
    sendError(res, 500, 'Failed to retrieve user');
  }
});

app.post('/users/clear', (req, res) => {
  try {
    users = [];
    userIdCounter = 1;
    sendSuccess(res, 'All users cleared successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to clear users');
  }
});

// === UTILITY ENDPOINTS ===

app.get('/utils/greet', (req, res) => {
  try {
    const name = req.query.name || 'World';
    const greeting = `Hello, ${name}!`;
    sendSuccess(res, 'Greeting generated successfully', { greeting, name });
  } catch (error) {
    sendError(res, 500, 'Failed to generate greeting');
  }
});

app.post('/utils/math', (req, res) => {
  try {
    const { a, b, operation } = req.body;

    if (typeof a === 'undefined' || typeof b === 'undefined' || !operation) {
      return sendError(res, 400, 'Parameters a, b, and operation are required');
    }

    const validOperations = ['add', 'subtract', 'multiply', 'divide'];
    if (!validOperations.includes(operation)) {
      return sendError(
        res,
        400,
        `Invalid operation. Must be one of: ${validOperations.join(', ')}`
      );
    }

    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return sendError(res, 400, 'Division by zero is not allowed');
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
    sendError(res, 500, 'Failed to perform math operation');
  }
});

app.get('/utils/even/:number', (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);

    if (isNaN(number) || number.toString() !== req.params.number) {
      return sendError(res, 400, 'Parameter must be a valid integer');
    }

    const isEven = number % 2 === 0;
    const message = `${number} is ${isEven ? 'even' : 'odd'}`;

    sendSuccess(res, 'Even check completed successfully', {
      number,
      isEven,
      message,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to check even/odd');
  }
});

app.post('/utils/dedupe', (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return sendError(res, 400, 'Items must be an array');
    }

    const deduped = [...new Set(items)];

    sendSuccess(res, 'Array deduplicated successfully', {
      original: items,
      deduped,
      removed: items.length - deduped.length,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to deduplicate array');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendError(res, 500, 'Internal server error');
});

// 404 handler
app.use((req, res) => {
  sendError(res, 404, 'Endpoint not found');
  return;
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 QMemory API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 API documentation: http://localhost:${PORT}/`);
  });
}

export default app;
