/**
 * Common Pattern Utilities
 *
 * Purpose: Eliminates the most frequently duplicated code patterns across the codebase.
 * These utilities address the top 4 most duplicated patterns identified in the wet-code analysis:
 * 1. Error logging with qerrors.qerrors (100+ occurrences)
 * 2. Function entry/return/debug logging (96+ occurrences)
 * 3. Console debug logging pattern (100+ occurrences)
 * 4. Try-catch with qerrors pattern (60+ occurrences)
 *
 * Design Principles:
 * - Consistent error handling and logging across all modules
 * - Minimal performance overhead
 * - Type safety with TypeScript
 * - Environment-aware behavior (development vs production)
 */

import qerrors from 'qerrors';
import { createLogger, type LogContext } from './core/centralized-logger';

// Module-specific error logger factory
export const createErrorLogger =
  (module: string) => (error: Error, functionName: string, context?: Record<string, unknown>) => {
    qerrors.qerrors(error, `${module}.${functionName}`, context);
  };

// Function-specific logger factory
export const createFunctionLogger = (module: string) => (functionName: string) => {
  const logger = createLogger(module);
  return {
    entry: (params?: Record<string, unknown>) => logger.functionEntry(functionName, params),
    return: (result?: unknown) => logger.functionReturn(functionName, result),
    error: (error: Error) => logger.functionError(functionName, error),
    debug: (message: string, context?: LogContext) =>
      logger.debug(`${functionName}: ${message}`, context),
  };
};

// Simplified debug logging utility
export const debugLog = (module: string, message: string, data?: unknown): void => {
  if (process.env.NODE_ENV === 'development') {
    const prefix = `${module}:`;
    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }
};

// Safe operation wrapper with consistent error handling and logging
export const safeOperation = async <T>(
  operation: () => Promise<T>,
  functionName: string,
  module: string,
  context?: Record<string, unknown>
): Promise<T> => {
  const funcLogger = createFunctionLogger(module)(functionName);
  const errorLogger = createErrorLogger(module);

  funcLogger.entry(context);

  try {
    const result = await operation();
    funcLogger.return(result);
    return result;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    errorLogger(errorObj, functionName, context);
    funcLogger.error(errorObj);
    throw errorObj;
  }
};

// Synchronous version of safeOperation
export const safeOperationSync = <T>(
  operation: () => T,
  functionName: string,
  module: string,
  context?: Record<string, unknown>
): T => {
  const funcLogger = createFunctionLogger(module)(functionName);
  const errorLogger = createErrorLogger(module);

  funcLogger.entry(context);

  try {
    const result = operation();
    funcLogger.return(result);
    return result;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    errorLogger(errorObj, functionName, context);
    funcLogger.error(errorObj);
    throw errorObj;
  }
};

// Combined utility factory for common usage patterns
export const createModuleUtilities = (module: string) => {
  const logError = createErrorLogger(module);
  const getFunctionLogger = createFunctionLogger(module);

  return {
    logError,
    getFunctionLogger,
    debugLog: (message: string, data?: unknown) => debugLog(module, message, data),
    safeAsync: <T>(
      operation: () => Promise<T>,
      functionName: string,
      context?: Record<string, unknown>
    ) => safeOperation(operation, functionName, module, context),
    safeSync: <T>(operation: () => T, functionName: string, context?: Record<string, unknown>) =>
      safeOperationSync(operation, functionName, module, context),
    validateResponse: (res: any, functionName: string) => validateResponse(res, functionName),
  };
};

// Parameter validation utilities
export const validateRequiredModel = (model: any, functionName: string): void => {
  if (!model) {
    throw new Error('Model is required');
  }
};

export const validateRequiredParams = (params: Record<string, any>, functionName: string): void => {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      throw new Error(`${key} is required for ${functionName}`);
    }
  });
};

export const validateResponse = (res: any, functionName: string): void => {
  if (!res || typeof res.status !== 'function') {
    throw new Error('Valid response object is required');
  }
};

export const validateObject = (obj: any, paramName: string = 'object'): void => {
  if (!obj || typeof obj !== 'object') {
    throw new Error(`${paramName} must be a valid object`);
  }
};

export const validateObjectOrNull = (obj: any, paramName: string = 'object'): void => {
  if (obj !== null && (obj === undefined || typeof obj !== 'object')) {
    throw new Error(`${paramName} must be an object or null`);
  }
};

interface ParseIntegerResult {
  isValid: boolean;
  value: number | null;
  error: string | null;
}

export const parseIntegerParam = (paramValue: unknown, paramName: string): ParseIntegerResult => {
  if (paramValue === null || paramValue === undefined) {
    return {
      isValid: false,
      value: null,
      error: `${paramName} must be a positive integer starting from 1`,
    };
  }

  const paramStr = String(paramValue).trim();
  const paramNum = parseInt(paramStr, 10);

  // Check if input is a valid integer string (no decimals, no non-numeric chars)
  if (isNaN(paramNum) || paramStr.length === 0 || !/^\d+$/.test(paramStr)) {
    return {
      isValid: false,
      value: null,
      error: `${paramName} must be a positive integer starting from 1`,
    };
  }

  // Check if the parsed number is positive (>= 1) and within safe integer range
  if (paramNum < 1 || paramNum > Number.MAX_SAFE_INTEGER) {
    return {
      isValid: false,
      value: null,
      error: `${paramName} must be a positive integer starting from 1`,
    };
  }

  return {
    isValid: true,
    value: paramNum,
    error: null,
  };
};

// Timer utilities to consolidate duplicate timing patterns
export const createTimer = (label?: string): (() => number) => {
  const start = Date.now();
  return () => Date.now() - start;
};

export const createPerformanceTimer = (
  label: string,
  module: string = 'common-patterns'
): ((success?: boolean) => void) => {
  const start = Date.now();
  return (success = true) => {
    const duration = Date.now() - start;
    debugLog(`Performance: ${label} took ${duration}ms`, JSON.stringify({ success, duration }));
  };
};

export const measureFunctionPerformance = <T>(
  operation: () => T,
  label: string,
  module: string = 'common-patterns'
): T => {
  const timer = createTimer(label);
  try {
    const result = operation();
    const duration = timer();
    debugLog(`Function ${label} completed in ${duration}ms`, JSON.stringify({ module, duration }));
    return result;
  } catch (error) {
    const duration = timer();
    debugLog(
      `Function ${label} failed in ${duration}ms`,
      JSON.stringify({ module, duration, error })
    );
    throw error;
  }
};

// Array/Object manipulation utilities
export const objectEntries = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T
): [K, T[K]][] => {
  return Object.entries(obj) as [K, T[K]][];
};

export const objectKeys = <T extends Record<string, unknown>>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

export const objectValues = <T extends Record<string, unknown>>(obj: T): T[keyof T][] => {
  return Object.values(obj) as T[keyof T][];
};

export const objectFromEntries = <K extends string | number | symbol, V>(
  entries: [K, V][]
): Record<string | number | symbol, V> => {
  return Object.fromEntries(entries);
};

export const arrayMap = <T, U>(array: T[], mapper: (item: T, index: number) => U): U[] => {
  return array.map(mapper);
};

export const arrayFilter = <T>(array: T[], predicate: (item: T, index: number) => boolean): T[] => {
  return array.filter(predicate);
};

export const arrayReduce = <T, U>(
  array: T[],
  reducer: (accumulator: U, item: T, index: number) => U,
  initialValue: U
): U => {
  return array.reduce(reducer, initialValue);
};

// Timestamp utility to eliminate new Date().toISOString() duplication
export const getTimestamp = (): string => new Date().toISOString();

// Object validation utility to eliminate typeof object checks duplication
export const isValidPlainObject = (value: any): boolean =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Export types for external usage
export type ModuleUtilities = ReturnType<typeof createModuleUtilities>;
export type FunctionLogger = ReturnType<typeof createFunctionLogger>;
export type ErrorLogger = ReturnType<typeof createErrorLogger>;
