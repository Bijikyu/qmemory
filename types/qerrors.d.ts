// Type declarations for qerrors package
declare module 'qerrors' {
  export interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug?(message: string, meta?: any): void;
    logDebug?(message: string, meta?: any): void;
  }

  // Error handling functions
  export function createTypedError(type: string, message: string, context?: any): Error;
  export function sanitizeMessage(message: string): string;
  export function sanitizeContext(context: any): any;
  export function generateUniqueId(): string;

  // Error types
  export const ErrorTypes: Record<string, string>;
  export const ErrorFactory: any;

  // Main error function - fixed to match actual usage
  export function qerrors(error: Error, context?: string, additionalContext?: any): void;
}

  // Main qerrors function - matches actual signature from lib/qerrors.js
  export function qerrors(
    error: Error,
    context?: string,
    req?: any,
    res?: any,
    next?: any
  ): Promise<void>;

  // Other exports available on the module
  export const logger: Logger;
  export const errorTypes: any;
  export const ErrorTypes: Record<string, string>;
  export const ErrorSeverity: Record<string, string>;
  export const ErrorFactory: any;
  export function createTypedError(type: string, message: string, context?: any): Error;
  export function sanitizeMessage(message: string): string;
  export function sanitizeContext(context: any): any;
  export function generateUniqueId(): string;
}
