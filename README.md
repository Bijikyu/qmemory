
# qmemory

A comprehensive Node.js utility library with full TypeScript support providing MongoDB document operations, HTTP utilities, and in-memory storage for development and testing.

## Requirements

- Node.js 18+
- MongoDB 4.4+ (for production mode)
- Mongoose 8+ (peer dependency)
- TypeScript 4.5+ (for TypeScript projects)

## Installation

```bash
npm install qmemory
```

### TypeScript Setup

Ensure your `tsconfig.json` includes the following for proper ESM support:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

## Features

- **MongoDB Document Operations**: High-level utilities for user-owned document CRUD operations
- **HTTP Utilities**: Express.js response helpers for consistent API responses
- **Database Utilities**: MongoDB connection validation and uniqueness checking
- **In-Memory Storage**: Volatile user storage for development and testing environments
- **Basic Utilities**: Common helper functions for string formatting, math, and validation
- **Logging Utilities**: Centralized logging patterns for function entry, exit, and error tracking

## Usage

### TypeScript Import (Recommended)

```typescript
import {
  // HTTP utilities
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  
  // Database utilities
  ensureMongoDB,
  ensureUnique,
  
  // Document operations
  findUserDoc,
  deleteUserDoc,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc,
  performUserDocOp,
  userDocActionOr404,
  validateDocumentUniqueness,
  hasUniqueFieldChanges,

  // Storage
  MemStorage,
  storage,
  
  // Basic utilities
  greet,
  add,
  isEven,
  
  // Logging utilities
  logFunctionEntry,
  logFunctionExit,
  logFunctionError
} from 'qmemory';
```

### JavaScript Import (CommonJS)

```javascript
const {
  // Same imports as above
  sendNotFound,
  sendConflict,
  // ... other imports
} = require('qmemory');
```

## TypeScript Examples

### Express.js Route with TypeScript

```typescript
import express, { Request, Response } from 'express';
import { 
  ensureMongoDB, 
  fetchUserDocOr404, 
  createUniqueDoc,
  sendInternalServerError,
  logFunctionEntry,
  logFunctionExit,
  logFunctionError
} from 'qmemory';

interface UserRequest extends Request {
  user?: { username: string };
}

const app = express();

// Get user's blog post with comprehensive error handling
app.get('/posts/:id', async (req: Request, res: Response) => {
  logFunctionEntry('getPost', { id: req.params.id, user: (req as UserRequest).user?.username });
  
  try {
    if (!ensureMongoDB(res)) return;
    
    const post = await fetchUserDocOr404(
      BlogPost, 
      req.params.id, 
      (req as UserRequest).user!.username, 
      res, 
      'Blog post not found'
    );
    
    if (post) {
      logFunctionExit('getPost', 'success');
      res.json(post);
    }
  } catch (error) {
    logFunctionError('getPost', error as Error);
    sendInternalServerError(res, 'Failed to retrieve blog post');
  }
});
```

### TypeScript with Storage

```typescript
import { MemStorage, storage } from 'qmemory';

interface User {
  id: number;
  username: string;
  displayName?: string;
}

// Create a typed storage instance
const userStorage = new MemStorage<User>();

// Use the singleton with type safety
const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  return await storage.createUser(userData);
};

// Typed user retrieval
const getUser = async (id: number): Promise<User | undefined> => {
  return await storage.getUser(id);
};
```

### Database Operations with TypeScript

```typescript
import { 
  createCrudService, 
  CrudServiceOptions,
  validateUniqueField 
} from 'qmemory';
import { Model } from 'mongoose';

interface BlogPost {
  title: string;
  content: string;
  author: string;
  createdAt: Date;
}

// Create a typed CRUD service
const options: CrudServiceOptions = {
  uniqueField: 'title',
  searchableFields: ['title', 'content'],
  defaultSort: { createdAt: -1 }
};

const blogService = createCrudService<BlogPost>(
  BlogPostModel,
  'blog post',
  options
);

// Use with full type safety
const createPost = async (postData: Omit<BlogPost, 'id' | 'createdAt'>) => {
  // TypeScript will validate the postData structure
  return await blogService.create(postData);
};
```

## API Reference

### HTTP Utilities

All HTTP utility functions return the Express response object so additional calls
can be chained in your route handlers. Each response includes an ISO `timestamp`
field for easier log correlation, and the utilities throw an error when the
provided response object does not implement `status()` and `json()`.

#### sendNotFound(res, message)
Sends a standardized 404 Not Found response.

- `res` (Express Response): Express response object
- `message` (string): Custom error message
- **Usage**: `sendNotFound(res, 'User not found')`

#### sendConflict(res, message)
Sends a 409 Conflict response for duplicate resource attempts.

- `res` (Express Response): Express response object
- `message` (string): Custom conflict message
- **Usage**: `sendConflict(res, 'Username already exists')`

#### sendInternalServerError(res, message)
Sends a 500 Internal Server Error response with logging.

- `res` (Express Response): Express response object
- `message` (string): Custom error message
- **Usage**: `sendInternalServerError(res, 'Database operation failed')`

#### sendServiceUnavailable(res, message)
Sends a 503 Service Unavailable response for dependency failures.

- `res` (Express Response): Express response object
- `message` (string): Custom unavailable message
- Returns JSON with `retryAfter` set to `'300'` seconds informing clients when to retry
- **Usage**: `sendServiceUnavailable(res, 'Database temporarily offline')`

### Database Utilities

#### ensureMongoDB(res)
Validates MongoDB connection before database operations.

- `res` (Express Response): Express response object for error handling
- **Returns**: `boolean` - true if database is available
- **Side effects**: Sends 503/500 responses when database is unavailable
- **Usage**: Use in Express routes before database operations

```javascript
app.get('/users', (req, res) => {
  if (!ensureMongoDB(res)) return;
  // Proceed with database operations...
});
```

#### ensureUnique(model, query, res, duplicateMsg)
Checks for document uniqueness before creation/updates.

- `model` (Mongoose Model): Model to query against
- `query` (Object): MongoDB query to check for duplicates
- `res` (Express Response): Response object for conflict responses
- `duplicateMsg` (string): Message for duplicate conflicts
- **Returns**: `Promise<boolean>` - true if unique, false if duplicate

### Document Operations

All document operations enforce user ownership and provide consistent error handling.

#### findUserDoc(model, id, username)
Finds a document by ID that belongs to a specific user.

- `model` (Mongoose Model): Model to query
- `id` (string): Document ID
- `username` (string): Username that must own the document
- **Returns**: `Promise<Object|null>` - Document or null if not found

#### deleteUserDoc(model, id, username)
Deletes a user-owned document by ID.

- **Returns**: `Promise<Object|null>` - Deleted document or null if not found

#### fetchUserDocOr404(model, id, user, res, msg)
Fetches a user document or sends 404 response.

- **Returns**: `Promise<Object|undefined>` - Document if found, undefined if 404 sent

#### deleteUserDocOr404(model, id, user, res, msg)
Deletes a user document or sends 404 response.

- **Returns**: `Promise<Object|undefined>` - Deleted document if found, undefined if 404 sent

#### listUserDocs(model, username, sort)
Lists all documents owned by a user with optional sorting.

- `sort` (Object): MongoDB sort object (e.g., `{ createdAt: -1 }`)
- **Returns**: `Promise<Array>` - Array of user documents

#### createUniqueDoc(model, fields, uniqueQuery, res, duplicateMsg)
Creates a new document after verifying uniqueness.

- `fields` (Object): Document field values
- `uniqueQuery` (Object): Query to check for duplicates
- `res` (Express Response): Response object used to send conflicts
- `duplicateMsg` (string): Message when a duplicate record exists
- **Returns**: `Promise<Object|undefined>` - Created document or undefined if duplicate

#### updateUserDoc(model, id, username, fieldsToUpdate, uniqueQuery, res, duplicateMsg)
Updates a user-owned document with optional uniqueness validation.

- `id` (string): Document ID to update
- `username` (string): Username that must own the document
- `fieldsToUpdate` (Object): Fields to update
- `uniqueQuery` (Object): Optional uniqueness constraint query
- `res` (Express Response): Response object used for error handling
- `duplicateMsg` (string): Message for duplicate conflicts
- **Returns**: `Promise<Object|undefined>` - Updated document or undefined if error

#### performUserDocOp(model, id, username, opCallback)
Executes a document operation with standardized error handling.

- `opCallback` (Function): Custom operation function
- **Returns**: `Promise<Object|null>` - Operation result or null on invalid ID

#### userDocActionOr404(model, id, user, res, action, msg)
Runs a document action and sends a 404 response if the result is not found.

- `action` (Function): Document operation to perform
- `msg` (string): 404 message
- **Returns**: `Promise<Object|undefined>` - Result if found, undefined if 404 sent

#### validateDocumentUniqueness(model, uniqueQuery, res, duplicateMsg)
Checks if any document matches the uniqueness query before create/update.

- **Returns**: `Promise<boolean>` - true if unique, false otherwise

#### hasUniqueFieldChanges(doc, fieldsToUpdate, uniqueQuery)
Determines whether unique fields are modified before running validation.

- **Returns**: `boolean` - true if unique fields change

### In-Memory Storage

#### MemStorage Class
Volatile user storage for development and testing environments.

**Important**: Data is lost on application restart. Not suitable for production.

Constructor accepts optional `maxUsers` to limit stored records. The default limit is `10000` users.

```javascript
const { MemStorage } = require('qmemory');
const userStorage = new MemStorage(); // defaults to 10000 users
// Optionally pass a different limit: new MemStorage(5000)
```

#### Storage Methods

##### createUser(insertUser)
Creates a new user with auto-generated ID. Usernames are automatically trimmed of leading and trailing whitespace.
Throws an error if the username already exists, if the value is not a non-empty string,
or when the storage reaches its `maxUsers` limit.

```javascript
const user = await storage.createUser({
  username: 'alice',
  displayName: 'Alice Smith',
  githubId: 'alice123',
  avatar: 'https://example.com/avatar.jpg'
});
// Returns: { id: 1, username: 'alice', displayName: 'Alice Smith', ... }
```

##### getUser(id)
Retrieves user by numeric ID. Returns `undefined` when the ID is invalid or no user exists.

```javascript
const user = await storage.getUser(1);
```

##### getUserByUsername(username)
Retrieves user by username. Returns `undefined` when the username is invalid or no user exists.

```javascript
const user = await storage.getUserByUsername('alice');
```

##### getAllUsers()
Returns all stored users.

```javascript
const allUsers = await storage.getAllUsers();
```

##### deleteUser(id)
Deletes a user by ID. Returns `false` when the ID is invalid or the user was not found.

```javascript
const wasDeleted = await storage.deleteUser(1); // returns boolean
```

##### clear()
Removes all users and resets ID counter.

```javascript
await storage.clear();
```

#### Singleton Storage Instance
A ready-to-use storage instance is exported for application-wide use:

```javascript
const { storage } = require('qmemory');

// Use immediately without instantiation
const user = await storage.createUser({ username: 'bob' });
```

### Basic Utilities

#### greet(name)
Creates a greeting message with the provided name.

```javascript
const message = greet('Alice'); // Returns: "Hello, Alice!"
```

#### add(a, b)
Adds two numbers together with type validation.

```javascript
const sum = add(5, 3); // Returns: 8
const floatSum = add(2.5, 1.7); // Returns: 4.2
```

#### isEven(num)
Checks if an integer is even.

```javascript
const result = isEven(4); // Returns: true
const odd = isEven(7); // Returns: false
```

### Logging Utilities

Environment-aware logging functions for consistent debugging and monitoring.

#### logFunctionEntry(functionName, params)
Logs function entry with parameters (development mode only).

```javascript
logFunctionEntry('createUser', { username: 'alice', displayName: 'Alice Smith' });
// Output: [DEBUG] createUser started with username: alice, displayName: Alice Smith
```

#### logFunctionExit(functionName, result)
Logs function completion with result (development mode only).

```javascript
logFunctionExit('createUser', user);
// Output: [DEBUG] createUser completed with result: { id: 1, username: 'alice', ... }
```

#### logFunctionError(functionName, error)
Logs function errors with context (all environments).

```javascript
logFunctionError('createUser', new Error('Database connection failed'));
// Output: [ERROR] createUser failed: { message: 'Database connection failed', stack: '...', ... }
```

## Example: Express Route with Document Operations

```javascript
const express = require('express');
const { 
  ensureMongoDB, 
  fetchUserDocOr404, 
  createUniqueDoc,
  sendInternalServerError,
  logFunctionEntry,
  logFunctionExit,
  logFunctionError
} = require('qmemory');
const BlogPost = require('./models/BlogPost'); // Your Mongoose model

const app = express();

// Get user's blog post with comprehensive error handling
app.get('/posts/:id', async (req, res) => {
  logFunctionEntry('getPost', { id: req.params.id, user: req.user?.username });
  
  try {
    if (!ensureMongoDB(res)) return;
    
    const post = await fetchUserDocOr404(
      BlogPost, 
      req.params.id, 
      req.user.username, 
      res, 
      'Blog post not found'
    );
    
    if (post) {
      logFunctionExit('getPost', 'success');
      res.json(post);
    }
  } catch (error) {
    logFunctionError('getPost', error);
    sendInternalServerError(res, 'Failed to retrieve blog post');
  }
});

// Create new blog post with uniqueness validation
app.post('/posts', async (req, res) => {
  logFunctionEntry('createPost', { title: req.body.title, user: req.user?.username });
  
  try {
    if (!ensureMongoDB(res)) return;
    
    const post = await createUniqueDoc(
      BlogPost,
      { ...req.body, user: req.user.username },
      { title: req.body.title, user: req.user.username },
      res,
      'A post with this title already exists'
    );
    
    if (post) {
      logFunctionExit('createPost', 'created');
      res.status(201).json(post);
    }
  } catch (error) {
    logFunctionError('createPost', error);
    sendInternalServerError(res, 'Failed to create blog post');
  }
});
```

## Demo Application

For a working example of the library, run the included demo server:

```bash
NODE_ENV=development node demo-app.js
```

The server uses `PORT` if set; otherwise it starts on `5000` and exposes basic user management routes for exploration.

## Performance Considerations

- **Document Operations**: Use MongoDB indexes on `_id` and `user` fields for optimal performance
- **MemStorage**: O(1) lookup by ID, O(n) lookup by username
- **Uniqueness Checks**: Include indexed fields in uniqueness queries
- **Logging**: Development-only logs reduce production overhead

## Development vs Production

- **MemStorage**: Perfect for development and testing, but data is volatile
- **Document Operations**: Production-ready with proper error handling and security
- **Database Utilities**: Include connection resilience for cloud deployments
- **Logging**: Automatically disabled in production environments for performance
- **Error Handling**: Comprehensive error responses with appropriate HTTP status codes

## Testing

The library includes a comprehensive test suite with 12 suites and 202 tests covering:

- Unit tests for all modules (8 test files)
- Integration tests for workflows (3 test files)
- Production validation scenarios (19 production tests)
- Edge case testing with 96.37% statement coverage
- Error scenario validation and recovery testing
- Performance testing for bulk operations and concurrent access
- Memory management and cleanup validation

**Coverage Metrics**:
- Statement Coverage: 96.37%
- Branch Coverage: 98.87%
- Function Coverage: 100%
- Line Coverage: 96.35%

Run tests:
```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:coverage   # Run with coverage report
npm run test:watch      # Watch mode for development
```

## Production Deployment

The library is production-ready with comprehensive deployment support:

### Docker Deployment
```bash
# Using provided Docker configuration
docker-compose up -d
```

### Environment Configuration
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
PORT=3000
```

### Required MongoDB Indexes
```javascript
// Essential for production performance
await collection.createIndex({ "user": 1, "createdAt": -1 }); // index by user to optimize creation date lookups
await collection.createIndex({ "user": 1, "title": 1 }, { unique: true }); // enforce unique titles per user
await collection.createIndex({ "user": 1, "updatedAt": -1 }); // index by last update per user
```

### Health Monitoring
```javascript
app.get('/health', (req, res) => {
  if (ensureMongoDB(res)) {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }
});
```

## Dependencies

- `mongoose`: Required for MongoDB operations
- `@types/node`: TypeScript definitions
- `qtests`: Testing utilities used by this library

### Development Dependencies
- `jest`: Testing framework
- `express`: Web framework for integration tests
- `supertest`: HTTP assertions for Express

## License

ISC
