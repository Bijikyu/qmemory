const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Mock storage for testing
let users = [];
let userId = 1;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    userCount: users.length,
    timestamp: new Date().toISOString(),
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    title: 'QMemory Library Demo',
    description: 'Production-ready Node.js utility library demonstration',
    endpoints: {
      'GET /health': 'Health check and system status',
      'GET /users': 'List users with pagination (?page=1&limit=10)',
      'POST /users': 'Create new user (JSON: {username, displayName})',
      'GET /users/:id': 'Get user by ID',
      'DELETE /users/:id': 'Delete user by ID',
      'POST /users/clear': 'Clear all users (development only)',
    },
  });
});

// User management endpoints
app.get('/users', (req, res) => {
  // Strict validation for pagination parameters
  const pageStr = req.query.page || '1';
  const limitStr = req.query.limit || '10';
  
  if (!/^\d+$/.test(pageStr) || !/^\d+$/.test(limitStr)) {
    return res.status(400).json({
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Pagination parameters must be positive integers',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }
  
  const page = parseInt(pageStr, 10);
  const limit = parseInt(limitStr, 10);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedUsers = users.slice(startIndex, endIndex);

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      users: paginatedUsers,
      pagination: {
        page: page,
        limit: limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit),
      },
    },
  });
});

app.post('/users', (req, res) => {
  const { username, displayName } = req.body;

  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Username is required and must be a non-empty string',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  // Check for existing username
  if (users.find(u => u.username === username.trim())) {
    return res.status(400).json({
      error: {
        type: 'CONFLICT',
        message: `Username '${username.trim()}' already exists`,
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  const user = {
    id: userId++,
    username: username.trim(),
    displayName: displayName || null,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  res.status(201).json({
    message: 'User created successfully',
    timestamp: new Date().toISOString(),
    data: user,
  });
});

app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Strict validation to prevent numeric injection
  if (!Number.isInteger(id) || id <= 0 || !/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      error: {
        type: 'VALIDATION_ERROR',
        message: 'User ID must be a positive integer',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({
      error: {
        type: 'NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  res.json({
    message: 'User found',
    timestamp: new Date().toISOString(),
    data: user,
  });
});

app.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Strict validation to prevent numeric injection
  if (!Number.isInteger(id) || id <= 0 || !/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      error: {
        type: 'VALIDATION_ERROR',
        message: 'User ID must be a positive integer',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({
      error: {
        type: 'NOT_FOUND',
        message: 'User not found',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  const deletedUser = users.splice(userIndex, 1)[0];

  res.json({
    message: 'User deleted successfully',
    timestamp: new Date().toISOString(),
    data: deletedUser,
  });
});

app.post('/users/clear', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(400).json({
      error: {
        type: 'VALIDATION_ERROR',
        message: 'Clear operation not allowed in production',
        timestamp: new Date().toISOString(),
        requestId: 'req-' + Date.now(),
      },
    });
  }

  users = [];
  userId = 1;

  res.json({
    message: 'All users cleared successfully',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      type: 'NOT_FOUND',
      message: 'Endpoint not found',
      timestamp: new Date().toISOString(),
      requestId: 'req-' + Date.now(),
    },
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      type: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: 'req-' + Date.now(),
    },
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 QMemory Demo Server running on port ${port}`);
  console.log(`📱 Open http://localhost:${port}/demo.html to test the interface`);
  console.log(`🔧 API endpoints available at http://localhost:${port}`);

  // Create demo user
  const demoUser = {
    id: userId++,
    username: 'demo',
    displayName: 'Demo User',
    createdAt: new Date().toISOString(),
  };
  users.push(demoUser);
  console.log('✅ Created demo user for testing');
});
