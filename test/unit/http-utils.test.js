
/**
 * Unit tests for HTTP utility functions
 * Tests HTTP response helpers with mocked Express response objects.
 */

const { sendNotFound, sendConflict, sendInternalServerError, sendServiceUnavailable } = require('../../lib/http-utils'); // functions under test
// Prefer qtests helpers over ad-hoc response mocks
const { testHelpers } = require('qtests/lib/envUtils.js');

describe('HTTP Utils Module', () => { // Tests standardized HTTP response helpers
  let mockRes;

  beforeEach(() => {
    mockRes = testHelpers.createRes();
  });

  describe('sendNotFound function', () => { // verify 404 helper behavior
    test('should send 404 status with custom message', () => { // returns message to client
      const message = 'User not found';

      sendNotFound(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String)
      });
    }); // Tests production-ready response format with timestamp

    test('should handle empty message with default', () => { // covers blank input edge case
      sendNotFound(mockRes, '');
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Resource not found', // Empty string triggers default message
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for null/undefined', () => { // nullish should fallback
      sendNotFound(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Resource not found',
        timestamp: expect.any(String)
      });

      sendNotFound(mockRes, undefined);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Resource not found',
        timestamp: expect.any(String)
      });
    }); // Tests new default message fallback for production safety

    test('should throw error for invalid response object', () => { // validates res object shape
      expect(() => sendNotFound(null, 'test')).toThrow('Invalid Express response object provided');
      expect(() => sendNotFound({}, 'test')).toThrow('Invalid Express response object provided');
      expect(() => sendNotFound({ status: 'not a function' }, 'test')).toThrow('Invalid Express response object provided');
    }); // Tests new input validation for production safety

    test('should handle long message', () => { // supports verbose errors
      const longMessage = 'A very long error message that describes exactly what went wrong in great detail';

      sendNotFound(mockRes, longMessage);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: longMessage,
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for non-string values', () => { // ensures fallback when message is not string
      sendNotFound(mockRes, 123);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource not found',
        timestamp: expect.any(String)
      });

      sendNotFound(mockRes, { error: 'not string' });

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource not found',
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendConflict function', () => { // test 409 conflict responses
    test('should send 409 status with custom message', () => { // sends provided conflict text
      const message = 'Username already exists';

      sendConflict(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for null/undefined', () => { // ensures fallback on empty
      sendConflict(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource conflict',
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for non-string values', () => { // ensures fallback when message is not string
      sendConflict(mockRes, true);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource conflict',
        timestamp: expect.any(String)
      });
    });

    test('should throw error for invalid response object', () => { // checks validation of res
      expect(() => sendConflict(null, 'test')).toThrow('Invalid Express response object provided');
    });
  });

  describe('sendInternalServerError function', () => { // test 500 error responses
    test('should send 500 status with custom message and log error', () => { // ensures error details returned
      const message = 'Database connection failed';

      sendInternalServerError(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for null/undefined', () => { // default message path
      sendInternalServerError(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for non-string values', () => { // ensures fallback when message is not string
      sendInternalServerError(mockRes, 500);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendServiceUnavailable function', () => { // test 503 service unavailable responses
    test('should send 503 status with custom message and retry hint', () => { // includes retryAfter hint
      const message = 'Database temporarily unavailable';

      sendServiceUnavailable(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });

    test('should provide default message for null/undefined', () => { // handles nullish input
      sendServiceUnavailable(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });

    test('should provide default message for non-string values', () => { // ensures fallback when message is not string
      sendServiceUnavailable(mockRes, false);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
  });
});
