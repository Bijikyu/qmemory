/**
 * Core Logger Utility
 * Centralized logging infrastructure to eliminate duplicate logger implementations
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  requestId?: string;
  userId?: string;
  operation?: string;
}

export class UnifiedLogger {
  private static instance: UnifiedLogger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  static getInstance(): UnifiedLogger {
    if (!UnifiedLogger.instance) {
      UnifiedLogger.instance = new UnifiedLogger();
    }
    return UnifiedLogger.instance;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
      operation: context?.operation as string,
      requestId: context?.requestId as string,
      userId: context?.userId as string,
    };
  }

  private log(entry: LogEntry): void {
    const logString = `${entry.timestamp.toISOString()} [${entry.level}] ${entry.message}`;

    // Include structured data in development
    if (this.isDevelopment) {
      console.log(logString, {
        context: entry.context,
        error: entry.error,
        ...entry.context,
      });
    } else {
      console.log(logString);
    }
  }

  logDebug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.log(entry);
  }

  logInfo(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.log(entry);
  }

  logWarn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.log(entry);
  }

  logError(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.log(entry);
  }

  logAudit(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.AUDIT, message, context);
    this.log(entry);
  }

  /**
   * Create operation-specific logger with pre-filled context
   */
  createOperationLogger(operation: string, requestId?: string, userId?: string) {
    return {
      debug: (message: string, additionalContext?: LogContext) =>
        this.logDebug(message, { ...additionalContext, operation, requestId, userId }),
      info: (message: string, additionalContext?: LogContext) =>
        this.logInfo(message, { ...additionalContext, operation, requestId, userId }),
      warn: (message: string, additionalContext?: LogContext) =>
        this.logWarn(message, { ...additionalContext, operation, requestId, userId }),
      error: (message: string, error?: Error, additionalContext?: LogContext) =>
        this.logError(message, error, { ...additionalContext, operation, requestId, userId }),
      audit: (message: string, additionalContext?: LogContext) =>
        this.logAudit(message, { ...additionalContext, operation, requestId, userId }),
    };
  }
}
