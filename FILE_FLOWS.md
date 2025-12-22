# FILE_FLOWS.md

## Overview

This document describes the data flow, file organization, and module relationships in the qmemory Node.js utility library. The library provides MongoDB document operations, HTTP utilities, in-memory storage, and various helper functions with a focus on security by default through user ownership enforcement.

## Entry Points

### Primary Entry Point
- **`index.ts`** - Main module exports all library utilities through a centralized barrel export pattern
  - Exports 200+ functions and classes from lib/ modules
  - Provides single import point for consumers
  - No direct implementation - pure aggregation module

### Application Entry Point
- **`demo-app.ts`** - Express.js demonstration application
  - Shows practical library usage patterns
  - Implements complete REST API for user management
  - Demonstrates error handling and pagination

### Configuration Files
- **`package.json`** - Dependencies, scripts, and metadata
  - Main script: `qtests-runner.mjs` for testing
  - Key dependencies: mongoose, express, redis, @google-cloud/storage
  - Development tooling: jest, typescript, various analyzers

- **`jest.config.js`** - Test configuration and coverage thresholds
- **`qtests-runner.mjs`** - Custom test runner with batching and debug reporting

## Core Library Structure (lib/)

### Data Flow Categories

#### 1. HTTP Layer & API Utilities
**Primary Flow**: HTTP Request → Response Processing → Client Response

- **`http-utils.js`** - Express.js response helpers and validation
  - Functions: `sendNotFound()`, `sendConflict()`, `sendInternalServerError()`, `sendServiceUnavailable()`
  - Validation: `validateResponseObject()`, `sanitizeMessage()`
  - Error response formatting with request IDs and timestamps
  - **Dependencies**: `qgenutils-wrapper.js`

- **`pagination-utils.js`** - Request/response pagination handling
  - Validation: `validatePagination()`, `validateCursorPagination()`, `validateSorting()`
  - Response creation: `createPaginatedResponse()`, `createCursorPaginatedResponse()`
  - Meta generation: `createPaginationMeta()`, `createCursorPaginationMeta()`

#### 2. Database Layer & Document Operations
**Primary Flow**: Business Logic → Database Query → Data Processing → Response

- **`database-utils.js`** - MongoDB connection and operation wrappers
  - Connection validation: `ensureMongoDB()`
  - Uniqueness checking: `ensureUnique()`
  - Error handling: `handleMongoError()`, `safeDbOperation()`, `retryDbOperation()`
  - Query optimization: `optimizeQuery()`, `createAggregationPipeline()`
  - **Dependencies**: `http-utils.js`, `logging-utils.js`

- **`document-helpers.js`** - Generic MongoDB CRUD operations
  - Basic CRUD: `findDocumentById()`, `updateDocumentById()`, `deleteDocumentById()`, `createDocument()`
  - Advanced: `cascadeDeleteDocument()`, `bulkUpdateDocuments()`, `findDocuments()`, `findOneDocument()`
  - **Dependencies**: `database-utils.js`, `logging-utils.js`

- **`document-ops.js`** - User-owned document operations (SECURITY LAYER)
  - User-scoped operations: `findUserDoc()`, `deleteUserDoc()`, `updateUserDoc()`, `listUserDocs()`
  - HTTP integration: `fetchUserDocOr404()`, `deleteUserDocOr404()`, `userDocActionOr404()`
  - Uniqueness: `createUniqueDoc()`, `validateDocumentUniqueness()`, `hasUniqueFieldChanges()`
  - **Dependencies**: `http-utils.js`, `database-utils.js`, `logging-utils.js`

- **`mongoose-mapper.js`** - Schema generation and type mapping
  - Type utilities: `getMongoType()`, `getSupportedTypes()`, `isSupportedType()`
  - Schema generation: `mapParameterToMongoType()`, `generateMongooseSchema()`, `generateMongoSchema()`
  - **Dependencies**: `typeMap.js`

#### 3. Storage & Caching Layer
**Primary Flow**: Data Request → Cache Check → Storage Operation → Cache Update

- **`storage.js`** - In-memory user storage for development/testing
  - Class: `MemStorage` - user management with configurable capacity
  - Operations: `getUser()`, `createUser()`, `updateUser()`, `deleteUser()`
  - Field normalization: `normalizeUserFields()`

- **`cache-utils.js`** - Redis integration for distributed caching
  - Client management: `createRedisClient()`, singleton `redis`
  - Cache operations: get, set, delete with TTL support

- **`lru-cache.js`** - Local memory-based LRU cache implementation
  - Class-based cache with size limits and expiration

- **`binary-storage.js`** - File and binary data storage
  - Classes: `IStorage`, `MemoryBinaryStorage`, `FileSystemBinaryStorage`
  - Factory pattern: `StorageFactory`, `getDefaultStorage()`

- **`server/objectStorage.ts`** - Google Cloud Storage integration
  - Production binary storage with Replit-sidecar authentication
  - Error handling: `ObjectNotFoundError`

#### 4. Performance & Monitoring Layer
**Primary Flow**: Operation Start → Metric Collection → Operation End → Metric Aggregation

- **`performance-utils.js`** - Comprehensive performance monitoring
  - Classes: `DatabaseMetrics`, `RequestMetrics`, `SystemMetrics`, `PerformanceMonitor`
  - Singleton: `performanceMonitor` for application-wide monitoring
  - Real-time metrics collection and reporting

- **`health-check.js`** - Application health monitoring
  - Health checks: `checkMemoryHealth()`, `checkCpuHealth()`, `checkFilesystemHealth()`, `runCustomCheck()`
  - Middleware: `healthCheckMiddleware()`, `readinessCheckMiddleware()`, `livenessCheckMiddleware()`
  - Route setup: `setupHealthRoutes()`
  - Status aggregation: `determineOverallStatus()`, `getHealthStatus()`

- **`test-memory-manager.js`** - Memory leak detection and testing
  - Class: `TestMemoryManager` for memory tracking during tests
  - Functions: `createMemoryManager()`, `quickMemoryCheck()`, `withMemoryTracking()`

#### 5. Reliability & Resilience Layer
**Primary Flow**: Operation Request → Circuit Check → Operation Execution → Circuit Update

- **`circuit-breaker.js`** - Individual circuit breaker implementation
  - Class: `CircuitBreaker` with state management and failure thresholds
  - Factory: `createCircuitBreaker()`

- **`circuit-breaker-factory.js`** - Managed circuit breaker ecosystem
  - Factory: `CircuitBreakerFactory` for managing multiple breakers
  - Management: `getManagedCircuitBreaker()`, `getCircuitBreakerStats()`
  - Lifecycle: `clearAllCircuitBreakers()`, `shutdownCircuitBreakerFactory()`

- **`async-queue.js`** - Asynchronous task queue management
  - Classes: `AsyncQueue` for concurrent operation control
  - Factory: `createQueue()` with configurable concurrency

- **`database-pool.js`** - Database connection pooling
  - Classes: `SimpleDatabasePool`, `DatabaseConnectionPool`
  - Management: `createDatabasePool()`, `acquireDatabaseConnection()`, `releaseDatabaseConnection()`

#### 6. Utility & Helper Layer
**Primary Flow**: Function Call → Data Processing → Return Value

- **`utils.js`** - Basic utility functions
  - Functions: `greet()`, `add()`, `isEven()`, `dedupe()`, `dedupeByFirst()`, etc.

- **`email-utils.js`** - Email validation and processing
  - Validation: `isValidEmail()`, `normalizeEmail()`, `getEmailDomain()`
  - Processing: `getEmails()`, `createEmailTarget()`, `filterValidEmails()`

- **`field-utils.js`** - Field name normalization and mapping
  - Normalization: `normalizeFieldName()`, `denormalizeFieldName()`
  - Collection mapping: `getCollectionName()`
  - Object processing: `normalizeObjectFields()`, `denormalizeObjectFields()`

- **`logging-utils.js`** - Centralized logging patterns
  - Functions: `logFunctionEntry()`, `logFunctionExit()`, `logFunctionError()`
  - **Dependencies**: `qgenutils-wrapper.js`

- **`serialization-utils.js`** - Document serialization and mapping
  - Functions: `serializeDocument()`, `serializeMongooseDocument()`, `mapAndSerialize()`
  - Safe operations: `safeSerializeDocument()`, `safeMapAndSerialize()`

#### 7. Advanced Operations Layer
**Primary Flow**: Complex Request → Multi-step Processing → Consolidated Result

- **`crud-service-factory.js`** - High-level CRUD service creation
  - Factories: `createCrudService()`, `createPaginatedService()`, `createValidatedService()`
  - Utilities: `findByFieldIgnoreCase()`, `validateData()`

- **`unique-validator.js`** - Field uniqueness validation
  - Validation: `validateUniqueField()`, `validateUniqueFields()`, `checkDuplicateByField()`
  - Error handling: `handleDuplicateKeyError()`, `isDuplicateError()`
  - Middleware: `createUniqueFieldMiddleware()`, `createUniqueFieldsMiddleware()`

- **`fast-operations.js`** - High-performance operations
  - Classes: `FastMath`, `FastString`, `LockFreeQueue`, `ObjectPool`, `FastTimer`, `FastMemory`, `FastHash`
  - Utilities: `FastOps`, `Cast`, `Prop`

- **`bounded-collections.ts`** - Memory-safe bounded data structures with LRU semantics
  - Classes: `BoundedQueue<T>` (circular buffer with overflow), `BoundedMap<K,V>` (LRU cache map)
  - Features: Fixed capacity, automatic eviction, iterator support, power-of-2 optimization for queue

- **`streaming-json.js`** - Safe JSON processing
  - Functions: `safeJsonStringify()`, `safeJsonParse()`
  - Enhanced JSON object with error handling

## Test Structure

### Test Organization
**Primary Flow**: Test Suite → Test Case → Assertion → Result

#### Unit Tests (`test/unit/`)
- Module-specific tests for each lib/ component
- Focus on individual function behavior and edge cases
- Files: `http-utils.test.js`, `database-utils.test.js`, `document-helpers.test.js`, etc.

#### Integration Tests (`test/integration/`)
- Cross-module functionality testing
- Workflow validation: `workflows.test.js`
- Demo application testing: `demo-app.test.js`
- Module integration: `module.test.js`

#### Production Tests (`test/production/`)
- Real-world scenario validation
- Performance and reliability testing: `production-validation.test.js`

#### Test Utilities (`test/test-utils.js`)
- Shared testing helpers and fixtures
- Mock implementations and test data

### Generated Tests
Multiple `.GeneratedTest.test.ts` files exist in lib/ directory:
- Auto-generated test files for comprehensive coverage
- Parallel test execution support

## Data Flow Patterns

### 1. HTTP Request Processing
```
Client Request → Express Route → HTTP Utils Validation → 
Database Utils (connection check) → Document Ops (user ownership) → 
Document Helpers (CRUD) → MongoDB → Response Processing → Client Response
```

### 2. User Document Operations
```
User Action → Authentication → User Ownership Validation → 
Document Operation → Error Handling → Response Formatting
```

### 3. Error Handling Flow
```
Operation Error → Error Classification → Logging → 
HTTP Response Generation → Client Notification
```

### 4. Performance Monitoring
```
Operation Start → Metric Collection Start → 
Operation Execution → Metric Collection End → 
Performance Analysis → Health Status Update
```

## Key Dependencies

### Internal Dependencies
- **`qgenutils-wrapper.js`** - Core utility wrapper for logging, validation, and error handling
- **`typeMap.js`** - MongoDB type mapping utilities
- **`perf.js`** - Performance metrics collection (cache hit/miss tracking)

### External Dependencies
- **mongoose** - MongoDB ODM for all database operations
- **express** - Web framework (demo app and HTTP utilities)
- **redis** - Distributed caching and session storage
- **@google-cloud/storage** - Binary object storage for production
- **opossum** - Circuit breaker implementation
- **qerrors** - Enhanced error handling and classification

## Configuration Impact

### Environment Variables
- **NODE_ENV** - Determines behavior (development vs production)
- MongoDB connection strings affect `database-utils.js` behavior
- Redis configuration affects caching layer functionality

### Test Configuration
- Jest configuration affects all test execution
- Coverage thresholds enforce testing standards
- Custom runner provides enhanced debugging capabilities

## Security Patterns

### User Ownership Enforcement
- All document operations in `document-ops.js` include user validation
- Database queries automatically filter by user context
- Prevents cross-user data access at the query level

### Error Message Sanitization
- HTTP utilities sanitize error messages before client delivery
- Internal details logged but not exposed to clients
- Consistent error response format across all endpoints

## Performance Considerations

### Connection Pooling
- Database connections managed through `database-pool.js`
- Circuit breakers prevent cascade failures
- Async queues control concurrent operations

### Caching Strategy
- Multi-layer caching: local LRU + distributed Redis
- Performance metrics collection on all operations
- Memory leak detection for long-running processes

## Development vs Production Behavior

### Development Mode
- Enhanced logging and debugging information
- In-memory storage for rapid prototyping
- Relaxed security restrictions for testing

### Production Mode
- Strict security enforcement
- Performance monitoring and health checks
- External storage integration (Redis, Google Cloud Storage)
- Circuit breaker protection and error recovery

This FILE_FLOWS.md provides LLM agents with the comprehensive understanding needed to navigate the codebase architecture, understand data flow patterns, and make informed decisions about where and how to implement changes.
