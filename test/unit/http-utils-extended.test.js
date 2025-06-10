/**
 * Extended HTTP Utilities Tests
 * Additional tests to achieve complete coverage and edge cases
 */

const { sendNotFound, sendConflict, sendInternalServerError, sendServiceUnavailable } = require('../../lib/http-utils');

describe('HTTP Utils Extended Coverage', () => {
  let mockRes;
  let consoleSpy;
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('sendInternalServerError edge cases', () => {
    it('should log error with stack trace', () => {
      sendInternalServerError(mockRes, 'Critical system failure');
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR] Internal server error: Critical system failure',
        expect.objectContaining({
          timestamp: expect.any(String),
          stack: expect.any(String)
        })
      );
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      
      sendInternalServerError(mockRes, longMessage);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: longMessage,
        timestamp: expect.any(String)
      });
    });

    it('should handle error messages with special characters', () => {
      const specialMessage = 'Error with "quotes" and \'apostrophes\' and émojis 🚨';
      
      sendInternalServerError(mockRes, specialMessage);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: specialMessage,
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendServiceUnavailable edge cases', () => {
    it('should log warning with timestamp', () => {
      sendServiceUnavailable(mockRes, 'Database temporarily offline');
      
      expect(warnSpy).toHaveBeenCalledWith(
        '[WARN] Service unavailable: Database temporarily offline',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });

    it('should include retryAfter hint in response', () => {
      sendServiceUnavailable(mockRes, 'Redis cache unavailable');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Redis cache unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });

    it('should handle null message properly', () => {
      sendServiceUnavailable(mockRes, null);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
  });

  describe('Response object validation edge cases', () => {
    it('should throw error when response object is null', () => {
      expect(() => {
        sendNotFound(null, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when response object is undefined', () => {
      expect(() => {
        sendConflict(undefined, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when status method is missing', () => {
      const invalidRes = { json: jest.fn() };
      
      expect(() => {
        sendInternalServerError(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when json method is missing', () => {
      const invalidRes = { status: jest.fn().mockReturnThis() };
      
      expect(() => {
        sendServiceUnavailable(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when status is not a function', () => {
      const invalidRes = { status: 'not a function', json: jest.fn() };
      
      expect(() => {
        sendNotFound(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when json is not a function', () => {
      const invalidRes = { status: jest.fn().mockReturnThis(), json: 'not a function' };
      
      expect(() => {
        sendConflict(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });
  });

  describe('Message handling edge cases', () => {
    it('should handle whitespace-only messages', () => {
      sendNotFound(mockRes, '   ');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource not found',
        timestamp: expect.any(String)
      });
    });

    it('should handle empty string messages', () => {
      sendConflict(mockRes, '');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource conflict',
        timestamp: expect.any(String)
      });
    });

    it('should trim leading and trailing whitespace', () => {
      sendInternalServerError(mockRes, '  Error message  ');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error message',
        timestamp: expect.any(String)
      });
    });

    it('should handle messages with internal whitespace', () => {
      sendServiceUnavailable(mockRes, 'Service  temporarily   unavailable');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service  temporarily   unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
  });

  describe('Timestamp validation', () => {
    it('should include valid ISO timestamp in all responses', () => {
      const beforeTime = new Date().toISOString();
      
      sendNotFound(mockRes, 'Test');
      
      const afterTime = new Date().toISOString();
      const responseTimestamp = mockRes.json.mock.calls[0][0].timestamp;
      
      expect(responseTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(responseTimestamp >= beforeTime).toBe(true);
      expect(responseTimestamp <= afterTime).toBe(true);
    });
  });

  describe('Method chaining', () => {
    it('should support method chaining by returning response object', () => {
      const result = sendNotFound(mockRes, 'Test');
      
      expect(result).toBe(mockRes);
    });

    it('should maintain chainability for all HTTP utils', () => {
      expect(sendConflict(mockRes, 'Test')).toBe(mockRes);
      expect(sendInternalServerError(mockRes, 'Test')).toBe(mockRes);
      expect(sendServiceUnavailable(mockRes, 'Test')).toBe(mockRes);
    });
  });
});