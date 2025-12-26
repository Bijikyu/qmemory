/**
 * Simple wrapper for common utilities to avoid ESM/CommonJS issues
 */

// Basic logger implementation to avoid qerrors import issues
export const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
  debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
  logDebug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
  logFatal: (message: string, meta?: any) => console.error(`[FATAL] ${message}`, meta || ''),
  logAudit: (message: string, meta?: any) => console.log(`[AUDIT] ${message}`, meta || ''),
};

// Basic sanitization functions
export const sanitizeString = (input: string): string => {
  return typeof input === 'string' ? input.trim().replace(/[<>]/g, '') : '';
};

export const sanitizeMessage = (message: string): string => {
  return sanitizeString(message);
};

export const sanitizeContext = (context: any): any => {
  if (!context || typeof context !== 'object') return context;
  // Remove sensitive fields
  const sanitized = { ...context };
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
};

// Basic validation functions
export const isValidString = (input: any): boolean => {
  return typeof input === 'string' && input.trim().length > 0;
};

export const isValidObject = (input: any): boolean => {
  return input && typeof input === 'object' && !Array.isArray(input);
};

// Performance timer
export const createPerformanceTimer = () => {
  const start = Date.now();
  return {
    end: () => Date.now() - start,
    getElapsed: () => Date.now() - start,
  };
};

// Environment utilities
export const getEnvVar = (name: string, defaultValue?: string): string => {
  return process.env[name] || defaultValue || '';
};

export const requireEnvVars = (names: string[]): void => {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Unique ID generator
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

// Basic error types
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// Error factory
export const ErrorFactory = {
  createTypedError: (type: string, message: string, context?: any): Error => {
    const error = new Error(message) as any;
    error.type = type;
    error.context = context;
    return error;
  },
};

export const createTypedError = ErrorFactory.createTypedError;
