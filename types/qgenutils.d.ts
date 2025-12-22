// Type declarations for qgenutils package
declare module 'qgenutils' {
  import { Server } from 'http';

  export interface Logger {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    debug?(message: string, meta?: any): void;
    logDebug?(message: string, meta?: any): void;
  }

  export const logger: Logger;

  // DateTime utilities
  export function formatDateTime(date: Date, locale?: string): string;
  export function formatDuration(ms: number): string;
  export function addDays(date: Date, days: number): Date;
  export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string;
  export function formatDateWithPrefix(date: Date, prefix: string): string;

  // URL utilities
  export function ensureProtocol(url: string, protocol?: string): string;
  export function normalizeUrlOrigin(url: string): string;
  export function stripProtocol(url: string): string;
  export function parseUrlParts(url: string): { host: string; path: string } | null;

  // Validation utilities
  export function requireFields(obj: any, fields: string[]): void;
  export function isValidObject(obj: any): boolean;
  export function isValidString(str: any): boolean;
  export function isValidDate(date: any): boolean;
  export function hasMethod(obj: any, methodName: string): boolean;

  // Authentication utilities
  export function checkPassportAuth(req: any): boolean;
  export function hasGithubStrategy(): boolean;

  // Environment utilities
  export function requireEnvVars(vars: string[]): void;
  export function hasEnvVar(name: string): boolean;
  export function getEnvVar(name: string, defaultValue?: string): string;

  // Real-time communication utilities
  export function createBroadcastRegistry(): any;

  // ID generation utilities
  export function generateExecutionId(): string;

  // String sanitization utilities
  export function sanitizeString(str: string): string;

  // Advanced security utilities
  export function sanitizeHtml(html: string): string;
  export function sanitizeSqlInput(input: string): string;
  export function validateInputRate(
    identifier: string,
    windowMs?: number,
    maxRequests?: number
  ): boolean;
  export function sanitizeObjectRecursively(obj: any): any;
  export function validateUserInput(
    input: string,
    options?: { maxLength?: number; allowEmpty?: boolean }
  ): boolean;

  // GitHub validation utilities
  export function validateGitHubUrl(url: string): boolean;

  // Advanced validation utilities
  export function validateEmail(email: string): boolean;
  export function validateRequired(value: any, fieldName?: string): boolean;

  // File utilities
  export function formatFileSize(bytes: number): string;

  // Worker pool utilities
  export function createWorkerPool(options?: any): any;

  // Shutdown utilities
  export function createShutdownManager(): any;
  export function gracefulShutdown(
    server: Server,
    cleanup?: () => Promise<void> | void,
    timeout?: number
  ): void;

  // Performance utilities
  export function createPerformanceTimer(): {
    start: () => void;
    end: () => number;
    getElapsed: () => number;
  };
}
