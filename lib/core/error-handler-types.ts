/**
 * Error Handler Types and Interfaces
 * Core type definitions for error handling system
 */

export interface ErrorContext {
  operation?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    timestamp: string;
    requestId?: string;
    details?: any;
  };
}

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse['error'];
  timestamp: string;
  requestId?: string;
}
