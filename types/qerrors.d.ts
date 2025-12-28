// Type declarations for qerrors package
declare module 'qerrors' {
  // Main qerrors function - matches actual signature from lib/qerrors.js
  function qerrors(error: Error, context?: string, req?: any, res?: any, next?: any): Promise<void>;

  // Interface for the exported object
  interface QerrorsExports {
    qerrors: typeof qerrors;
    logger: {
      info(message: string, meta?: any): void;
      warn(message: string, meta?: any): void;
      error(message: string, meta?: any): void;
      debug?(message: string, meta?: any): void;
      logDebug?(message: string, meta?: any): void;
    };
    errorTypes: any;
    logErrorWithSeverity: (error: Error, severity: string) => void;
    handleControllerError: (error: Error, req: any, res: any, next?: any) => void;
    withErrorHandling: (fn: Function) => Function;
    createTypedError: (type: string, message: string, context?: any) => Error;
    createStandardError: (type: string, message: string, context?: any) => Error;
    ErrorTypes: Record<string, string>;
    ErrorSeverity: Record<string, string>;
    ErrorFactory: any;
    errorMiddleware: (req: any, res: any, next: any) => void;
    handleSimpleError: (error: Error, context: string) => void;
    logDebug: (message: string, meta?: any) => void;
    logInfo: (message: string, meta?: any) => void;
    logWarn: (message: string, meta?: any) => void;
    logError: (message: string, meta?: any) => void;
    logFatal: (message: string, meta?: any) => void;
    logAudit: (message: string, meta?: any) => void;
    createPerformanceTimer: () => () => number;
    createEnhancedLogEntry: (message: string, level: string, meta?: any) => any;
    LOG_LEVELS: Record<string, number>;
    simpleLogger: {
      info(message: string, meta?: any): void;
      warn(message: string, meta?: any): void;
      error(message: string, meta?: any): void;
      debug?(message: string, meta?: any): void;
      logDebug?(message: string, meta?: any): void;
    };
    createSimpleWinstonLogger: (options?: any) => any;
    sanitizeMessage: (message: string) => string;
    sanitizeContext: (context: any) => any;
    addCustomSanitizationPattern: (pattern: RegExp, replacement: string) => void;
    clearCustomSanitizationPatterns: () => void;
    sanitizeWithCustomPatterns: (input: string) => string;
    createLimiter: (max: number) => (fn: Function) => Promise<any>;
    getQueueLength: () => number;
    getQueueRejectCount: () => number;
    startQueueMetrics: () => void;
    stopQueueMetrics: () => void;
    generateUniqueId: () => string;
    createTimer: () => () => number;
    deepClone: (obj: any) => any;
    safeRun: (fn: Function) => any;
    verboseLog: (message: string, data?: any) => void;
    getEnv: (key: string) => string | undefined;
    getInt: (key: string) => number | undefined;
    getMissingEnvVars: (keys: string[]) => string[];
    throwIfMissingEnvVars: (keys: string[]) => void;
    warnIfMissingEnvVars: (keys: string[]) => void;
    getAIModelManager: () => any;
    resetAIModelManager: () => void;
    MODEL_PROVIDERS: Record<string, any>;
    createLangChainModel: (provider: string, options?: any) => any;
    postWithRetry: any;
    clearAdviceCache: () => void;
    purgeExpiredAdvice: () => void;
    startAdviceCleanup: () => void;
    stopAdviceCleanup: () => void;
    getAdviceCacheLimit: () => number;
  }

  // Export the object with all properties
  const qerrorsExports: QerrorsExports;
  export = qerrorsExports;
}
