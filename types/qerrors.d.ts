// Type declarations for qerrors package
declare module 'qerrors' {
  export interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug?(message: string, meta?: any): void;
    logDebug?(message: string, meta?: any): void;
  }

  export const logger: Logger;

  // Error handling functions
  export function createTypedError(type: string, message: string, context?: any): Error;
  export function sanitizeMessage(message: string): string;
  export function sanitizeContext(context: any): any;
  export function generateUniqueId(): string;

  // Error types
  export const ErrorTypes: Record<string, string>;
  export const ErrorFactory: any;

  // Main error function
  export function qerrors(error: Error, context?: string, additionalContext?: any): void;
}
