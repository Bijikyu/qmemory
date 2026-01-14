/**
 * Shared Result Types
 * Consolidates common result type definitions for file and stream operations
 * Complements existing database/validation types in the codebase
 */

import { ErrorContext } from '../core/error-handler-types';

// File read/write result types
export type SafeReadResult = { success: true; content: string } | { success: false; error: Error };
export type SafeWriteResult = { success: true; written: boolean } | { success: false; error: Error };
export type SafeReadSimpleResult = string | null;

// Sync operation aliases for backward compatibility
export type SafeReadSyncResult = SafeReadResult;
export type SafeWriteSyncResult = SafeWriteResult;

// Generic operation result with tracking ID
export interface OperationResult<T = unknown> {
  success: true;
  data: T;
  operationId: string;
}

export interface OperationError {
  success: false;
  error: Error;
  operationId: string;
}

export type SafeOperation<T = unknown> = OperationResult<T> | OperationError;

// File processing result types
export interface FileProcessingResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  filePath?: string;
}

export interface BatchProcessingResult<T = unknown> {
  success: boolean;
  results: T[];
  errors: Array<{ filePath: string; error: Error }>;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

// Path validation result
export interface PathValidationResult {
  isValid: boolean;
  resolvedPath?: string;
  error?: string;
}

// Extended error context with file-specific information
export interface FileErrorContext extends ErrorContext {
  filePath?: string;
  operationId?: string;
  errorMessage?: string;
}

// File metadata result
export interface FileMetadataResult {
  success: boolean;
  metadata?: {
    size: number;
    mtime: Date;
    exists: boolean;
    [key: string]: unknown;
  };
  error?: Error;
}

// Configuration loading result
export interface ConfigurationResult<T = unknown> {
  success: boolean;
  config?: T;
  error?: Error;
  defaults?: T;
}

// Stream processing result
export interface StreamResult<T = unknown> {
  success: boolean;
  data?: T[];
  chunks?: number;
  bytesProcessed?: number;
  error?: Error;
}

// Type guards for result discrimination
export const isSuccessResult = <T>(result: SafeOperation<T>): result is OperationResult<T> =>
  result.success === true;

export const isErrorResult = <T>(result: SafeOperation<T>): result is OperationError =>
  result.success === false;

export const isSuccessRead = (result: SafeReadResult): result is { success: true; content: string } =>
  result.success === true;

export const isSuccessWrite = (result: SafeWriteResult): result is { success: true; written: boolean } =>
  result.success === true;
