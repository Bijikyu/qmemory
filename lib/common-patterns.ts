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
  };
};

// Export types for external usage
export type ModuleUtilities = ReturnType<typeof createModuleUtilities>;
export type FunctionLogger = ReturnType<typeof createFunctionLogger>;
export type ErrorLogger = ReturnType<typeof createErrorLogger>;
