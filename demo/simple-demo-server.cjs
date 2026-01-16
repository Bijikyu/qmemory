const express = require('express');
const path = require('path');

const app = express();
const port = 5000;

// Mock storage for testing
let users = [];
let userId = 1;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

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

// Serve demo.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'demo.html'));
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    title: 'QMemory Library Demo',
    description: 'Production-ready Node.js utility library demonstration',
    endpoints: {
      core: {
        'GET /health': 'Health check and system status',
        'GET /users': 'List users with pagination',
        'POST /users': 'Create new user',
        'GET /users/:id': 'Get user by ID',
        'DELETE /users/:id': 'Delete user by ID',
      },
      email: {
        'POST /utils/email/validate': 'Validate email address',
        'POST /utils/email/normalize': 'Normalize email address',
        'POST /utils/email/domain': 'Extract domain from email',
        'POST /utils/email/filter': 'Filter valid emails from list',
      },
      memoization: {
        'POST /utils/memoize/fibonacci': 'Calculate Fibonacci with/without memoization',
        'POST /utils/memoize/ttl': 'Cache value with TTL',
        'GET /utils/memoize/stats': 'Get memoization statistics',
      },
      circuitBreaker: {
        'POST /utils/circuit-breaker/test': 'Test circuit breaker',
        'GET /utils/circuit-breaker/state': 'Get circuit state',
        'POST /utils/circuit-breaker/reset': 'Reset circuit breaker',
      },
      queue: {
        'POST /utils/queue/async': 'Run async queue jobs',
        'POST /utils/queue/concurrency-limiter': 'Test concurrency limiter',
        'POST /utils/queue/periodic/start': 'Start periodic task',
      },
      fast: {
        'POST /utils/fast/math': 'Fast math operations',
        'POST /utils/fast/string': 'Fast string operations',
        'POST /utils/fast/hash': 'Generate hash',
      },
      pagination: {
        'POST /utils/pagination/offset': 'Generate offset pagination meta',
        'POST /utils/pagination/cursor': 'Test cursor pagination',
      },
      cache: {
        'POST /utils/cache/lru/set': 'Set LRU cache value',
        'GET /utils/cache/lru/get/:key': 'Get LRU cache value',
        'GET /utils/cache/metrics': 'Get cache metrics',
      },
      streaming: {
        'POST /utils/streaming/json/parse': 'Safe JSON parse',
        'POST /utils/streaming/chunked': 'Chunked processing',
      },
      fields: {
        'POST /utils/fields/normalize': 'Normalize field name',
        'POST /utils/fields/serialize': 'Serialize document',
      },
      security: {
        'GET /utils/security/rate-limit-test': 'Test rate limiter',
        'GET /utils/security/headers': 'Get security headers',
        'GET /utils/security/ccpa-compliance': 'CCPA compliance info',
      },
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

// ============ DEMO STATE FOR UTILITIES ============
const demoState = {
  memoCache: new Map(),
  ttlCache: new Map(),
  ttlExpiry: null,
  lruCache: new Map(),
  circuitBreaker: { state: 'CLOSED', failures: 0, lastFailure: null },
  periodicTasks: new Map(),
  queueState: { pending: 0, processing: 0, completed: 0 },
  rateLimitCounter: new Map(),
};

// ============ EMAIL UTILITIES ============
app.post('/utils/email/validate', (req, res) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  res.json({
    email,
    isValid,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/email/normalize', (req, res) => {
  const { email } = req.body;
  const normalized = email.toLowerCase().trim();
  res.json({
    original: email,
    normalized,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/email/domain', (req, res) => {
  const { email } = req.body;
  const parts = email.split('@');
  const domain = parts.length === 2 ? parts[1].toLowerCase() : null;
  res.json({
    email,
    domain,
    isValid: domain !== null,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/email/filter', (req, res) => {
  const { emails } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid = emails.filter(e => emailRegex.test(e));
  const invalid = emails.filter(e => !emailRegex.test(e));
  res.json({
    totalInput: emails.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    validEmails: valid,
    invalidEmails: invalid,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/email/target', (req, res) => {
  const { name, email } = req.body;
  const target = name ? `"${name}" <${email}>` : email;
  res.json({
    target,
    name: name || null,
    email,
    timestamp: new Date().toISOString(),
  });
});

// ============ MEMOIZATION ============
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function memoizedFibonacci(n, cache = new Map()) {
  if (n <= 1) return n;
  if (cache.has(n)) return cache.get(n);
  const result = memoizedFibonacci(n - 1, cache) + memoizedFibonacci(n - 2, cache);
  cache.set(n, result);
  return result;
}

app.post('/utils/memoize/fibonacci', (req, res) => {
  const { n, memoized } = req.body;
  const start = process.hrtime.bigint();
  let result;
  if (memoized) {
    result = memoizedFibonacci(n, demoState.memoCache);
  } else {
    result = fibonacci(Math.min(n, 35));
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1000000;
  res.json({
    n,
    result,
    memoized,
    durationMs: durationMs.toFixed(3),
    cacheSize: demoState.memoCache.size,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/memoize/ttl', (req, res) => {
  const { value, ttl } = req.body;
  const key = 'ttl-demo';
  demoState.ttlCache.set(key, value);
  demoState.ttlExpiry = Date.now() + ttl;
  setTimeout(() => {
    if (demoState.ttlCache.has(key)) {
      demoState.ttlCache.delete(key);
    }
  }, ttl);
  res.json({
    key,
    value,
    ttl,
    expiresAt: new Date(demoState.ttlExpiry).toISOString(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/memoize/ttl/check', (req, res) => {
  const key = 'ttl-demo';
  const exists = demoState.ttlCache.has(key);
  const remaining = demoState.ttlExpiry ? Math.max(0, demoState.ttlExpiry - Date.now()) : 0;
  res.json({
    key,
    exists,
    value: exists ? demoState.ttlCache.get(key) : null,
    remainingMs: remaining,
    expired: !exists && demoState.ttlExpiry !== null,
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/memoize/stats', (req, res) => {
  res.json({
    memoCacheSize: demoState.memoCache.size,
    ttlCacheSize: demoState.ttlCache.size,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/memoize/clear', (req, res) => {
  demoState.memoCache.clear();
  demoState.ttlCache.clear();
  res.json({
    message: 'Memoization cache cleared',
    timestamp: new Date().toISOString(),
  });
});

// ============ CIRCUIT BREAKER ============
app.post('/utils/circuit-breaker/test', (req, res) => {
  const { failureRate } = req.body;
  const shouldFail = Math.random() * 100 < failureRate;
  
  if (demoState.circuitBreaker.state === 'OPEN') {
    return res.json({
      success: false,
      state: 'OPEN',
      message: 'Circuit is open - requests are being rejected',
      timestamp: new Date().toISOString(),
    });
  }
  
  if (shouldFail) {
    demoState.circuitBreaker.failures++;
    demoState.circuitBreaker.lastFailure = Date.now();
    if (demoState.circuitBreaker.failures >= 5) {
      demoState.circuitBreaker.state = 'OPEN';
      setTimeout(() => {
        demoState.circuitBreaker.state = 'HALF_OPEN';
      }, 10000);
    }
    return res.json({
      success: false,
      state: demoState.circuitBreaker.state,
      failures: demoState.circuitBreaker.failures,
      message: 'Simulated failure',
      timestamp: new Date().toISOString(),
    });
  }
  
  if (demoState.circuitBreaker.state === 'HALF_OPEN') {
    demoState.circuitBreaker.state = 'CLOSED';
    demoState.circuitBreaker.failures = 0;
  }
  
  res.json({
    success: true,
    state: demoState.circuitBreaker.state,
    failures: demoState.circuitBreaker.failures,
    message: 'Request succeeded',
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/circuit-breaker/trigger-open', (req, res) => {
  demoState.circuitBreaker.state = 'OPEN';
  demoState.circuitBreaker.failures = 5;
  setTimeout(() => {
    demoState.circuitBreaker.state = 'HALF_OPEN';
  }, 10000);
  res.json({
    message: 'Circuit opened due to forced failures',
    state: demoState.circuitBreaker.state,
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/circuit-breaker/state', (req, res) => {
  res.json({
    state: demoState.circuitBreaker.state,
    failures: demoState.circuitBreaker.failures,
    lastFailure: demoState.circuitBreaker.lastFailure 
      ? new Date(demoState.circuitBreaker.lastFailure).toISOString() 
      : null,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/circuit-breaker/reset', (req, res) => {
  demoState.circuitBreaker = { state: 'CLOSED', failures: 0, lastFailure: null };
  res.json({
    message: 'Circuit breaker reset',
    state: demoState.circuitBreaker.state,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/circuit-breaker/factory/create', (req, res) => {
  const { serviceName } = req.body;
  res.json({
    serviceName,
    created: true,
    config: {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxAttempts: 3,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/circuit-breaker/factory/stats', (req, res) => {
  res.json({
    totalBreakers: 1,
    breakers: {
      'demo-service': demoState.circuitBreaker,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============ QUEUE MANAGEMENT ============
app.post('/utils/queue/async', async (req, res) => {
  const { jobCount, concurrency } = req.body;
  const results = [];
  const startTime = Date.now();
  
  const processJob = async (jobId) => {
    const delay = Math.random() * 200 + 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { jobId, duration: delay.toFixed(0), status: 'completed' };
  };
  
  const queue = [];
  for (let i = 0; i < jobCount; i++) {
    queue.push(i + 1);
  }
  
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(batch.map(processJob));
    results.push(...batchResults);
  }
  
  res.json({
    jobCount,
    concurrency,
    totalDurationMs: Date.now() - startTime,
    results,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/queue/concurrency-limiter', async (req, res) => {
  const { maxConcurrent } = req.body;
  let concurrent = 0;
  let maxReached = 0;
  const operations = [];
  
  const runOperation = async (id) => {
    concurrent++;
    maxReached = Math.max(maxReached, concurrent);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    concurrent--;
    return { id, maxConcurrent: maxReached };
  };
  
  const promises = [];
  for (let i = 0; i < 10; i++) {
    if (promises.length >= maxConcurrent) {
      await Promise.race(promises);
    }
    const promise = runOperation(i + 1).then(result => {
      operations.push(result);
      promises.splice(promises.indexOf(promise), 1);
    });
    promises.push(promise);
  }
  await Promise.all(promises);
  
  res.json({
    maxConcurrent,
    maxActualConcurrent: maxReached,
    operations: operations.length,
    timestamp: new Date().toISOString(),
  });
});

let periodicTaskId = 0;
app.post('/utils/queue/periodic/start', (req, res) => {
  const { interval } = req.body;
  const taskId = `task-${++periodicTaskId}`;
  let count = 0;
  
  const intervalId = setInterval(() => {
    count++;
    console.log(`Periodic task ${taskId}: execution ${count}`);
  }, interval);
  
  demoState.periodicTasks.set(taskId, { intervalId, interval, startedAt: Date.now(), executions: 0 });
  
  res.json({
    taskId,
    interval,
    message: 'Periodic task started',
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/queue/periodic/stop', (req, res) => {
  const stopped = [];
  for (const [taskId, task] of demoState.periodicTasks) {
    clearInterval(task.intervalId);
    stopped.push(taskId);
  }
  demoState.periodicTasks.clear();
  
  res.json({
    message: 'All periodic tasks stopped',
    stoppedTasks: stopped,
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/queue/periodic/active', (req, res) => {
  const tasks = [];
  for (const [taskId, task] of demoState.periodicTasks) {
    tasks.push({
      taskId,
      interval: task.interval,
      runningFor: Date.now() - task.startedAt,
    });
  }
  res.json({
    activeTasks: tasks.length,
    tasks,
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/queue/state', (req, res) => {
  res.json({
    queueState: demoState.queueState,
    periodicTasks: demoState.periodicTasks.size,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/queue/enforce-limit', (req, res) => {
  demoState.queueState = { pending: 0, processing: 0, completed: 0 };
  res.json({
    message: 'Queue limit enforced',
    queueState: demoState.queueState,
    timestamp: new Date().toISOString(),
  });
});

// ============ FAST OPERATIONS ============
app.post('/utils/fast/math', (req, res) => {
  const { a, b } = req.body;
  res.json({
    operations: {
      add: a + b,
      subtract: a - b,
      multiply: a * b,
      divide: b !== 0 ? a / b : 'undefined',
      modulo: b !== 0 ? a % b : 'undefined',
      power: Math.pow(a, b > 10 ? 10 : b),
      max: Math.max(a, b),
      min: Math.min(a, b),
      abs_a: Math.abs(a),
      floor_a: Math.floor(a),
      ceil_a: Math.ceil(a),
      sqrt_a: a >= 0 ? Math.sqrt(a) : 'undefined',
    },
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fast/string', (req, res) => {
  const { input } = req.body;
  res.json({
    operations: {
      length: input.length,
      uppercase: input.toUpperCase(),
      lowercase: input.toLowerCase(),
      reversed: input.split('').reverse().join(''),
      trimmed: input.trim(),
      words: input.split(/\s+/).length,
      chars: input.replace(/\s/g, '').length,
      firstChar: input.charAt(0),
      lastChar: input.charAt(input.length - 1),
      isPalindrome: input.toLowerCase().replace(/\s/g, '') === input.toLowerCase().replace(/\s/g, '').split('').reverse().join(''),
    },
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fast/hash', (req, res) => {
  const { input } = req.body;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  res.json({
    input,
    hash: Math.abs(hash).toString(16),
    hashInt: Math.abs(hash),
    djb2: Math.abs(hash),
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fast/object-pool', (req, res) => {
  const { poolSize } = req.body;
  const pool = [];
  const acquired = [];
  
  for (let i = 0; i < poolSize; i++) {
    pool.push({ id: i + 1, data: null });
  }
  
  for (let i = 0; i < Math.min(3, poolSize); i++) {
    const obj = pool.pop();
    obj.data = `acquired-${i + 1}`;
    acquired.push(obj);
  }
  
  res.json({
    poolSize,
    availableInPool: pool.length,
    acquired: acquired.length,
    acquiredObjects: acquired,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fast/lock-free-queue', (req, res) => {
  const { operations } = req.body;
  const queue = [];
  const startTime = process.hrtime.bigint();
  
  for (let i = 0; i < operations / 2; i++) {
    queue.push(i);
  }
  for (let i = 0; i < operations / 2; i++) {
    queue.shift();
  }
  
  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1000000;
  
  res.json({
    operations,
    enqueued: operations / 2,
    dequeued: operations / 2,
    finalQueueSize: queue.length,
    durationMs: durationMs.toFixed(3),
    opsPerSecond: Math.floor(operations / (durationMs / 1000)),
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/fast/timer', (req, res) => {
  const measurements = [];
  for (let i = 0; i < 10; i++) {
    const start = process.hrtime.bigint();
    const end = process.hrtime.bigint();
    measurements.push(Number(end - start));
  }
  
  res.json({
    measurements: measurements.map(m => m + 'ns'),
    averageNs: Math.floor(measurements.reduce((a, b) => a + b, 0) / measurements.length),
    precision: 'nanoseconds',
    timestamp: new Date().toISOString(),
  });
});

// ============ PAGINATION ============
app.post('/utils/pagination/offset', (req, res) => {
  const { page, limit, total } = req.body;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  res.json({
    pagination: {
      page,
      limit,
      total,
      totalPages,
      offset,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/pagination/cursor', (req, res) => {
  const { cursor, limit } = req.body;
  let decodedCursor = null;
  if (cursor) {
    try {
      decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch (e) {
      return res.status(400).json({ error: 'Invalid cursor format' });
    }
  }
  
  const mockItems = Array.from({ length: limit }, (_, i) => ({
    id: `item-${(decodedCursor?.offset || 0) + i + 1}`,
    value: `Value ${(decodedCursor?.offset || 0) + i + 1}`,
  }));
  
  const nextCursor = Buffer.from(JSON.stringify({
    offset: (decodedCursor?.offset || 0) + limit,
    timestamp: Date.now(),
  })).toString('base64');
  
  res.json({
    items: mockItems,
    cursor: {
      current: cursor,
      next: nextCursor,
      hasMore: true,
    },
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/pagination/cursor/generate', (req, res) => {
  const { id, timestamp } = req.body;
  const cursor = Buffer.from(JSON.stringify({ id, timestamp, offset: 0 })).toString('base64');
  res.json({
    cursor,
    decoded: { id, timestamp, offset: 0 },
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/pagination/sort/validate', (req, res) => {
  const { field, order } = req.body;
  const allowedFields = ['id', 'name', 'createdAt', 'updatedAt', 'username', 'email'];
  const allowedOrders = ['asc', 'desc'];
  
  const isValidField = allowedFields.includes(field);
  const isValidOrder = allowedOrders.includes(order);
  
  res.json({
    field,
    order,
    isValidField,
    isValidOrder,
    isValid: isValidField && isValidOrder,
    allowedFields,
    allowedOrders,
    timestamp: new Date().toISOString(),
  });
});

// ============ CACHE UTILITIES ============
app.post('/utils/cache/lru/set', (req, res) => {
  const { key, value } = req.body;
  const maxSize = 100;
  
  if (demoState.lruCache.size >= maxSize && !demoState.lruCache.has(key)) {
    const firstKey = demoState.lruCache.keys().next().value;
    demoState.lruCache.delete(firstKey);
  }
  
  demoState.lruCache.delete(key);
  demoState.lruCache.set(key, value);
  
  res.json({
    key,
    value,
    cacheSize: demoState.lruCache.size,
    operation: 'set',
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/cache/lru/get/:key', (req, res) => {
  const { key } = req.params;
  const exists = demoState.lruCache.has(key);
  const value = demoState.lruCache.get(key);
  
  if (exists) {
    demoState.lruCache.delete(key);
    demoState.lruCache.set(key, value);
  }
  
  res.json({
    key,
    value: exists ? value : null,
    found: exists,
    cacheSize: demoState.lruCache.size,
    timestamp: new Date().toISOString(),
  });
});

app.delete('/utils/cache/lru/delete/:key', (req, res) => {
  const { key } = req.params;
  const existed = demoState.lruCache.has(key);
  demoState.lruCache.delete(key);
  
  res.json({
    key,
    deleted: existed,
    cacheSize: demoState.lruCache.size,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/cache/bounded-queue', (req, res) => {
  const { maxSize, itemCount } = req.body;
  const queue = [];
  const evicted = [];
  
  for (let i = 0; i < itemCount; i++) {
    if (queue.length >= maxSize) {
      evicted.push(queue.shift());
    }
    queue.push(`item-${i + 1}`);
  }
  
  res.json({
    maxSize,
    itemsAdded: itemCount,
    itemsEvicted: evicted.length,
    evictedItems: evicted,
    finalQueue: queue,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/cache/bounded-map', (req, res) => {
  const { maxSize } = req.body;
  const map = new Map();
  const evicted = [];
  
  for (let i = 0; i < maxSize + 5; i++) {
    if (map.size >= maxSize) {
      const firstKey = map.keys().next().value;
      evicted.push({ key: firstKey, value: map.get(firstKey) });
      map.delete(firstKey);
    }
    map.set(`key-${i + 1}`, `value-${i + 1}`);
  }
  
  res.json({
    maxSize,
    entriesAdded: maxSize + 5,
    entriesEvicted: evicted.length,
    evictedEntries: evicted,
    finalMap: Object.fromEntries(map),
    timestamp: new Date().toISOString(),
  });
});

let cacheMetrics = { hits: 0, misses: 0, sets: 0 };
app.get('/utils/cache/metrics', (req, res) => {
  res.json({
    metrics: cacheMetrics,
    hitRate: cacheMetrics.hits + cacheMetrics.misses > 0 
      ? ((cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)) * 100).toFixed(2) + '%'
      : '0%',
    lruCacheSize: demoState.lruCache.size,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/cache/metrics/reset', (req, res) => {
  cacheMetrics = { hits: 0, misses: 0, sets: 0 };
  res.json({
    message: 'Cache metrics reset',
    metrics: cacheMetrics,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/cache/memory-optimized', (req, res) => {
  const { maxItems } = req.body;
  const cache = new Map();
  
  for (let i = 0; i < maxItems; i++) {
    cache.set(`key-${i}`, { value: `value-${i}`, size: Math.floor(Math.random() * 1000) });
  }
  
  const totalSize = Array.from(cache.values()).reduce((sum, v) => sum + v.size, 0);
  
  res.json({
    maxItems,
    itemsStored: cache.size,
    estimatedSizeBytes: totalSize,
    averageItemSize: Math.floor(totalSize / cache.size),
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/cache/memory-optimized/stats', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    memory: {
      heapUsed: Math.floor(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.floor(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.floor(memUsage.external / 1024 / 1024) + 'MB',
      rss: Math.floor(memUsage.rss / 1024 / 1024) + 'MB',
    },
    caches: {
      lru: demoState.lruCache.size,
      memo: demoState.memoCache.size,
      ttl: demoState.ttlCache.size,
    },
    timestamp: new Date().toISOString(),
  });
});

// ============ STREAMING ============
app.post('/utils/streaming/json/parse', (req, res) => {
  const { input } = req.body;
  try {
    const parsed = JSON.parse(input);
    res.json({
      success: true,
      parsed,
      type: typeof parsed,
      isArray: Array.isArray(parsed),
      keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      input,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/utils/streaming/json/stringify', (req, res) => {
  const { input } = req.body;
  try {
    const stringified = JSON.stringify(input, null, 2);
    res.json({
      success: true,
      stringified,
      length: stringified.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post('/utils/streaming/chunked', (req, res) => {
  const { dataSize, chunkSize } = req.body;
  const data = Array.from({ length: dataSize }, (_, i) => i + 1);
  const chunks = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push({
      chunkIndex: chunks.length,
      items: data.slice(i, i + chunkSize),
      start: i,
      end: Math.min(i + chunkSize, data.length),
    });
  }
  
  res.json({
    dataSize,
    chunkSize,
    totalChunks: chunks.length,
    chunks: chunks.slice(0, 5),
    remaining: chunks.length > 5 ? chunks.length - 5 : 0,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/streaming/lines', (req, res) => {
  const { input } = req.body;
  const lines = input.split('\n');
  
  res.json({
    totalLines: lines.length,
    lines: lines.map((line, index) => ({
      lineNumber: index + 1,
      content: line,
      length: line.length,
      isEmpty: line.trim().length === 0,
    })),
    nonEmptyLines: lines.filter(l => l.trim().length > 0).length,
    totalCharacters: input.length,
    timestamp: new Date().toISOString(),
  });
});

// ============ FIELD UTILITIES ============
app.post('/utils/fields/normalize', (req, res) => {
  const { fieldName } = req.body;
  const normalized = fieldName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/-/g, '_');
  
  res.json({
    original: fieldName,
    normalized,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/denormalize', (req, res) => {
  const { fieldName } = req.body;
  const denormalized = fieldName
    .split('_')
    .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  res.json({
    original: fieldName,
    denormalized,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/normalize-object', (req, res) => {
  const { object } = req.body;
  const normalized = {};
  
  for (const [key, value] of Object.entries(object)) {
    const normalizedKey = key
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    normalized[normalizedKey] = value;
  }
  
  res.json({
    original: object,
    normalized,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/denormalize-object', (req, res) => {
  const { object } = req.body;
  const denormalized = {};
  
  for (const [key, value] of Object.entries(object)) {
    const denormalizedKey = key
      .split('_')
      .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    denormalized[denormalizedKey] = value;
  }
  
  res.json({
    original: object,
    denormalized,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/collection-name', (req, res) => {
  const { modelName } = req.body;
  const collectionName = modelName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '') + 's';
  
  res.json({
    modelName,
    collectionName,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/mongo-type', (req, res) => {
  const { typeName } = req.body;
  const typeMap = {
    string: 'String',
    number: 'Number',
    boolean: 'Boolean',
    date: 'Date',
    objectId: 'ObjectId',
    array: 'Array',
    object: 'Mixed',
    buffer: 'Buffer',
    map: 'Map',
  };
  
  res.json({
    typeName,
    mongoType: typeMap[typeName] || 'Mixed',
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/fields/supported-types', (req, res) => {
  res.json({
    types: [
      { name: 'string', mongoType: 'String', description: 'Text data' },
      { name: 'number', mongoType: 'Number', description: 'Numeric data' },
      { name: 'boolean', mongoType: 'Boolean', description: 'True/false values' },
      { name: 'date', mongoType: 'Date', description: 'Date and time' },
      { name: 'objectId', mongoType: 'ObjectId', description: 'MongoDB ObjectId' },
      { name: 'array', mongoType: 'Array', description: 'List of items' },
      { name: 'object', mongoType: 'Mixed', description: 'Nested object' },
      { name: 'buffer', mongoType: 'Buffer', description: 'Binary data' },
      { name: 'map', mongoType: 'Map', description: 'Key-value pairs' },
    ],
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/serialize', (req, res) => {
  const { document } = req.body;
  const serialized = { ...document };
  
  if (serialized._id) {
    serialized.id = serialized._id;
    delete serialized._id;
  }
  delete serialized.__v;
  
  res.json({
    original: document,
    serialized,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/fields/serialize-without', (req, res) => {
  const { document, excludeFields } = req.body;
  const serialized = { ...document };
  
  for (const field of excludeFields) {
    delete serialized[field];
  }
  
  res.json({
    original: document,
    excludeFields,
    serialized,
    timestamp: new Date().toISOString(),
  });
});

// ============ SECURITY ============
app.get('/utils/security/rate-limit-test', (req, res) => {
  const clientId = req.ip || 'demo-client';
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 10;
  
  if (!demoState.rateLimitCounter.has(clientId)) {
    demoState.rateLimitCounter.set(clientId, { count: 0, windowStart: now });
  }
  
  const client = demoState.rateLimitCounter.get(clientId);
  
  if (now - client.windowStart > windowMs) {
    client.count = 0;
    client.windowStart = now;
  }
  
  client.count++;
  
  if (client.count > maxRequests) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((client.windowStart + windowMs - now) / 1000),
      timestamp: new Date().toISOString(),
    });
  }
  
  res.json({
    allowed: true,
    requestsRemaining: maxRequests - client.count,
    windowResetIn: Math.ceil((client.windowStart + windowMs - now) / 1000),
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/security/headers', (req, res) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
  });
  res.json({
    message: 'Security headers set',
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/security/helmet-config', (req, res) => {
  res.json({
    helmetConfig: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: { maxAge: 31536000, includeSubDomains: true },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/security/privacy-headers', (req, res) => {
  res.json({
    privacyHeaders: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    description: 'Headers for privacy-sensitive responses',
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/security/ccpa-compliance', (req, res) => {
  res.json({
    ccpaCompliance: {
      rightToKnow: true,
      rightToDelete: true,
      rightToOptOut: true,
      rightToNonDiscrimination: true,
      dataCategories: [
        'Identifiers',
        'Commercial information',
        'Internet activity',
        'Geolocation data',
      ],
      retentionPeriod: '24 months',
      verificationRequired: true,
    },
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/security/data-export', (req, res) => {
  const { userId } = req.body;
  res.json({
    userId,
    exportRequest: {
      status: 'pending',
      requestId: 'export-' + Date.now(),
      estimatedCompletion: '48 hours',
      format: 'JSON',
      includes: ['profile', 'activity', 'preferences', 'communications'],
    },
    message: 'Data export request received. You will be notified when ready.',
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/security/data-deletion', (req, res) => {
  const { userId } = req.body;
  res.json({
    userId,
    deletionRequest: {
      status: 'pending',
      requestId: 'delete-' + Date.now(),
      estimatedCompletion: '30 days',
      scope: ['personal data', 'activity logs', 'preferences'],
      retainedData: ['legal obligations', 'fraud prevention'],
    },
    message: 'Data deletion request received. Processing will begin shortly.',
    timestamp: new Date().toISOString(),
  });
});

// ============ VALIDATION RULES ============
app.get('/validation/rules', (req, res) => {
  res.json({
    data: {
      username: { required: true, minLength: 1, maxLength: 50, pattern: '^[a-zA-Z0-9_-]+$' },
      displayName: { required: false, minLength: 1, maxLength: 100, pattern: '^[a-zA-Z0-9\\s_-]+$' },
      email: { required: false, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
      url: { required: false }
    },
    timestamp: new Date().toISOString(),
  });
});

// ============ BASIC UTILITIES (existing) ============
app.get('/utils/greet', (req, res) => {
  const name = req.query.name || 'World';
  res.json({
    greeting: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/math', (req, res) => {
  const { a, b, operation } = req.body;
  let result;
  switch (operation) {
    case 'add': result = a + b; break;
    case 'subtract': result = a - b; break;
    case 'multiply': result = a * b; break;
    case 'divide': result = b !== 0 ? a / b : 'undefined'; break;
    default: result = a + b;
  }
  res.json({
    a, b, operation, result,
    timestamp: new Date().toISOString(),
  });
});

app.get('/utils/even/:num', (req, res) => {
  const num = parseInt(req.params.num);
  res.json({
    number: num,
    isEven: num % 2 === 0,
    timestamp: new Date().toISOString(),
  });
});

app.post('/utils/dedupe', (req, res) => {
  const { items } = req.body;
  const deduped = [...new Set(items)];
  res.json({
    original: items,
    deduped,
    removed: items.length - deduped.length,
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
