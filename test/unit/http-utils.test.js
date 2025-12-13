/**
 * Unit tests for HTTP utility functions
 */

const { sendNotFound, sendConflict, sendInternalServerError, sendServiceUnavailable } = require('../../lib/http-utils');
const { setupTestEnvironment, expectNotFoundResponse } = require('../test-utils');

describe('HTTP Utils Module', () => {
  let mockRes;

  beforeEach(() => {
    ({ mockRes } = setupTestEnvironment());
  });

  describe('sendNotFound function', () => {
    test('should send 404 status with custom message', () => {
      const message = 'User not found';

      sendNotFound(mockRes, message);

      expectNotFoundResponse(mockRes, message);
    });

    test('should handle empty message with default', () => {
      sendNotFound(mockRes, '');
      
      expectNotFoundResponse(mockRes, 'Resource not found');
    });

    test('should provide default message for null/undefined', () => {
      sendNotFound(mockRes, null);
      expectNotFoundResponse(mockRes, 'Resource not found');

      sendNotFound(mockRes, undefined);
      expectNotFoundResponse(mockRes, 'Resource not found');
    });

    test('should throw error for invalid response object', () => {
      expect(() => sendNotFound(null, 'test')).toThrow();
      expect(() => sendNotFound({}, 'test')).toThrow();
      expect(() => sendNotFound({ status: 'not a function' }, 'test')).toThrow();
    });

    test('should handle long message', () => {
      const longMessage = 'A very long error message that describes exactly what went wrong in great detail';

      sendNotFound(mockRes, longMessage);

      expectNotFoundResponse(mockRes, longMessage);
    });

test('should provide default message for non-string values', () => {
      sendNotFound(mockRes, 123);

      expectNotFoundResponse(mockRes, 'Resource not found');
    });

    test('should handle non-string error values', () => {
      sendNotFound(mockRes, { error: 'not string' });

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'NOT_FOUND',
          message: 'Resource not found',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });
  });

    test('should handle non-string error values', () => {
      sendNotFound(mockRes, { error: 'not string' });

      expectNotFoundResponse(mockRes, 'Resource not found');
    });
  });

  describe('sendConflict function', () => {
    test('should send 409 status with custom message', () => {
      const message = 'Username already exists';

      sendConflict(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: {
          type: 'CONFLICT',
          message,
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    test('should provide default message for null/undefined', () => {
      sendConflict(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'CONFLICT',
          message: 'Resource conflict',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    test('should provide default message for non-string values', () => {
      sendConflict(mockRes, true);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'CONFLICT',
          message: 'Resource conflict',
          timestamp: expect.any(String),
          requestId: expect.any(String)
        }
      });
    });

    test('should throw error for invalid response object', () => {
      expect(() => sendConflict(null, 'test')).toThrow();
    });
  });

  describe('sendInternalServerError function', () => {
    test('should send 500 status with custom message and log error', () => {
      const message = 'Database connection failed';

      sendInternalServerError(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: {
          type: 'INTERNAL_ERROR',
          message,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          errorId: null
        }
      });
    });

    test('should provide default message for null/undefined', () => {
      sendInternalServerError(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Internal server error',
          timestamp: expect.any(String),
          requestId: expect.any(String),
          errorId: null
        }
      });
    });

    test('should provide default message for non-string values', () => {
      sendInternalServerError(mockRes, 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Internal server error',
          timestamp: expect.any(String),
          requestId: expect.any(String),
          errorId: null
        }
      });
    });
  });

  describe('sendServiceUnavailable function', () => {
    test('should send 503 status with custom message and retry hint', () => {
      const message = 'Database temporarily unavailable';

      sendServiceUnavailable(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: {
          type: 'SERVICE_UNAVAILABLE',
          message,
          timestamp: expect.any(String),
          requestId: expect.any(String),
          retryAfter: 300
        }
      });
    });

    test('should provide default message for null/undefined', () => {
      sendServiceUnavailable(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable',
          timestamp: expect.any(String),
          requestId: expect.any(String),
          retryAfter: 300
        }
      });
    });

    test('should provide default message for non-string values', () => {
      sendServiceUnavailable(mockRes, false);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          type: 'SERVICE_UNAVAILABLE',
          message: 'Service temporarily unavailable',
          timestamp: expect.any(String),
          requestId: expect.any(String),
          retryAfter: 300
        }
      });
    });
  });