
/**
 * Unit tests for HTTP utility functions
 * Tests Express.js response helpers in isolation using mocked response objects.
 */

const { sendNotFound } = require('../../lib/http-utils');

describe('HTTP Utils Module', () => {
  describe('sendNotFound function', () => {
    let mockRes;

    beforeEach(() => {
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });

    test('should send 404 status with custom message', () => {
      const message = 'User not found';
      
      sendNotFound(mockRes, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: message });
    });

    test('should handle empty message', () => {
      sendNotFound(mockRes, '');
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: '' });
    });

    test('should handle special characters in message', () => {
      const message = 'Resource "test-123" not found!';
      
      sendNotFound(mockRes, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: message });
    });

    test('should return response object for chaining', () => {
      const result = sendNotFound(mockRes, 'Not found');
      
      expect(result).toBe(mockRes);
    });
  });
});
