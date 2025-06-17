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

## Key Components

### HTTP Utilities
Provides standardized HTTP response helpers for Express.js applications:
- `sendNotFound` - 404 responses with consistent formatting
- `sendConflict` - 409 responses for duplicate resources
- `sendInternalServerError` - 500 responses with error logging
- `sendServiceUnavailable` - 503 responses for database connectivity issues

### Database Operations
All document operations enforce user ownership constraints automatically:
- `createUniqueDoc` - Creates documents with uniqueness validation
- `fetchUserDocOr404` - Retrieves user-owned documents with 404 handling
- `updateUserDoc` - Updates documents with ownership verification
- `deleteUserDocOr404` - Deletes user-owned documents
- `listUserDocs` - Lists documents filtered by user ownership

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

## User Preferences

Preferred communication style: Simple, everyday language.