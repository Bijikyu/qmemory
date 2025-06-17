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
- `lib/storage.js` - In-memory storage implementation
- `lib/utils.js` - Basic utility functions
- `lib/logging-utils.js` - Centralized logging patterns
- `lib/pagination-utils.js` - Pagination parameter validation and response formatting
- `lib/performance-utils.js` - Performance monitoring and metrics collection utilities

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

## User Preferences

Preferred communication style: Simple, everyday language.