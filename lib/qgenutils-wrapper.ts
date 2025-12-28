/**
 * Direct imports from qgenutils and qerrors
 *
 * This module replaces the previous qgenutils-wrapper.js with direct imports
 * from qgenutils and qerrors packages to eliminate code duplication.
 */
// Direct imports from qgenutils
import * as qgenutils from 'qgenutils';
// Direct imports from qerrors
import * as qerrors from 'qerrors';
// Use qerrors logger as primary (more advanced)
export const logger = qerrors.logger;
// qgenutils Security & Sanitization
export const sanitizeString = qgenutils.sanitizeString;
export const sanitizeHtml = qgenutils.sanitizeHtml;
export const sanitizeSqlInput = (qgenutils as any).sanitizeSqlInput;
export const sanitizeObjectRecursively = (qgenutils as any).sanitizeObjectRecursively;
// qgenutils Validation
export const isValidString = (qgenutils as any).isValidString;
export const isValidObject = (qgenutils as any).isValidObject;
// qgenutils Performance
export const createPerformanceTimer = (qgenutils as any).createPerformanceTimer;
// qgenutils Environment Variables
export const getEnvVar = (qgenutils as any).getEnvVar;
export const requireEnvVars = (qgenutils as any).requireEnvVars;
// qgenutils Graceful Shutdown
export const gracefulShutdown = (qgenutils as any).gracefulShutdown;
// qgenutils ID Generation - Use qerrors version to avoid conflicts
// export const generateUniqueId = qgenutils.generateUniqueId;
// qerrors Error Handling
export const createTypedError = (qerrors as any).createTypedError;
export const ErrorTypes = (qerrors as any).ErrorTypes;
export const ErrorFactory = (qerrors as any).ErrorFactory;
// qerrors Message Sanitization (missing from exports)
export const sanitizeResponseMessage = (qerrors as any).sanitizeMessage;
export const sanitizeContext = qerrors.sanitizeContext;
// Export generateUniqueId from qerrors to avoid conflicts
export const generateUniqueId = qerrors.generateUniqueId;
