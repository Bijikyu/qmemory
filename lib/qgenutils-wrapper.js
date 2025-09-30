/**
 * qgenutils-wrapper
 * Centralizes imports from qgenutils and provides safe fallbacks.
 * Use this module instead of importing qgenutils directly to make
 * future replacements or shims easy and consistent.
 */

// Minimal no-op logger fallback to avoid runtime errors if logger missing
const nullLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};

// Prefer using only the logger from qgenutils to avoid pulling in qerrors
let logger = nullLogger;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  logger = require('qgenutils/lib/logger');
} catch (_) {
  logger = nullLogger;
}

// Lightweight local utilities (do not import qgenutils modules that pull qerrors)
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

const getEnvVar = (name, def) => process.env[String(name).trim()] ?? def;
const hasEnvVar = (name) => {
  const v = process.env[String(name).trim()];
  return typeof v === 'string' && v.trim() !== '';
};
const requireEnvVars = (vars = []) => {
  const missing = (Array.isArray(vars) ? vars : []).filter((n) => !hasEnvVar(n));
  if (missing.length) throw new Error(`Missing or empty environment variables: ${missing.join(', ')}`);
};

// Local graceful shutdown helper to avoid importing qerrors
const gracefulShutdown = (server, cleanup = null, timeout = 10000) => {
  if (!server || typeof server.close !== 'function') return;
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    const timer = setTimeout(() => process.exit(1), timeout);
    try {
      await new Promise((resolve) => server.close(resolve));
      if (typeof cleanup === 'function') await cleanup();
      clearTimeout(timer);
      process.exit(0);
    } catch (err) {
      logger.error('gracefulShutdown error', { message: err.message });
      process.exit(1);
    }
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Minimal URL helpers (only if needed)
const ensureProtocol = (url) => (typeof url === 'string' && url ? (url.match(/^\w+:\/\//) ? url : `https://${url}`) : 'https://');
const normalizeUrlOrigin = (u) => { try { return new URL(ensureProtocol(u)).origin.toLowerCase(); } catch { return null; } };
const stripProtocol = (u) => (typeof u === 'string' ? u.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '');
const parseUrlParts = (u) => { try { const url = new URL(ensureProtocol(u)); return { baseUrl: url.origin, endpoint: url.pathname + url.search }; } catch { return null; } };

const generateExecutionId = () => `exec_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;

module.exports = {
  logger,
  sanitizeString,
  sanitizeHtml,
  isValidString,
  isValidObject,
  getEnvVar,
  hasEnvVar,
  requireEnvVars,
  gracefulShutdown,
  createShutdownManager: null,
  ensureProtocol,
  normalizeUrlOrigin,
  stripProtocol,
  parseUrlParts,
  generateExecutionId
};
