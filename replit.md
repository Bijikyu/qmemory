# qmemory Library

## Overview

This is a comprehensive Node.js utility library that provides MongoDB document operations, HTTP utilities, and in-memory storage solutions. The library is designed with a "security by default" philosophy, implementing user ownership enforcement at the database query level to prevent unauthorized access to documents.

## System Architecture

### Dual-Mode Architecture
The system operates in two modes:
- **Development Mode**: Uses in-memory storage for rapid prototyping and testing
- **Production Mode**: Connects to MongoDB for persistent data storage

### Modular Design
The library follows a barrel export pattern with functionality organized into specialized modules:
- `lib/http-utils.js` - Express.js HTTP response helpers
- `lib/database-utils.js` - MongoDB connection validation and utilities
- `lib/document-ops.js` - High-level document CRUD operations with user ownership
- `lib/storage.js` - In-memory storage implementation for user data
- `lib/binary-storage.js` - Binary data storage interface and implementations
- `lib/object-storage-binary.js` - Cloud-based binary storage with Replit Object Storage
- `lib/utils.js` - Basic utility functions
- `lib/logging-utils.js` - Centralized logging patterns
- `lib/pagination-utils.js` - Pagination parameter validation and response formatting
- `lib/performance-utils.js` - Performance monitoring and metrics collection utilities
- `lib/cache-utils.js` - Redis-based caching with environment-aware behavior

## Key Components

### HTTP Utilities
Provides standardized HTTP response helpers for Express.js applications:
- `sendNotFound` - 404 responses with consistent formatting
- `sendConflict` - 409 responses for duplicate resources
- `sendInternalServerError` - 500 responses with error logging
- `sendServiceUnavailable` - 503 responses for database connectivity issues

### Pagination Utilities
Comprehensive pagination system supporting both traditional and advanced use cases:

**Offset-Based Pagination** (Traditional):
- `validatePagination` - Validates query parameters and returns pagination config or sends error response
- `createPaginationMeta` - Generates navigation metadata for paginated API responses
- `createPaginatedResponse` - Creates complete paginated response with data and metadata

**Cursor-Based Pagination** (High Performance):
- `validateCursorPagination` - Validates cursor-based pagination parameters for large datasets
- `createCursor` - Generates encoded cursors for navigation positioning with tamper resistance
- `createCursorPaginationMeta` - Creates cursor pagination metadata for API responses
- `createCursorPaginatedResponse` - Creates complete cursor-based paginated response

**Advanced Sorting & Security**:
- `validateSorting` - Validates and extracts sorting parameters with field allowlist security

### Performance Monitoring Utilities
Comprehensive performance tracking and metrics collection across all application layers:
- `DatabaseMetrics` - Database query performance tracking with slow query detection and statistical analysis
- `RequestMetrics` - HTTP endpoint performance monitoring with response time analysis and error tracking
- `SystemMetrics` - System resource utilization tracking with memory and CPU monitoring
- `PerformanceMonitor` - Unified performance monitoring orchestration with automated alerting and health checks

### Cache Utilities
Redis-based caching system with intelligent environment awareness:
- `withCache` - Main caching function that wraps expensive operations with TTL management
- `initializeRedisClient` - Redis connection setup for production environments with graceful fallback
- `disconnectRedis` - Graceful Redis connection cleanup and resource management
- `invalidateCache` - Cache invalidation for fresh data requirements with pattern-based clearing
- `getCacheStats` - Cache monitoring and health check utilities for performance insights

### Binary Storage Utilities
Comprehensive binary data storage interface with multiple implementation strategies:
- `IStorage` - Universal interface for binary data operations (save, get, delete, exists)
- `MemoryBinaryStorage` - High-performance in-memory storage for development and caching
- `FileSystemBinaryStorage` - Local file system persistence with atomic operations
- `ObjectStorageBinaryStorage` - Cloud storage integration with Replit Object Storage
- `StorageFactory` - Configurable factory for creating storage instances based on environment
- `getDefaultStorage` - Singleton default storage instance for immediate use

### Database Operations
All document operations enforce user ownership constraints automatically:
- `createUniqueDoc` - Creates documents with uniqueness validation
- `fetchUserDocOr404` - Retrieves user-owned documents with 404 handling
- `updateUserDoc` - Updates documents with ownership verification
- `deleteUserDocOr404` - Deletes user-owned documents
- `listUserDocs` - Lists documents filtered by user ownership

### Enhanced Database Utilities
Advanced database operation helpers for production reliability:
- `handleMongoError` - Centralized MongoDB error handling with structured classification
- `safeDbOperation` - Safe operation wrapper with consistent error handling and performance timing
- `retryDbOperation` - Sophisticated retry logic with exponential backoff for recoverable errors
- `ensureIdempotency` - Idempotency checking for critical operations (payments, webhooks)
- `optimizeQuery` - Query optimization helper with lean queries, field selection, and index hints
- `createAggregationPipeline` - Aggregation pipeline builder for analytics and reporting

### Generic Document Helpers
MongoDB CRUD operations without user ownership constraints:
- `findDocumentById` - Safe document retrieval by ID with graceful error handling
- `updateDocumentById` - Safe document update by ID with new document return
- `deleteDocumentById` - Safe document deletion by ID with boolean return pattern
- `cascadeDeleteDocument` - Cascading deletion with cleanup operations for related data
- `createDocument` - Safe document creation with validation error propagation
- `findDocuments` - Safe document query with find condition and optional sorting
- `findOneDocument` - Safe single document query with consistent undefined return
- `bulkUpdateDocuments` - Bulk document updates with individual error handling

### Storage Solutions
- **MemStorage Class**: In-memory storage with Map-based data structure
- **Singleton Instance**: Application-wide shared storage (`storage`)
- **User Management**: CRUD operations for user data with automatic ID assignment

### Security Features
- User ownership enforcement at query level prevents security bypasses
- MongoDB ObjectId validation with graceful error handling
- Sanitized error responses to prevent information leakage
- Input validation and type checking throughout

## Data Flow

1. **Request Validation**: HTTP utilities validate Express response objects
2. **Database Connectivity**: Connection state checked before operations
3. **User Ownership**: All document queries automatically include user constraints
4. **Error Handling**: Consistent error responses with internal logging
5. **Response Formatting**: Standardized JSON responses with timestamps

## External Dependencies

### Production Dependencies
- **mongoose**: ^8.15.1 - MongoDB object modeling
- **@types/node**: ^22.15.31 - TypeScript definitions
- **qtests**: ^1.0.4 - Testing utilities
- **redis**: ^4.6.0 - Redis client for production caching

### Development Dependencies
- **jest**: ^29.7.0 - Testing framework
- **express**: ^4.18.2 - Web framework for demo app
- **supertest**: ^6.3.4 - HTTP assertions for testing

### Runtime Requirements
- Node.js 18+ or 20+
- MongoDB 4.4+ (for production)

## Deployment Strategy

### NPM Package
The library is published as `qmemory` version 1.0.1 and can be installed via npm for integration into existing applications.

### Docker Support
Includes Docker configuration with:
- Multi-stage builds for optimized images
- Non-root user execution for security
- Health checks for container monitoring
- MongoDB integration via docker-compose

### Environment Configuration
- `NODE_ENV`: Controls logging behavior and feature flags
- `MONGODB_URI`: Database connection string for production
- `PORT`: Application listening port

### Production Considerations
- MongoDB indexes required for optimal performance
- User ownership indexes on collections
- Proper error logging and monitoring
- Database connection pooling and health checks

## Changelog

Changelog:
- June 17, 2025. Initial setup
- June 17, 2025. Added pagination utilities with comprehensive validation, metadata generation, and response formatting
- June 17, 2025. Added performance monitoring utilities with database tracking, HTTP monitoring, system metrics, and automated alerting
- June 17, 2025. Enhanced pagination with cursor-based navigation, advanced sorting, and security validation (46 tests passing, 88% coverage)
- June 17, 2025. Enhanced performance monitoring with singleton pattern for immediate application-wide monitoring (41 tests passing, 97.6% coverage)
- June 17, 2025. Enhanced database utilities with comprehensive MongoDB error handling, safe operation wrappers, retry logic, idempotency patterns, query optimization, and aggregation pipeline builders (25 tests passing, 90.5% coverage)
- June 17, 2025. Added generic document helpers for MongoDB CRUD operations with cascading deletion, bulk updates, and consistent error handling (24 tests passing, 79.8% coverage)
- January 22, 2025. Added comprehensive Redis-based caching utilities with environment-aware behavior, graceful fallback patterns, and production/development mode adaptation (cache bypass in dev, Redis persistence in production)
- January 22, 2025. Added comprehensive binary storage interface with multiple implementations: in-memory storage for development, file system storage for local persistence, and cloud storage integration with Replit Object Storage. Includes unified IStorage interface, storage factory pattern, comprehensive validation, and performance optimization (45 tests passing, excellent performance metrics: 0.13ms per write, 0.02ms per read)
- September 25, 2025. Added LRU cache functionality with performance monitoring integration. Includes createCache function for size-limited in-memory caching with TTL support, comprehensive cache hit/miss tracking, and performance monitoring functions (incCacheHit, incCacheMiss, setCacheKeys, getCacheMetrics, resetCacheMetrics). All functionality tested and integrated with existing performance monitoring system (6 tests passing, 86.95% coverage for LRU cache, 74.07% coverage for perf monitoring)
- September 25, 2025. Added field name normalization and collection utilities. Includes normalizeFieldName for converting camelCase/PascalCase to snake_case, getCollectionName for deriving pluralized collection names, and supporting functions for bidirectional conversion and object processing (normalizeObjectFields, denormalizeObjectFields). All functionality tested with comprehensive validation (19 tests passing, 100% coverage)

## User Preferences

Preferred communication style: Simple, everyday language.