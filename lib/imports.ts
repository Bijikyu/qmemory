/**
 * Common Import Barrels
 *
 * Purpose: Reduce import statement duplication across the codebase.
 * Addresses the "Import Pattern Duplication" (100+ occurrences) identified in wet-code analysis.
 *
 * Design Principles:
 * - Centralized common imports
 * - Type-safe re-exports
 * - Easy access to frequently used modules
 */

// MongoDB and Mongoose
export {
  mongoose,
  Model,
  HydratedDocument,
  FilterQuery,
  UpdateQuery,
  Document,
  Types,
} from 'mongoose';

// Express.js types
export type { Request, Response, NextFunction, RequestHandler } from 'express';

// Internal utilities
export { createModuleUtilities } from './common-patterns';
export type { ModuleUtilities, FunctionLogger, ErrorLogger } from './common-patterns';

export { createDatabaseOperations, createMockModel } from './database-operation-factory';
export type {
  DatabaseOperations,
  MockModel,
  DbOperationResult,
  UserOwnedDocument,
} from './database-operation-factory';

export { createResponseFactory } from './http-response-factory';
export type { ResponseFactory, ErrorResponse, SuccessResponse } from './http-response-factory';

// Error handling
export { default as qerrors } from 'qerrors';

// Logging
export { createLogger, type LogContext } from './core/centralized-logger';

// Common types
export type {
  // Database document types
  UserDocument,
  // HTTP types
  ApiRequest,
  ApiResponse,
  // Utility types
  AsyncFunction,
  SyncFunction,
} from './types';

// Environment and configuration
export const ENVIRONMENT = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

// Development helpers
export const DEV = ENVIRONMENT.NODE_ENV === 'development';
export const PROD = ENVIRONMENT.NODE_ENV === 'production';
export const TEST = ENVIRONMENT.NODE_ENV === 'test';
