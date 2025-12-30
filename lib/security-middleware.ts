/**
 * Security Middleware
 * Provides essential security headers and protections for Express.js applications
 */
import helmet from 'helmet';
import type { Application, Request, Response, NextFunction } from 'express';

/**
 * Rate limiting middleware (basic implementation)
 * Prevents brute force attacks and abuse
 */
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class BasicRateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 60000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      const clientData = this.store[clientId];

      if (!clientData || clientData.resetTime < now) {
        // First request or window expired
        this.store[clientId] = {
          count: 1,
          resetTime: now + this.windowMs,
        };
        return next();
      }

      // Race condition protection - use atomic-like operation
      const currentCount = clientData.count;
      if (currentCount >= this.maxRequests) {
        const resetIn = Math.ceil((clientData.resetTime - now) / 1000);
        res.set({
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': this.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': clientData.resetTime.toString(),
        });
        res.status(429).json({
          error: {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            timestamp: new Date().toISOString(),
            retryAfter: resetIn,
          },
        });
        return;
      }

      clientData.count = ++clientData.count; // Atomic increment
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': (this.maxRequests - clientData.count).toString(),
        'X-RateLimit-Reset': clientData.resetTime.toString(),
      });

      next();
    };
  }
}

/**
 * Content Security Policy configuration
 * Restricts resource loading to prevent XSS and data injection attacks
 */
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for development flexibility
    scriptSrc: ["'self'"], // Only allow scripts from same origin
    imgSrc: ["'self'", 'data:', 'https:'], // Allow images from data URIs and HTTPS
    connectSrc: ["'self'"], // Restrict API calls to same origin
    fontSrc: ["'self'"],
    objectSrc: ["'none'"], // Prevent object/embed attacks
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"], // Prevent clickjacking
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [], // Force HTTPS in production
  },
};

/**
 * Configure security headers based on environment
 */
const getHelmetConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    // Content Security Policy - prevents XSS and data injection
    contentSecurityPolicy: isProduction ? contentSecurityPolicy : false, // Disable in development for flexibility

    // HTTP Strict Transport Security - forces HTTPS in production
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,

    // Prevent MIME type sniffing
    noSniff: true,

    // Prevent clickjacking
    frameguard: {
      action: 'deny' as const,
    },

    // Prevent older IE from executing downloads in site context
    ieNoOpen: true,

    // Hide Express server information
    xPoweredBy: false,
  };
};

/**
 * Cookie security middleware
 * Ensures cookies are set with secure attributes
 */
const cookieSecurity = (req: Request, res: Response, next: NextFunction): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Check if res.cookie exists before overriding
  if (!res.cookie) {
    return next();
  }

  // Override default cookie settings to be more secure
  const originalCookie = res.cookie.bind(res);

  res.cookie = (name: string, value: string, options?: any) => {
    const secureOptions = {
      ...options,
      // Security flags for production
      secure: isProduction ? true : (options?.secure ?? false),
      httpOnly: options?.httpOnly ?? true, // Default to HttpOnly
      sameSite: options?.sameSite || 'strict', // Default to strict
    };

    return originalCookie.call(res, name, value, secureOptions);
  };

  next();
};

let activeRateLimiter: BasicRateLimiter | null = null;

/**
 * Security middleware configuration
 * Applies all security measures to Express application
 */
export const setupSecurity = (app: Application): void => {
  // Apply helmet for security headers
  app.use(helmet(getHelmetConfig()));

  // Apply cookie security middleware
  app.use(cookieSecurity);

  // Apply basic rate limiting (store reference for cleanup)
  activeRateLimiter = new BasicRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100 // 100 requests per window
  );
  app.use(activeRateLimiter.middleware());

  // Additional custom security headers
  app.use((req: Request, res: Response, next: NextFunction): void => {
    // Content-Type options to prevent MIME sniffing
    res.set('X-Content-Type-Options', 'nosniff');

    // Frame options to prevent clickjacking
    res.set('X-Frame-Options', 'DENY');

    // XSS protection (legacy browsers)
    res.set('X-XSS-Protection', '1; mode=block');

    // Permissions policy for modern browsers
    res.set(
      'Permissions-Policy',
      'geolocation=(), ' +
        'microphone=(), ' +
        'camera=(), ' +
        'magnetometer=(), ' +
        'gyroscope=(), ' +
        'speaker=(), ' +
        'fullscreen=(self), ' +
        'payment=(), ' +
        'usb=()'
    );

    next();
  });
};

/**
 * Cleanup security resources
 */
export const destroySecurity = (): void => {
  if (activeRateLimiter) {
    activeRateLimiter.destroy();
    activeRateLimiter = null;
  }
};

/**
 * Environment-specific security configuration
 */
export const getSecurityConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        helmetEnabled: true,
        cspEnabled: true,
        hstsEnabled: true,
        rateLimitingEnabled: true,
        loggingLevel: 'warn',
      };

    case 'staging':
      return {
        helmetEnabled: true,
        cspEnabled: false, // More flexible for testing
        hstsEnabled: false,
        rateLimitingEnabled: true,
        loggingLevel: 'info',
      };

    case 'development':
    default:
      return {
        helmetEnabled: true,
        cspEnabled: false, // Disable for development flexibility
        hstsEnabled: false,
        rateLimitingEnabled: false, // Disable for easier development
        loggingLevel: 'debug',
      };
  }
};

export { BasicRateLimiter };
export type { Application, Request, Response, NextFunction } from 'express';
