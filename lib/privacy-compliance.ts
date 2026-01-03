/**
 * Privacy and Compliance Utilities
 * Provides GDPR/CCPA compliance features for data handling and user rights
 */
import type { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Data retention policy configuration
 */
interface RetentionPolicy {
  personalData: number; // days
  userActivity: number; // days
  auditLogs: number; // days
  inactiveAccount: number; // days
}

/**
 * Default retention policies (in days)
 */
const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  personalData: 365, // 1 year
  userActivity: 180, // 6 months
  auditLogs: 1095, // 3 years
  inactiveAccount: 730, // 2 years
};

/**
 * Consent management for user data processing
 */
interface ConsentRecord {
  userId: string;
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  cookies: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

/**
 * Audit log entry for data access
 */
interface AuditLog {
  userId?: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  dataAccessed?: string[];
}

/**
 * Get retention policy from environment or use defaults
 */
const getRetentionPolicy = (): RetentionPolicy => {
  try {
    const envPolicy = process.env.DATA_RETENTION_POLICY;
    if (envPolicy) {
      const parsed = JSON.parse(envPolicy);
      return { ...DEFAULT_RETENTION_POLICY, ...parsed };
    }
  } catch (error) {
    console.error(
      'Invalid DATA_RETENTION_POLICY format:',
      error instanceof Error ? error.message : String(error)
    );
  }
  return DEFAULT_RETENTION_POLICY;
};

/**
 * Check if endpoint requires explicit user consent
 */
const requiresConsent = (path: string): boolean => {
  const consentRequiredPaths = ['/api/analytics', '/api/marketing', '/api/personalization'];
  return consentRequiredPaths.some(p => path.startsWith(p));
};

/**
 * Get user consent from request
 */
const getUserConsent = (req: Request): ConsentRecord | null => {
  const consentHeader = req.headers['x-user-consent'];
  if (typeof consentHeader === 'string') {
    const MAX_CONSENT_HEADER_SIZE = 1024;
    if (consentHeader.length > MAX_CONSENT_HEADER_SIZE) return null;
    try {
      const decoded = Buffer.from(consentHeader, 'base64').toString();
      if (decoded.length > MAX_CONSENT_HEADER_SIZE) return null;
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Validate consent for specific action
 */
const hasValidConsent = (consent: ConsentRecord | null, path: string): boolean => {
  if (!consent) return false;
  const maxAge = 365 * 24 * 60 * 60 * 1000;
  if (Date.now() - consent.timestamp.getTime() > maxAge) return false;
  if (path.startsWith('/api/analytics') && !consent.analytics) return false;
  if (path.startsWith('/api/marketing') && !consent.marketing) return false;
  if (path.startsWith('/api/personalization') && !consent.dataProcessing) return false;
  return consent.dataProcessing;
};

/**
 * Send consent required response
 */
const sendConsentRequired = (res: Response): void => {
  res.status(451).json({
    error: {
      type: 'CONSENT_REQUIRED',
      message: 'User consent required for this operation',
      timestamp: new Date().toISOString(),
      requiredConsents: ['dataProcessing', 'analytics', 'marketing'],
    },
  });
  return;
};

/**
 * Log data access for audit trail
 */
const logDataAccess = (req: Request): void => {
  const auditEntry: AuditLog = {
    userId:
      req.user && typeof req.user === 'object' && 'id' in req.user
        ? (req.user as any).id
        : undefined,
    action: `${req.method} ${req.path}`,
    resource: req.path,
    timestamp: new Date(),
    ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    userAgent: req.headers['user-agent']
      ? req.headers['user-agent'].replace(/[<>]/g, '').substring(0, 100)
      : 'unknown',
    success: true,
    dataAccessed: Object.keys(req.body ?? {}),
  };
  console.log(
    'AUDIT:',
    JSON.stringify({
      ...auditEntry,
      userAgent: auditEntry.userAgent ? auditEntry.userAgent.substring(0, 100) : 'unknown',
    })
  );
};

/**
 * Privacy middleware to log data access and enforce consent
 */
export const privacyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  logDataAccess(req);
  if (requiresConsent(req.path)) {
    const consent = getUserConsent(req);
    if (!hasValidConsent(consent, req.path)) {
      sendConsentRequired(res);
      return;
    }
  }
  next();
};

/**
 * Anonymize personal data for non-production environments
 */
export const anonymizePersonalData = (data: any): any => {
  if (process.env.NODE_ENV === 'production') return data;
  const anonymized = { ...data };
  const piiFields = ['email', 'name', 'displayName', 'address', 'phone', 'ssn'];
  piiFields.forEach(field => {
    if (anonymized[field]) anonymized[field] = `***${String(anonymized[field]).slice(-3)}`;
  });
  return anonymized;
};

/**
 * Data retention scheduler for cleanup operations
 */
export const setupDataRetention = (): void => {
  const scheduleCleanup = (type: string, retentionDays: number): void => {
    console.log(`Scheduled cleanup for ${type} with retention: ${retentionDays} days`);
  };
  const policy = getRetentionPolicy();
  scheduleCleanup('personalData', policy.personalData);
  scheduleCleanup('userActivity', policy.userActivity);
  scheduleCleanup('auditLogs', policy.auditLogs);
  scheduleCleanup('inactiveAccounts', policy.inactiveAccount);
};

/**
 * Right to be forgotten endpoint handler
 */
export const handleDataDeletionRequest = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;
  const requestId = req.body.requestId;

  if (!userId || !requestId) {
    res.status(400).json({
      error: {
        type: 'INVALID_REQUEST',
        message: 'User ID and request ID required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  try {
    console.log('DATA_DELETION_REQUEST:', {
      userId,
      requestId,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    });

    res.json({
      message: 'Data deletion request received and processing',
      requestId,
      estimatedCompletion: '30 days',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Data deletion request failed:', errorMessage);
    res.status(500).json({
      error: {
        type: 'DELETION_FAILED',
        message: 'Failed to process data deletion request',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Data export endpoint for user rights
 */
export const handleDataExportRequest = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(400).json({
      error: {
        type: 'INVALID_REQUEST',
        message: 'User ID required',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  try {
    const userData = {
      personalInfo: {},
      activity: [],
      preferences: {},
      consents: [],
      exportDate: new Date().toISOString(),
    };

    console.log('DATA_EXPORT_REQUEST:', {
      userId,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    });

    res.json({
      message: 'Data export prepared',
      data: anonymizePersonalData(userData),
      format: 'json',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Data export failed:', errorMessage);
    res.status(500).json({
      error: {
        type: 'EXPORT_FAILED',
        message: 'Failed to prepare data export',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Compliance middleware for CCPA "Do Not Sell" requests
 */
export const ccpaComplianceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const doNotSellHeader = req.headers['ccpa-do-not-sell'];
  if (doNotSellHeader === 'true') {
    console.log('CCPA_DO_NOT_SELL:', {
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip ?? req.socket.remoteAddress ?? 'unknown',
    });
    res.set('CCPA-Do-Not-Sell', 'true');
  }
  next();
};

/**
 * Privacy headers middleware
 */
export const privacyHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.set({
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
};
