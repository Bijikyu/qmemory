/**
 * Enhanced qgenutils-wrapper - Simplified Implementation
 * 
 * This module provides enhanced functionality while avoiding complex dependency chains
 * that cause Jest configuration issues. It implements the key features we need
 * from qgenutils and qerrors with direct, focused implementations.
 * 
 * Design rationale:
 * - Avoid complex dependency chains that break tests
 * - Implement key qgenutils and qerrors features directly
 * - Maintain backward compatibility for existing imports
 * - Provide enhanced logging and security features
 */

// Simple null logger fallback for resilience
const nullLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  createTimer: () => ({ end: () => {} }),
  logWithContext: () => {}
};

// Try to import qgenutils but fall back gracefully
let qgenutils = null;
try {
  qgenutils = require('qgenutils');
} catch (error) {
  console.warn('qgenutils not available, using fallback implementations');
}

// Try to import qerrors but fall back gracefully
let qerrors = null;
try {
  qerrors = require('qerrors');
} catch (error) {
  console.warn('qerrors not available, using fallback implementations');
}

// Enhanced logger that works with or without qerrors
const enhancedLogger = qerrors ? {
  debug: (message, context) => {
    try {
      qerrors.logDebug && qerrors.logDebug(message, context);
    } catch (e) {
      console.log(`[DEBUG] ${message}`, context);
    }
  },
  info: (message, context) => {
    try {
      qerrors.logInfo && qerrors.logInfo(message, context);
    } catch (e) {
      console.info(`[INFO] ${message}`, context);
    }
  },
  warn: (message, context) => {
    try {
      qerrors.logWarn && qerrors.logWarn(message, context);
    } catch (e) {
      console.warn(`[WARN] ${message}`, context);
    }
  },
  error: (message, context) => {
    try {
      qerrors.logError && qerrors.logError(message, context);
    } catch (e) {
      console.error(`[ERROR] ${message}`, context);
    }
  },
  fatal: (message, context) => {
    try {
      qerrors.logFatal && qerrors.logFatal(message, context);
    } catch (e) {
      console.error(`[FATAL] ${message}`, context);
    }
  },
  createTimer: qerrors.createPerformanceTimer || (() => ({ end: () => {} })),
  logWithContext: (level, message, context) => {
    try {
      const logFn = enhancedLogger[level] || enhancedLogger.info;
      logFn(message, { context, timestamp: new Date().toISOString() });
    } catch (e) {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
  }
} : nullLogger;

// Security utilities - focused implementations
const sanitizeString = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&[#\w]+;/g, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/javascript:|vbscript:|data:/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
};

const sanitizeHtml = (v) => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '') : '');

const isValidString = (v) => typeof v === 'string' && v.trim() !== '';
const isValidObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Environment utilities - enhanced with better error handling
const envUtils = {
  getEnvVar: (name, defaultValue) => {
    try {
      const value = process.env[String(name).trim()];
      return value !== undefined && value !== '' ? value : defaultValue;
    } catch (error) {
      enhancedLogger.warn(`Failed to get environment variable ${name}`, { error: error.message });
      return defaultValue;
    }
  },
  
  hasEnvVar: (name) => {
    try {
      const v = process.env[String(name).trim()];
      return typeof v === 'string' && v.trim() !== '';
    } catch (error) {
      enhancedLogger.warn(`Failed to check environment variable ${name}`, { error: error.message });
      return false;
    }
  },
  
  requireEnvVars: (vars = []) => {
    try {
      const missing = (Array.isArray(vars) ? vars : []).filter((n) => !envUtils.hasEnvVar(n));
      if (missing.length) {
        throw new Error(`Missing or empty environment variables: ${missing.join(', ')}`);
      }
      return true;
    } catch (error) {
      enhancedLogger.error('Environment validation failed', { 
        missingVars: error.message, 
        requiredVars: vars 
      });
      throw error;
    }
  }
};

// URL utilities - use qgenutils if available, fallback otherwise
const urlUtils = qgenutils ? {
  ensureProtocol: qgenutils.ensureProtocol || ((url) => (typeof url === 'string' && url ? (url.match(/^\w+:\/\//) ? url : `https://${url}`) : 'https://')),
  normalizeUrlOrigin: qgenutils.normalizeUrlOrigin || ((u) => { try { return new URL((qgenutils.ensureProtocol || urlUtils.ensureProtocol)(u)).origin.toLowerCase(); } catch { return null; } }),
  stripProtocol: qgenutils.stripProtocol || ((u) => (typeof u === 'string' ? u.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '')),
  parseUrlParts: qgenutils.parseUrlParts || ((u) => { try { const url = new URL((qgenutils.ensureProtocol || urlUtils.ensureProtocol)(u)); return { baseUrl: url.origin, endpoint: url.pathname + url.search }; } catch { return null; } })
} : {
  ensureProtocol: (url) => (typeof url === 'string' && url ? (url.match(/^\w+:\/\//) ? url : `https://${url}`) : 'https://'),
  normalizeUrlOrigin: (u) => { try { return new URL(u.startsWith('http') ? u : `https://${u}`).origin.toLowerCase(); } catch { return null; } },
  stripProtocol: (u) => (typeof u === 'string' ? u.replace(/^https?:\/\//i, '').replace(/\/$/, '') : ''),
  parseUrlParts: (u) => { try { const url = new URL(u.startsWith('http') ? u : `https://${u}`); return { baseUrl: url.origin, endpoint: url.pathname + url.search }; } catch { return null; } }
};

// Enhanced ID generation
const generateExecutionId = () => {
  try {
    if (qerrors && qerrors.generateUniqueId) {
      return qerrors.generateUniqueId();
    }
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  } catch (error) {
    return `exec_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
  }
};

// Enhanced graceful shutdown
const gracefulShutdown = (server, cleanup = null, timeout = 10000) => {
  if (!server || typeof server.close !== 'function') {
    enhancedLogger.warn('Invalid server object provided to gracefulShutdown');
    return;
  }
  
  let shuttingDown = false;
  
  async function shutdown(signal) {
    if (shuttingDown) {
      enhancedLogger.info(`Shutdown already in progress, ignoring ${signal} signal`);
      return;
    }
    
    shuttingDown = true;
    enhancedLogger.info(`Received ${signal} signal, starting graceful shutdown`);
    
    const timer = setTimeout(() => {
      enhancedLogger.error('Graceful shutdown timeout, forcing exit');
      process.exit(1);
    }, timeout);
    
    try {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            enhancedLogger.error('Error closing server', { error: err.message });
            reject(err);
          } else {
            enhancedLogger.info('Server closed successfully');
            resolve();
          }
        });
      });
      
      if (typeof cleanup === 'function') {
        enhancedLogger.info('Running cleanup functions');
        await cleanup();
      }
      
      clearTimeout(timer);
      enhancedLogger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (err) {
      enhancedLogger.error('Error during graceful shutdown', { error: err.message, stack: err.stack });
      clearTimeout(timer);
      process.exit(1);
    }
  }
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Export all utilities with fallbacks for safety
module.exports = {
  // Logger (enhanced with fallbacks)
  logger: enhancedLogger,
  
  // Security utilities (enhanced)
  sanitizeString,
  sanitizeHtml,
  isValidString,
  isValidObject,
  
  // Environment utilities (enhanced)
  getEnvVar: envUtils.getEnvVar,
  hasEnvVar: envUtils.hasEnvVar,
  requireEnvVars: envUtils.requireEnvVars,
  
  // URL utilities (with fallbacks)
  ensureProtocol: urlUtils.ensureProtocol,
  normalizeUrlOrigin: urlUtils.normalizeUrlOrigin,
  stripProtocol: urlUtils.stripProtocol,
  parseUrlParts: urlUtils.parseUrlParts,
  
  // ID generation (enhanced)
  generateExecutionId,
  
  // Enhanced shutdown utility
  gracefulShutdown,
  
  // Performance utilities (with fallbacks)
  createPerformanceTimer: qerrors ? qerrors.createPerformanceTimer : (() => ({ end: () => {} })),
  generateUniqueId: qerrors ? qerrors.generateUniqueId : generateExecutionId,
  deepClone: qerrors ? qerrors.deepClone : (obj => JSON.parse(JSON.stringify(obj))),
  createTimer: qerrors ? qerrors.createTimer : (() => ({ end: () => ({}) })),
  
  // Error handling utilities (with fallbacks)
  createTypedError: qerrors ? qerrors.createTypedError : ((message, type, code) => {
    const error = new Error(message);
    error.type = type;
    error.code = code;
    return error;
  }),
  ErrorTypes: qerrors ? qerrors.ErrorTypes : { VALIDATION: 'validation', DATABASE: 'database', SYSTEM: 'system' },
  ErrorSeverity: qerrors ? qerrors.ErrorSeverity : { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'critical' },
  ErrorFactory: qerrors ? qerrors.ErrorFactory : {
    validation: (message) => {
      const error = new Error(message);
      error.type = 'validation';
      error.statusCode = 400;
      return error;
    },
    authentication: (message) => {
      const error = new Error(message);
      error.type = 'authentication';
      error.statusCode = 401;
      return error;
    },
    notFound: (resource) => {
      const error = new Error(`${resource} not found`);
      error.type = 'not_found';
      error.statusCode = 404;
      return error;
    },
    database: (message, operation) => {
      const error = new Error(message);
      error.type = 'database';
      error.operation = operation;
      error.statusCode = 500;
      return error;
    }
  },
  
  // Direct access to qgenutils if available (advanced usage)
  qgenutils: qgenutils || {},
  
  // Direct access to qerrors if available (advanced usage)
  qerrors: qerrors || {}
};