/**
 * Centralized Error Utility
 *
 * Purpose: Eliminates duplicate error throwing patterns throughout the codebase
 * by providing consistent error creation with proper type safety and context.
 *
 * Design Principles:
 * - Type safety: All errors include proper TypeScript types
 * - Consistency: Standardized error messages and formats
 * - Context awareness: Errors include relevant context for debugging
 * - Performance: Minimal overhead for error creation
 * - Extensibility: Easy to add new error types
 */

export interface ErrorContext {
  field?: string;
  value?: any;
  expectedType?: string;
  actualType?: string;
  functionName?: string;
  module?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export class ValidationError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number = 400;

  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class AuthenticationError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number = 401;

  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
  }
}

export class NotFoundError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number = 404;

  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'NotFoundError';
    this.code = code;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

export class ConflictError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number = 409;

  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConflictError);
    }
  }
}

export class InternalError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number = 500;

  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'InternalError';
    this.code = code;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InternalError);
    }
  }
}

export class ServiceUnavailableError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly statusCode: number = 503;

  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(message);
    this.name = 'ServiceUnavailableError';
    this.code = code;
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceUnavailableError);
    }
  }
}

// Error factory for creating standardized errors
export class ErrorFactory {
  // Validation errors
  static requiredField(field: string, context?: Partial<ErrorContext>): ValidationError {
    return new ValidationError(`${field} is required`, 'REQUIRED_FIELD', { field, ...context });
  }

  static invalidType(
    field: string,
    expectedType: string,
    actualType: string,
    value?: any,
    context?: Partial<ErrorContext>
  ): ValidationError {
    return new ValidationError(`${field} must be a ${expectedType}`, 'INVALID_TYPE', {
      field,
      expectedType,
      actualType,
      value,
      ...context,
    });
  }

  static invalidValue(
    field: string,
    reason: string,
    value?: any,
    context?: Partial<ErrorContext>
  ): ValidationError {
    return new ValidationError(`${field} is invalid: ${reason}`, 'INVALID_VALUE', {
      field,
      value,
      reason,
      ...context,
    });
  }

  static invalidRange(
    field: string,
    min: number,
    max: number,
    value: number,
    context?: Partial<ErrorContext>
  ): ValidationError {
    return new ValidationError(`${field} must be between ${min} and ${max}`, 'INVALID_RANGE', {
      field,
      min,
      max,
      value,
      ...context,
    });
  }

  static invalidLength(
    field: string,
    minLength: number,
    maxLength: number,
    actualLength: number,
    context?: Partial<ErrorContext>
  ): ValidationError {
    return new ValidationError(
      `${field} must be between ${minLength} and ${maxLength} characters`,
      'INVALID_LENGTH',
      { field, minLength, maxLength, actualLength, ...context }
    );
  }

  static invalidFormat(
    field: string,
    format: string,
    value?: any,
    context?: Partial<ErrorContext>
  ): ValidationError {
    return new ValidationError(`${field} must be in ${format} format`, 'INVALID_FORMAT', {
      field,
      format,
      value,
      ...context,
    });
  }

  // Authentication errors
  static authenticationRequired(
    message?: string,
    context?: Partial<ErrorContext>
  ): AuthenticationError {
    return new AuthenticationError(
      message || 'Authentication required',
      'AUTHENTICATION_REQUIRED',
      context
    );
  }

  static invalidCredentials(
    message?: string,
    context?: Partial<ErrorContext>
  ): AuthenticationError {
    return new AuthenticationError(
      message || 'Invalid credentials',
      'INVALID_CREDENTIALS',
      context
    );
  }

  // Not found errors
  static notFound(
    resource: string,
    identifier?: string,
    context?: Partial<ErrorContext>
  ): NotFoundError {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    return new NotFoundError(message, 'NOT_FOUND', { resource, identifier, ...context });
  }

  // Conflict errors
  static conflict(
    resource: string,
    reason: string,
    context?: Partial<ErrorContext>
  ): ConflictError {
    return new ConflictError(`${resource} conflict: ${reason}`, 'CONFLICT', {
      resource,
      reason,
      ...context,
    });
  }

  static duplicateResource(
    resource: string,
    identifier: string,
    context?: Partial<ErrorContext>
  ): ConflictError {
    return new ConflictError(
      `${resource} with identifier '${identifier}' already exists`,
      'DUPLICATE_RESOURCE',
      { resource, identifier, ...context }
    );
  }

  // Internal errors
  static internalError(message: string, context?: Partial<ErrorContext>): InternalError {
    return new InternalError(message, 'INTERNAL_ERROR', context);
  }

  static databaseError(
    operation: string,
    originalError: Error,
    context?: Partial<ErrorContext>
  ): InternalError {
    return new InternalError(
      `Database operation '${operation}' failed: ${originalError.message}`,
      'DATABASE_ERROR',
      { operation, originalError: originalError.message, ...context }
    );
  }

  // Service unavailable errors
  static serviceUnavailable(
    service: string,
    reason?: string,
    context?: Partial<ErrorContext>
  ): ServiceUnavailableError {
    const message = reason
      ? `${service} service unavailable: ${reason}`
      : `${service} service temporarily unavailable`;
    return new ServiceUnavailableError(message, 'SERVICE_UNAVAILABLE', {
      service,
      reason,
      ...context,
    });
  }

  static circuitBreakerOpen(
    service: string,
    context?: Partial<ErrorContext>
  ): ServiceUnavailableError {
    return new ServiceUnavailableError(
      `${service} circuit breaker is open - temporarily rejecting requests`,
      'CIRCUIT_BREAKER_OPEN',
      { service, ...context }
    );
  }
}

// Convenience functions for common error patterns
export const assert = {
  required: (value: any, field: string, context?: Partial<ErrorContext>): void => {
    if (value === undefined || value === null || value === '') {
      throw ErrorFactory.requiredField(field, context);
    }
  },

  type: (
    value: any,
    expectedType: string,
    field: string,
    context?: Partial<ErrorContext>
  ): void => {
    const actualType = typeof value;
    if (actualType !== expectedType) {
      throw ErrorFactory.invalidType(field, expectedType, actualType, value, context);
    }
  },

  string: (value: any, field: string, context?: Partial<ErrorContext>): void => {
    if (typeof value !== 'string') {
      throw ErrorFactory.invalidType(field, 'string', typeof value, value, context);
    }
  },

  number: (value: any, field: string, context?: Partial<ErrorContext>): void => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw ErrorFactory.invalidType(field, 'number', typeof value, value, context);
    }
  },

  integer: (value: any, field: string, context?: Partial<ErrorContext>): void => {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      throw ErrorFactory.invalidType(field, 'integer', typeof value, value, context);
    }
  },

  array: (value: any, field: string, context?: Partial<ErrorContext>): void => {
    if (!Array.isArray(value)) {
      throw ErrorFactory.invalidType(field, 'array', typeof value, value, context);
    }
  },

  object: (value: any, field: string, context?: Partial<ErrorContext>): void => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw ErrorFactory.invalidType(field, 'object', typeof value, value, context);
    }
  },

  range: (
    value: number,
    field: string,
    min: number,
    max: number,
    context?: Partial<ErrorContext>
  ): void => {
    if (typeof value !== 'number' || value < min || value > max) {
      throw ErrorFactory.invalidRange(field, min, max, value, context);
    }
  },

  minLength: (
    value: string,
    field: string,
    minLength: number,
    context?: Partial<ErrorContext>
  ): void => {
    if (typeof value !== 'string' || value.length < minLength) {
      throw ErrorFactory.invalidLength(
        field,
        minLength,
        Number.MAX_SAFE_INTEGER,
        value?.length || 0,
        context
      );
    }
  },

  maxLength: (
    value: string,
    field: string,
    maxLength: number,
    context?: Partial<ErrorContext>
  ): void => {
    if (typeof value !== 'string' || value.length > maxLength) {
      throw ErrorFactory.invalidLength(field, 0, maxLength, value?.length || 0, context);
    }
  },

  positive: (value: number, field: string, context?: Partial<ErrorContext>): void => {
    if (typeof value !== 'number' || value <= 0) {
      throw ErrorFactory.invalidValue(field, 'must be positive', value, context);
    }
  },

  nonNegative: (value: number, field: string, context?: Partial<ErrorContext>): void => {
    if (typeof value !== 'number' || value < 0) {
      throw ErrorFactory.invalidValue(field, 'must be non-negative', value, context);
    }
  },
};

// Export all error types for use in type guards
export type StandardError =
  | ValidationError
  | AuthenticationError
  | NotFoundError
  | ConflictError
  | InternalError
  | ServiceUnavailableError;
