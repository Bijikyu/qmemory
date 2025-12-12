/**
 * Direct imports from qgenutils and qerrors
 * 
 * This module replaces the previous qgenutils-wrapper.js with direct imports
 * from qgenutils and qerrors packages to eliminate code duplication.
 */

// Direct imports from qgenutils
const qgenutils = require('qgenutils');

// Direct imports from qerrors
const qerrors = require('qerrors');

// Use qerrors logger as primary (more advanced)
const logger = qerrors.logger;

// Export all utilities
module.exports = {
  // Primary Logger (use qerrors)
  logger,
  
  // qgenutils Security & Sanitization
  sanitizeString: qgenutils.sanitizeString,
  sanitizeHtml: qgenutils.sanitizeHtml,
  sanitizeSqlInput: qgenutils.sanitizeSqlInput,
  sanitizeObjectRecursively: qgenutils.sanitizeObjectRecursively,
  
  // qgenutils Validation
  isValidString: qgenutils.isValidString,
  isValidObject: qgenutils.isValidObject,
  validateInputRate: qgenutils.validateInputRate,
  validateUserInput: qgenutils.validateUserInput,
  validateEmail: qgenutils.validateEmail,
  validateRequired: qgenutils.validateRequired,
  requireFields: qgenutils.requireFields,
  isValidDate: qgenutils.isValidDate,
  hasMethod: qgenutils.hasMethod,
  
  // qgenutils URL Utilities
  ensureProtocol: qgenutils.ensureProtocol,
  normalizeUrlOrigin: qgenutils.normalizeUrlOrigin,
  stripProtocol: qgenutils.stripProtocol,
  parseUrlParts: qgenutils.parseUrlParts,
  
  // qgenutils Environment Utilities
  getEnvVar: qgenutils.getEnvVar,
  hasEnvVar: qgenutils.hasEnvVar,
  requireEnvVars: qgenutils.requireEnvVars,
  
  // qgenutils Response Utilities (these don't exist in qgenutils, need to implement or use qerrors)
  // sendJsonResponse, sendValidationError, sendAuthError, sendServerError, getRequiredHeader
  
  // qgenutils Authentication
  checkPassportAuth: qgenutils.checkPassportAuth,
  hasGithubStrategy: qgenutils.hasGithubStrategy,
  
  // qgenutils DateTime Utilities
  formatDateTime: qgenutils.formatDateTime,
  formatDuration: qgenutils.formatDuration,
  formatFileSize: qgenutils.formatFileSize,
  addDays: qgenutils.addDays,
  formatDate: qgenutils.formatDate,
  formatDateWithPrefix: qgenutils.formatDateWithPrefix,
  
  // qgenutils View Utilities (these don't exist in qgenutils, need to check)
  // renderView, registerViewRoute
  
  // qgenutils Other Utilities
  createBroadcastRegistry: qgenutils.createBroadcastRegistry,
  createWorkerPool: qgenutils.createWorkerPool,
  createShutdownManager: qgenutils.createShutdownManager,
  gracefulShutdown: qgenutils.gracefulShutdown,
  generateExecutionId: qgenutils.generateExecutionId,
  validateGitHubUrl: qgenutils.validateGitHubUrl,
  
  // qerrors Enhanced Logging
  logDebug: qerrors.logDebug,
  logInfo: qerrors.logInfo,
  logWarn: qerrors.logWarn,
  logError: qerrors.logError,
  logFatal: qerrors.logFatal,
  logAudit: qerrors.logAudit,
  
  // qerrors Performance Monitoring
  createPerformanceTimer: qerrors.createPerformanceTimer,
  createEnhancedLogEntry: qerrors.createEnhancedLogEntry,
  
  // qerrors Error Handling
  createTypedError: qerrors.createTypedError,
  createStandardError: qerrors.createStandardError,
  ErrorTypes: qerrors.ErrorTypes,
  ErrorSeverity: qerrors.ErrorSeverity,
  ErrorFactory: qerrors.ErrorFactory,
  handleControllerError: qerrors.handleControllerError,
  withErrorHandling: qerrors.withErrorHandling,
  errorMiddleware: qerrors.errorMiddleware,
  handleSimpleError: qerrors.handleSimpleError,
  logErrorWithSeverity: qerrors.logErrorWithSeverity,
  
  // qerrors Data Security & Sanitization
  sanitizeMessage: qerrors.sanitizeMessage,
  sanitizeContext: qerrors.sanitizeContext,
  addCustomSanitizationPattern: qerrors.addCustomSanitizationPattern,
  sanitizeWithCustomPatterns: qerrors.sanitizeWithCustomPatterns,
  clearCustomSanitizationPatterns: qerrors.clearCustomSanitizationPatterns,
  
  // qerrors Queue Management
  createLimiter: qerrors.createLimiter,
  getQueueLength: qerrors.getQueueLength,
  getQueueRejectCount: qerrors.getQueueRejectCount,
  startQueueMetrics: qerrors.startQueueMetrics,
  stopQueueMetrics: qerrors.stopQueueMetrics,
  
  // qerrors AI Model Management
  getAIModelManager: qerrors.getAIModelManager,
  resetAIModelManager: qerrors.resetAIModelManager,
  MODEL_PROVIDERS: qerrors.MODEL_PROVIDERS,
  createLangChainModel: qerrors.createLangChainModel,
  
  // qerrors Utility Functions
  generateUniqueId: qerrors.generateUniqueId,
  createTimer: qerrors.createTimer,
  deepClone: qerrors.deepClone,
  safeRun: qerrors.safeRun,
  verboseLog: qerrors.verboseLog,
  
  // qerrors Configuration & Environment
  getEnv: qerrors.getEnv,
  getInt: qerrors.getInt,
  getMissingEnvVars: qerrors.getMissingEnvVars,
  throwIfMissingEnvVars: qerrors.throwIfMissingEnvVars,
  warnIfMissingEnvVars: qerrors.warnIfMissingEnvVars,
  
  // qerrors Simple Logger
  simpleLogger: qerrors.simpleLogger,
  createSimpleWinstonLogger: qerrors.createSimpleWinstonLogger,
  LOG_LEVELS: qerrors.LOG_LEVELS,
  
  // Direct access to qgenutils logger (fallback)
  qgenutilsLogger: qgenutils.logger,
  
  // Main qerrors function
  qerrors: qerrors.qerrors,
  

};