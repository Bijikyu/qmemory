const express = require('express');
const path = require('path');

const app = express();
const port = 5000;

// Library imports (loaded dynamically since library is ESM)
// Falls back to mock implementations if library can't load
let lib = null;
let libraryError = null;

const loadLibrary = async () => {
  if (lib) return lib;
  if (libraryError) throw new Error('Library unavailable: ' + libraryError);
  try {
    lib = await import('../dist/index.js');
    return lib;
  } catch (err) {
    libraryError = err.message;
    throw err;
  }
};

// Mock implementations for fallback
const mockLib = {
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  normalizeEmail: (email) => email.toLowerCase().trim(),
  getEmailDomain: (email) => email.split('@')[1] || null,
  filterValidEmails: (emails) => emails.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
  createEmailTarget: (name, email) => name ? `"${name}" <${email}>` : email,
  greet: (name) => `Hello, ${name}!`,
  add: (a, b) => a + b,
  isEven: (n) => n % 2 === 0,
  dedupe: (arr) => [...new Set(arr)],
  normalizeFieldName: (f) => f.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
  denormalizeFieldName: (f) => f.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''),
  normalizeObjectFields: (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''), v])),
  denormalizeObjectFields: (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.split('_').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''), v])),
  getCollectionName: (model) => model.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') + 's',
  getMongoType: (t) => ({ string: 'String', number: 'Number', boolean: 'Boolean', date: 'Date', objectId: 'ObjectId', array: 'Array', object: 'Mixed' }[t] || 'Mixed'),
  getSupportedTypes: () => [{ name: 'string', mongoType: 'String' }, { name: 'number', mongoType: 'Number' }, { name: 'boolean', mongoType: 'Boolean' }],
  serializeDocument: (doc) => { const s = { ...doc }; if (s._id) { s.id = s._id; delete s._id; } delete s.__v; return s; },
  serializeWithoutFields: (doc, fields) => { const s = { ...doc }; fields.forEach(f => delete s[f]); return s; },
  safeJsonParse: (str) => { try { return { success: true, data: JSON.parse(str) }; } catch (e) { return { success: false, error: e.message }; } },
  safeJsonStringify: (obj, r, s) => { try { return { success: true, data: JSON.stringify(obj, r, s) }; } catch (e) { return { success: false, error: e.message }; } },
  validatePagination: (page, limit) => ({ valid: page > 0 && limit > 0, error: page <= 0 || limit <= 0 ? 'Invalid pagination' : null }),
  createPaginationMeta: (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit), offset: (page - 1) * limit, hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 }),
  createCursor: (data) => Buffer.from(JSON.stringify(data)).toString('base64'),
  validateSorting: (field, order, allowedFields) => ({ isValid: allowedFields.includes(field) && ['asc', 'desc'].includes(order), isValidField: allowedFields.includes(field), isValidOrder: ['asc', 'desc'].includes(order) }),
  getCacheMetrics: () => ({ hits: 0, misses: 0, sets: 0 }),
  resetCacheMetrics: () => {},
  dedupe: (arr) => [...new Set(arr)],
  generateId: () => 'id_' + Math.random().toString(36).slice(2, 11),
  FastMath: { add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b, mod: (a, b) => a % b, pow: Math.pow, max: Math.max, min: Math.min, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, sqrt: Math.sqrt },
  FastString: { len: (s) => s.length, upper: (s) => s.toUpperCase(), lower: (s) => s.toLowerCase(), reverse: (s) => s.split('').reverse().join(''), trim: (s) => s.trim(), charAt: (s, i) => s.charAt(i) },
  FastHash: { djb2: (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; } return Math.abs(h); } },
  ObjectPool: class { constructor(f, s) { this.factory = f; this.pool = Array.from({ length: s }, () => f()); } acquire() { return this.pool.pop() || this.factory(); } release(o) { this.pool.push(o); } },
  LockFreeQueue: class { constructor() { this.items = []; } enqueue(v) { this.items.push(v); } dequeue() { return this.items.shift(); } size() { return this.items.length; } },
  BoundedQueue: class { constructor(max) { this.max = max; this.items = []; } enqueue(v) { if (this.items.length >= this.max) { const e = this.items.shift(); this.items.push(v); return { evicted: e }; } this.items.push(v); return null; } toArray() { return [...this.items]; } },
  BoundedMap: class { constructor(max) { this.max = max; this.map = new Map(); } set(k, v) { if (this.map.size >= this.max && !this.map.has(k)) { const fk = this.map.keys().next().value; const e = { key: fk, value: this.map.get(fk) }; this.map.delete(fk); this.map.set(k, v); return { evicted: e }; } this.map.set(k, v); return null; } entries() { return this.map.entries(); } },
  MemStorage: class { constructor() { this.users = new Map(); this.id = 0; } async getUser(id) { return this.users.get(id); } async getUserByUsername(u) { return Array.from(this.users.values()).find(x => x.username === u); } async createUser(d) { const u = { ...d, id: ++this.id }; this.users.set(u.id, u); return u; } async getAllUsers() { return Array.from(this.users.values()); } },
};

// Get library (returns real or mock)
let usingMock = false;
const getLib = async () => {
  try {
    const realLib = await loadLibrary();
    usingMock = false;
    return realLib;
  } catch {
    usingMock = true;
    return mockLib;
  }
};

// Helper to get source label
const getSource = (funcName) => usingMock ? `mock.${funcName}` : `library.${funcName}`;

// Initialize library on startup
let libraryReady = false;
loadLibrary().then(() => {
  libraryReady = true;
  console.log('📚 Library loaded successfully');
}).catch(err => {
  console.log('⚠️ Library not available, using mock implementations');
  console.log('   Reason:', err.message);
});

// Real storage using library's MemStorage
let memStorage = null;
const getStorage = async () => {
  if (!memStorage) {
    const library = await getLib();
    memStorage = new library.MemStorage();
  }
  return memStorage;
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Health check endpoint - uses REAL storage
app.get('/health', async (req, res) => {
  try {
    const storage = await getStorage();
    const allUsers = await storage.getAllUsers();
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount: allUsers.length,
      source: getSource('MemStorage'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount: 0,
      source: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
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

// User management endpoints - ALL use REAL library storage
app.get('/users', async (req, res) => {
  const pageStr = req.query.page || '1';
  const limitStr = req.query.limit || '10';
  
  if (!/^\d+$/.test(pageStr) || !/^\d+$/.test(limitStr)) {
    return res.status(400).json({
      error: { type: 'VALIDATION_ERROR', message: 'Pagination parameters must be positive integers', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
    });
  }
  
  try {
    const storage = await getStorage();
    const allUsers = await storage.getAllUsers();
    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);
    const startIndex = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      source: getSource('MemStorage.getAllUsers'),
      timestamp: new Date().toISOString(),
      data: {
        users: paginatedUsers,
        pagination: { page, limit, total: allUsers.length, totalPages: Math.ceil(allUsers.length / limit) },
      },
    });
  } catch (err) {
    res.status(500).json({ error: { type: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() } });
  }
});

app.post('/users', async (req, res) => {
  const { username, displayName } = req.body;

  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({
      error: { type: 'VALIDATION_ERROR', message: 'Username is required and must be a non-empty string', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
    });
  }

  try {
    const storage = await getStorage();
    const existing = await storage.getUserByUsername(username.trim());
    if (existing) {
      return res.status(400).json({
        error: { type: 'CONFLICT', message: `Username '${username.trim()}' already exists`, timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
      });
    }

    const user = await storage.createUser({ username: username.trim(), displayName: displayName || null, createdAt: new Date().toISOString() });

    res.status(201).json({
      message: 'User created successfully',
      source: getSource('MemStorage.createUser'),
      timestamp: new Date().toISOString(),
      data: user,
    });
  } catch (err) {
    res.status(500).json({ error: { type: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() } });
  }
});

app.get('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0 || !/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      error: { type: 'VALIDATION_ERROR', message: 'User ID must be a positive integer', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
    });
  }

  try {
    const storage = await getStorage();
    const user = await storage.getUser(id);

    if (!user) {
      return res.status(404).json({
        error: { type: 'NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
      });
    }

    res.json({
      message: 'User found',
      source: getSource('MemStorage.getUser'),
      timestamp: new Date().toISOString(),
      data: user,
    });
  } catch (err) {
    res.status(500).json({ error: { type: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() } });
  }
});

app.delete('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (!Number.isInteger(id) || id <= 0 || !/^\d+$/.test(req.params.id)) {
    return res.status(400).json({
      error: { type: 'VALIDATION_ERROR', message: 'User ID must be a positive integer', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
    });
  }

  try {
    const storage = await getStorage();
    const user = await storage.getUser(id);

    if (!user) {
      return res.status(404).json({
        error: { type: 'NOT_FOUND', message: 'User not found', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
      });
    }

    // Delete from storage (MemStorage uses Map internally)
    if (storage.users && storage.users.delete) {
      storage.users.delete(id);
    }

    res.json({
      message: 'User deleted successfully',
      source: getSource('MemStorage'),
      timestamp: new Date().toISOString(),
      data: user,
    });
  } catch (err) {
    res.status(500).json({ error: { type: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() } });
  }
});

app.post('/users/clear', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(400).json({
      error: { type: 'VALIDATION_ERROR', message: 'Clear operation not allowed in production', timestamp: new Date().toISOString(), requestId: 'req-' + Date.now() },
    });
  }

  try {
    const storage = await getStorage();
    if (storage.users && storage.users.clear) {
      storage.users.clear();
      storage.id = 0;
    }

    res.json({
      message: 'All users cleared successfully',
      source: getSource('MemStorage'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: { type: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() } });
  }
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

// ============ EMAIL UTILITIES (real library) ============
app.post('/utils/email/validate', async (req, res) => {
  const { email } = req.body;
  try {
    const library = await getLib();
    const isValid = library.isValidEmail(email);
    res.json({ email, isValid, source: getSource('isValidEmail'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/email/normalize', async (req, res) => {
  const { email } = req.body;
  try {
    const library = await getLib();
    const normalized = library.normalizeEmail(email);
    res.json({ original: email, normalized, source: getSource('normalizeEmail'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/email/domain', async (req, res) => {
  const { email } = req.body;
  try {
    const library = await getLib();
    const domain = library.getEmailDomain(email);
    res.json({ email, domain, isValid: domain !== null, source: getSource('getEmailDomain'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/email/filter', async (req, res) => {
  const { emails } = req.body;
  try {
    const library = await getLib();
    const validEmails = library.filterValidEmails(emails);
    const invalidEmails = emails.filter(e => !library.isValidEmail(e));
    res.json({ totalInput: emails.length, validCount: validEmails.length, invalidCount: invalidEmails.length, validEmails, invalidEmails, source: getSource('filterValidEmails'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/email/target', async (req, res) => {
  const { name, email } = req.body;
  try {
    const library = await getLib();
    const target = library.createEmailTarget(name, email);
    res.json({ target, name: name || null, email, source: getSource('createEmailTarget'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    return res.status(400).json({ error: 'Parameter n must be an integer', timestamp: new Date().toISOString() });
  }
  if (n < 0) {
    return res.status(400).json({ error: 'Parameter n must be non-negative', timestamp: new Date().toISOString() });
  }
  if (n > 40) {
    return res.status(400).json({ error: 'Parameter n must be <= 40 to prevent timeout', timestamp: new Date().toISOString() });
  }
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

// ============ FAST OPERATIONS (real library) ============
app.post('/utils/fast/math', async (req, res) => {
  const { a, b } = req.body;
  if (typeof a !== 'number' || typeof b !== 'number' || isNaN(a) || isNaN(b)) {
    return res.status(400).json({ error: 'Parameters a and b must be valid numbers', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const FM = library.FastMath;
    res.json({
      operations: {
        add: FM.add(a, b),
        subtract: FM.sub(a, b),
        multiply: FM.mul(a, b),
        divide: b !== 0 ? FM.div(a, b) : 'undefined (division by zero)',
        modulo: b !== 0 ? FM.mod(a, b) : 'undefined (division by zero)',
        power: FM.pow(a, Math.min(b, 10)),
        max: FM.max(a, b),
        min: FM.min(a, b),
        abs_a: FM.abs(a),
        floor_a: FM.floor(a),
        ceil_a: FM.ceil(a),
        sqrt_a: a >= 0 ? FM.sqrt(a) : 'undefined (negative number)',
      },
      source: getSource('FastMath'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fast/string', async (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'Parameter input must be a string', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const FS = library.FastString;
    res.json({
      operations: {
        length: FS.len(input),
        uppercase: FS.upper(input),
        lowercase: FS.lower(input),
        reversed: FS.reverse(input),
        trimmed: FS.trim(input),
        words: input.trim() ? input.trim().split(/\s+/).length : 0,
        chars: input.replace(/\s/g, '').length,
        firstChar: input.length > 0 ? FS.charAt(input, 0) : '',
        lastChar: input.length > 0 ? FS.charAt(input, input.length - 1) : '',
        isPalindrome: FS.lower(input).replace(/\s/g, '') === FS.reverse(FS.lower(input).replace(/\s/g, '')),
      },
      source: getSource('FastString'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fast/hash', async (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'Parameter input must be a string', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const FH = library.FastHash;
    const hash = FH.djb2(input);
    res.json({
      input,
      hash: Math.abs(hash).toString(16),
      hashInt: Math.abs(hash),
      djb2: Math.abs(hash),
      source: getSource('FastHash'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fast/object-pool', async (req, res) => {
  const { poolSize } = req.body;
  try {
    const library = await getLib();
    const pool = new library.ObjectPool(() => ({ id: 0, data: null }), poolSize);
    const acquired = [];
    for (let i = 0; i < Math.min(3, poolSize); i++) {
      const obj = pool.acquire();
      obj.id = i + 1;
      obj.data = `acquired-${i + 1}`;
      acquired.push({ ...obj });
    }
    res.json({
      poolSize,
      availableInPool: poolSize - acquired.length,
      acquired: acquired.length,
      acquiredObjects: acquired,
      source: getSource('ObjectPool'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fast/lock-free-queue', async (req, res) => {
  const { operations } = req.body;
  try {
    const library = await getLib();
    const queue = new library.LockFreeQueue();
    const startTime = process.hrtime.bigint();
    for (let i = 0; i < operations / 2; i++) {
      queue.enqueue(i);
    }
    for (let i = 0; i < operations / 2; i++) {
      queue.dequeue();
    }
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000;
    res.json({
      operations,
      enqueued: operations / 2,
      dequeued: operations / 2,
      finalQueueSize: queue.size(),
      durationMs: durationMs.toFixed(3),
      opsPerSecond: Math.floor(operations / (durationMs / 1000)),
      source: getSource('LockFreeQueue'),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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

// ============ PAGINATION (real library) ============
app.post('/utils/pagination/offset', async (req, res) => {
  const { page, limit, total } = req.body;
  try {
    const library = await getLib();
    const validation = library.validatePagination(page, limit);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error, timestamp: new Date().toISOString() });
    }
    const meta = library.createPaginationMeta(page, limit, total);
    res.json({ pagination: meta, source: getSource('createPaginationMeta'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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

app.post('/utils/pagination/cursor/generate', async (req, res) => {
  const { id, timestamp } = req.body;
  try {
    const library = await getLib();
    const cursor = library.createCursor({ id, timestamp, offset: 0 });
    res.json({ cursor, decoded: { id, timestamp, offset: 0 }, source: getSource('createCursor'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/pagination/sort/validate', async (req, res) => {
  const { field, order } = req.body;
  try {
    const library = await getLib();
    const allowedFields = ['id', 'name', 'createdAt', 'updatedAt', 'username', 'email'];
    const result = library.validateSorting(field, order, allowedFields);
    res.json({ field, order, ...result, allowedFields, allowedOrders: ['asc', 'desc'], source: getSource('validateSorting'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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

app.post('/utils/cache/bounded-queue', async (req, res) => {
  const { maxSize, itemCount } = req.body;
  if (typeof maxSize !== 'number' || maxSize < 1) {
    return res.status(400).json({ error: 'Parameter maxSize must be a positive number', timestamp: new Date().toISOString() });
  }
  const count = typeof itemCount === 'number' ? itemCount : 5;
  try {
    const library = await getLib();
    const queue = new library.BoundedQueue(maxSize);
    const evicted = [];
    for (let i = 0; i < count; i++) {
      const result = queue.enqueue(`item-${i + 1}`);
      if (result && result.evicted) evicted.push(result.evicted);
    }
    res.json({ maxSize, itemsAdded: count, itemsEvicted: evicted.length, evictedItems: evicted, finalQueue: queue.toArray(), source: getSource('BoundedQueue'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/cache/bounded-map', async (req, res) => {
  const { maxSize, entryCount } = req.body;
  if (typeof maxSize !== 'number' || maxSize < 1) {
    return res.status(400).json({ error: 'Parameter maxSize must be a positive number', timestamp: new Date().toISOString() });
  }
  const count = typeof entryCount === 'number' ? entryCount : maxSize + 5;
  try {
    const library = await getLib();
    const map = new library.BoundedMap(maxSize);
    const evicted = [];
    for (let i = 0; i < count; i++) {
      const result = map.set(`key-${i + 1}`, `value-${i + 1}`);
      if (result && result.evicted) evicted.push(result.evicted);
    }
    res.json({ maxSize, entriesAdded: count, entriesEvicted: evicted.length, evictedEntries: evicted, finalMap: Object.fromEntries(map.entries()), source: getSource('BoundedMap'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.get('/utils/cache/metrics', async (req, res) => {
  try {
    const library = await getLib();
    const metrics = library.getCacheMetrics();
    const hitRate = metrics.hits + metrics.misses > 0 
      ? ((metrics.hits / (metrics.hits + metrics.misses)) * 100).toFixed(2) + '%' : '0%';
    res.json({ metrics, hitRate, lruCacheSize: demoState.lruCache.size, source: getSource('getCacheMetrics'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/cache/metrics/reset', async (req, res) => {
  try {
    const library = await getLib();
    library.resetCacheMetrics();
    res.json({ message: 'Cache metrics reset', source: getSource('resetCacheMetrics'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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

// ============ STREAMING (real library) ============
app.post('/utils/streaming/json/parse', async (req, res) => {
  const { input } = req.body;
  if (typeof input !== 'string') {
    return res.status(400).json({ error: 'Parameter input must be a JSON string to parse', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const result = library.safeJsonParse(input);
    if (result.success) {
      res.json({ success: true, parsed: result.data, type: typeof result.data, isArray: Array.isArray(result.data), keys: typeof result.data === 'object' && result.data !== null ? Object.keys(result.data) : [], source: getSource('safeJsonParse'), timestamp: new Date().toISOString() });
    } else {
      res.json({ success: false, error: result.error, input, source: getSource('safeJsonParse'), timestamp: new Date().toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/streaming/json/stringify', async (req, res) => {
  const { input } = req.body;
  if (input === undefined) {
    return res.status(400).json({ error: 'Parameter input is required (object/array to stringify)', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const result = library.safeJsonStringify(input, null, 2);
    if (result.success) {
      res.json({ success: true, stringified: result.data, length: result.data.length, source: getSource('safeJsonStringify'), timestamp: new Date().toISOString() });
    } else {
      res.json({ success: false, error: result.error, source: getSource('safeJsonStringify'), timestamp: new Date().toISOString() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
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
  const { input, text } = req.body;
  const data = input || text;
  if (typeof data !== 'string') {
    return res.status(400).json({ error: 'Parameter input must be a string', timestamp: new Date().toISOString() });
  }
  const lines = data.split('\n');
  
  res.json({
    totalLines: lines.length,
    lines: lines.map((line, index) => ({
      lineNumber: index + 1,
      content: line,
      length: line.length,
      isEmpty: line.trim().length === 0,
    })),
    nonEmptyLines: lines.filter(l => l.trim().length > 0).length,
    totalCharacters: data.length,
    timestamp: new Date().toISOString(),
  });
});

// ============ FIELD UTILITIES (real library) ============
app.post('/utils/fields/normalize', async (req, res) => {
  const { fieldName } = req.body;
  if (typeof fieldName !== 'string') {
    return res.status(400).json({ error: 'Parameter fieldName must be a string', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const normalized = library.normalizeFieldName(fieldName);
    res.json({ original: fieldName, normalized, source: getSource('normalizeFieldName'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/denormalize', async (req, res) => {
  const { fieldName } = req.body;
  if (typeof fieldName !== 'string') {
    return res.status(400).json({ error: 'Parameter fieldName must be a string', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const denormalized = library.denormalizeFieldName(fieldName);
    res.json({ original: fieldName, denormalized, source: getSource('denormalizeFieldName'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/normalize-object', async (req, res) => {
  const { object } = req.body;
  if (!object || typeof object !== 'object') {
    return res.status(400).json({ error: 'Parameter object must be an object', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const normalized = library.normalizeObjectFields(object);
    res.json({ original: object, normalized, source: getSource('normalizeObjectFields'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/denormalize-object', async (req, res) => {
  const { object } = req.body;
  if (!object || typeof object !== 'object') {
    return res.status(400).json({ error: 'Parameter object must be an object', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const denormalized = library.denormalizeObjectFields(object);
    res.json({ original: object, denormalized, source: getSource('denormalizeObjectFields'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/collection-name', async (req, res) => {
  const { modelName } = req.body;
  try {
    const library = await getLib();
    const collectionName = library.getCollectionName(modelName);
    res.json({ modelName, collectionName, source: getSource('getCollectionName'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/mongo-type', async (req, res) => {
  const { typeName } = req.body;
  try {
    const library = await getLib();
    const mongoType = library.getMongoType(typeName);
    res.json({ typeName, mongoType, source: getSource('getMongoType'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.get('/utils/fields/supported-types', async (req, res) => {
  try {
    const library = await getLib();
    const types = library.getSupportedTypes();
    res.json({ types, source: getSource('getSupportedTypes'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/serialize', async (req, res) => {
  const { document } = req.body;
  try {
    const library = await getLib();
    const serialized = library.serializeDocument(document);
    res.json({ original: document, serialized, source: getSource('serializeDocument'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/fields/serialize-without', async (req, res) => {
  const { document, excludeFields } = req.body;
  try {
    const library = await getLib();
    const serialized = library.serializeWithoutFields(document, excludeFields);
    res.json({ original: document, excludeFields, serialized, source: getSource('serializeWithoutFields'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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

// ============ BASIC UTILITIES (real library) ============
app.get('/utils/greet', async (req, res) => {
  const name = req.query.name || 'World';
  try {
    const library = await getLib();
    const greeting = library.greet(name);
    res.json({ greeting, source: getSource('greet'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/math', async (req, res) => {
  const { a, b, operation } = req.body;
  try {
    const library = await getLib();
    let result;
    switch (operation) {
      case 'add': result = library.add(a, b); break;
      case 'subtract': result = a - b; break;
      case 'multiply': result = a * b; break;
      case 'divide': result = b !== 0 ? a / b : 'undefined'; break;
      default: result = library.add(a, b);
    }
    res.json({ a, b, operation, result, source: getSource('add'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.get('/utils/even/:num', async (req, res) => {
  const num = parseInt(req.params.num);
  try {
    const library = await getLib();
    const isEven = library.isEven(num);
    res.json({ number: num, isEven, source: getSource('isEven'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
});

app.post('/utils/dedupe', async (req, res) => {
  const { items, array } = req.body;
  const input = items || array;
  if (!Array.isArray(input)) {
    return res.status(400).json({ error: 'Parameter items must be an array', timestamp: new Date().toISOString() });
  }
  try {
    const library = await getLib();
    const deduped = library.dedupe(input);
    res.json({ original: input, deduped, removed: input.length - deduped.length, source: getSource('dedupe'), timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message, timestamp: new Date().toISOString() });
  }
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
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 QMemory Demo Server running on port ${port}`);
  console.log(`📱 Open http://localhost:${port}/demo.html to test the interface`);
  console.log(`🔧 API endpoints available at http://localhost:${port}`);

  // Create demo user using REAL library storage
  try {
    const storage = await getStorage();
    const existing = await storage.getUserByUsername('demo');
    if (!existing) {
      await storage.createUser({ username: 'demo', displayName: 'Demo User', createdAt: new Date().toISOString() });
      console.log('✅ Created demo user using library.MemStorage');
    } else {
      console.log('ℹ️ Demo user already exists in library.MemStorage');
    }
  } catch (err) {
    console.log('⚠️ Could not create demo user:', err.message);
  }
});
