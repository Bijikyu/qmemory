declare module 'qgenutils' {
  export function sanitizeString(input: string): string;
  export function sanitizeHtml(input: string): string;
  export function sanitizeSqlInput(input: string): string;
  export function sanitizeObjectRecursively(obj: any): any;
  export function isValidString(input: any): boolean;
  export function isValidObject(input: any): boolean;
  export function createPerformanceTimer(): any;
  export function generateUniqueId(): string;
  export function sanitizeResponseMessage(message: string, fallback: string): string;
  export function sanitizeContext(context: any): any;
}

declare module 'qerrors' {
  export const logger: {
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
    logDebug(message: string, meta?: any): void;
    logInfo(message: string, meta?: any): void;
    logWarn(message: string, meta?: any): void;
    logError(message: string, meta?: any): void;
    logFatal(message: string, meta?: any): void;
    logAudit(message: string, meta?: any): void;
  };
  export function createTypedError(message: string, type: any, code?: string): Error;
  export const ErrorTypes: any;
  export const ErrorFactory: any;
  export const ErrorSeverity: any;
  export function createPerformanceTimer(name: string): any;
  export function sanitizeMessage(message: string, fallback: string): string;
  export function sanitizeContext(context: any): any;
  export function addCustomSanitizationPattern(pattern: string, replacement: string): void;
  export function sanitizeWithCustomPatterns(input: string): string;
  export function clearCustomSanitizationPatterns(): void;
  export function handleControllerError(error: any, res: any): void;
  export function withErrorHandling(fn: any): any;
  export function generateUniqueId(): string;
  export function createTimer(): any;
  export function deepClone(obj: any): any;
  export function safeRun(fn: any): any;
  export function verboseLog(message: string, condition: boolean): void;
  export function getEnv(key: string): string | undefined;
  export function getInt(key: string): number | undefined;
  export function getMissingEnvVars(keys: string[]): string[];
  export function throwIfMissingEnvVars(keys: string[]): void;
  export function warnIfMissingEnvVars(keys: string[]): void;
  export const simpleLogger: any;
  export function createSimpleWinstonLogger(options: any): any;
  export const LOG_LEVELS: any;
  export const logDebug: (message: string, meta?: any) => void;
  export const logInfo: (message: string, meta?: any) => void;
  export const logWarn: (message: string, meta?: any) => void;
  export const logError: (message: string, meta?: any) => void;
  export const logFatal: (message: string, meta?: any) => void;
  export const logAudit: (message: string, meta?: any) => void;
}

declare module 'pluralize' {
  export type PluralizeFunction = (word: string, count?: number, inclusive?: boolean) => string;

  export interface PluralizeModule extends PluralizeFunction {
    plural: PluralizeFunction;
    singular: (word: string) => string;
    addPluralRule(rule: RegExp | string, replacement: string): void;
    addSingularRule(rule: RegExp | string, replacement: string): void;
    addIrregularRule(single: string, plural: string): void;
    addUncountableRule(rule: RegExp | string): void;
    isPlural(word: string): boolean;
    isSingular(word: string): boolean;
  }

  const pluralize: PluralizeModule;
  export default pluralize;
}
