
/**
 * Unit tests for HTTP utility functions
 * Tests HTTP response helpers with mocked Express response objects.
 */

const { sendNotFound } = require('../../lib/http-utils');

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
      expect(mockRes.json).toHaveBeenCalledWith({ message });
    });

    test('should handle empty message', () => {
      sendNotFound(mockRes, '');
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: '' });
    });

    test('should handle null message', () => {
      sendNotFound(mockRes, null);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: null });
    });

    test('should handle undefined message', () => {
      sendNotFound(mockRes, undefined);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: undefined });
    });

    test('should handle long message', () => {
      const longMessage = 'A very long error message that describes exactly what went wrong in great detail';
      
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
