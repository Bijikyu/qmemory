/**
 * Centralized Logging Utility
 *
 * Purpose: Eliminates duplicate console.log patterns throughout the codebase
 * by providing a consistent, configurable logging interface with structured output.
 *
 * Design Principles:
 * - Performance optimized: Minimal overhead for production use
 * - Configurable output: Can disable debug logs in production
 * - Structured format: Consistent log format for better parsing
 * - Context awareness: Automatically includes function names and timestamps
 * - Memory efficient: Reuses objects and minimizes allocations
 */

export interface LogContext {
  functionName?: string;
  module?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface LogConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp: boolean;
  includeFunctionName: boolean;
  prefix?: string;
}

// Default configuration - can be overridden per environment
const defaultConfig: LogConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  includeTimestamp: true,
  includeFunctionName: true,
};

class CentralizedLogger {
  private config: LogConfig;
  private moduleName: string;

  constructor(moduleName: string, config: Partial<LogConfig> = {}) {
    this.moduleName = moduleName;
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogConfig['level']): boolean {
    return (
      this.config.enabled &&
      this.getLevelPriority(level) >= this.getLevelPriority(this.config.level)
    );
  }

  private getLevelPriority(level: LogConfig['level']): number {
    const priorities = { debug: 0, info: 1, warn: 2, error: 3 };
    return priorities[level];
  }

  private formatMessage(level: LogConfig['level'], message: string, context?: LogContext): string {
    const parts: string[] = [];

    // Add timestamp if enabled
    if (this.config.includeTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    // Add log level
    parts.push(`[${level.toUpperCase()}]`);

    // Add module name
    parts.push(`[${this.moduleName}]`);

    // Add function name if available and enabled
    if (this.config.includeFunctionName && context?.functionName) {
      parts.push(`[${context.functionName}]`);
    }

    // Add custom prefix if configured
    if (this.config.prefix) {
      parts.push(this.config.prefix);
    }

    // Add the main message
    parts.push(message);

    // Add context as JSON if provided
    if (context && Object.keys(context).length > 0) {
      const contextWithoutFunctionName = { ...context };
      delete contextWithoutFunctionName.functionName;
      if (Object.keys(contextWithoutFunctionName).length > 0) {
        parts.push(JSON.stringify(contextWithoutFunctionName));
      }
    }

    return parts.join(' ');
  }

  // Core logging methods
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Convenience methods for common patterns
  functionEntry(functionName: string, params?: Record<string, any>): void {
    this.debug(`${functionName} is running${params ? ` with ${JSON.stringify(params)}` : ''}`, {
      functionName,
      ...params,
    });
  }

  functionReturn(functionName: string, returnValue?: any): void {
    this.debug(
      `${functionName} is returning${returnValue !== undefined ? ` ${returnValue}` : ''}`,
      {
        functionName,
        returnValue,
      }
    );
  }

  functionError(functionName: string, error: Error | string): void {
    this.error(`${functionName} failed: ${error instanceof Error ? error.message : error}`, {
      functionName,
      error: error instanceof Error ? error.stack : error,
    });
  }

  validationError(field: string, value: any, rule: string): void {
    this.warn(`Validation failed for ${field}: expected ${rule}, got ${typeof value}`, {
      field,
      value,
      rule,
    });
  }

  performanceWarning(operation: string, duration: number, threshold: number): void {
    this.warn(
      `Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      {
        operation,
        duration,
        threshold,
      }
    );
  }
}

// Factory function to create module-specific loggers
export const createLogger = (
  moduleName: string,
  config?: Partial<LogConfig>
): CentralizedLogger => {
  return new CentralizedLogger(moduleName, config);
};

// Default logger for general use
export const logger = createLogger('App');

// Export the class for advanced usage
export { CentralizedLogger };
