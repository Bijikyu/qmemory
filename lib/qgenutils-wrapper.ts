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
export const sanitizeSqlInput = qgenutils.sanitizeSqlInput;
export const sanitizeObjectRecursively = qgenutils.sanitizeObjectRecursively;

// qgenutils Validation
export const isValidString = qgenutils.isValidString;
export const isValidObject = qgenutils.isValidObject;

// qgenutils Performance
export const createPerformanceTimer = qgenutils.createPerformanceTimer;

// qgenutils ID Generation - Use qerrors version to avoid conflicts
// export const generateUniqueId = qgenutils.generateUniqueId;

// qerrors Error Handling
export const createTypedError = qerrors.createTypedError;
export const ErrorTypes = qerrors.ErrorTypes;
export const ErrorFactory = qerrors.ErrorFactory;

  // qerrors Message Sanitization (missing from exports)
  export const sanitizeResponseMessage = qerrors.sanitizeMessage;
  export const sanitizeContext = qerrors.sanitizeContext;
  
  // Export generateUniqueId from qerrors to avoid conflicts
  export { generateUniqueId } from 'qerrors';