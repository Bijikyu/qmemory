
/**
 * Unit tests for HTTP utility functions
 * Tests HTTP response helpers with mocked Express response objects.
 */

const { sendNotFound, sendConflict, sendInternalServerError, sendServiceUnavailable } = require('../../lib/http-utils'); // functions under test

describe('HTTP Utils Module', () => { // Tests standardized HTTP response helpers
  let mockRes;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('sendNotFound function', () => { // Verify 404 helper behavior
    test('should send 404 status with custom message', () => {
      const message = 'User not found';

      sendNotFound(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String)
      });
    }); // Tests production-ready response format with timestamp

    test('should handle empty message with default', () => {
      sendNotFound(mockRes, '');
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: '',
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for null/undefined', () => {
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

    test('should throw error for invalid response object', () => {
      expect(() => sendNotFound(null, 'test')).toThrow('Invalid Express response object provided');
      expect(() => sendNotFound({}, 'test')).toThrow('Invalid Express response object provided');
      expect(() => sendNotFound({ status: 'not a function' }, 'test')).toThrow('Invalid Express response object provided');
    }); // Tests new input validation for production safety

    test('should handle long message', () => {
      const longMessage = 'A very long error message that describes exactly what went wrong in great detail';
      
      sendNotFound(mockRes, longMessage);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: longMessage,
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendConflict function', () => { // Test 409 conflict responses
    test('should send 409 status with custom message', () => {
      const message = 'Username already exists';

      sendConflict(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for null/undefined', () => {
      sendConflict(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Resource conflict',
        timestamp: expect.any(String)
      });
    });

    test('should throw error for invalid response object', () => {
      expect(() => sendConflict(null, 'test')).toThrow('Invalid Express response object provided');
    });
  });

  describe('sendInternalServerError function', () => { // Test 500 error responses
    test('should send 500 status with custom message and log error', () => {
      const message = 'Database connection failed';

      sendInternalServerError(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String)
      });
    });

    test('should provide default message for null/undefined', () => {
      sendInternalServerError(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Internal server error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendServiceUnavailable function', () => { // Test 503 service unavailable responses
    test('should send 503 status with custom message and retry hint', () => {
      const message = 'Database temporarily unavailable';

      sendServiceUnavailable(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message,
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });

    test('should provide default message for null/undefined', () => {
      sendServiceUnavailable(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
      
      sendNotFound(mockRes, longMessage);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: longMessage });
    });

    test('should handle special characters in message', () => {
      const specialMessage = 'Resource "user-123" not found! @#$%^&*()';
      
      sendNotFound(mockRes, specialMessage);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: specialMessage });
    });

    test('should return response object for chaining', () => {
      const result = sendNotFound(mockRes, 'test');
      
      // Since our mock returns 'this', we should get the mock response object
      expect(result).toBe(mockRes);
    });
  });
});
