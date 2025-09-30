/**
 * Extended HTTP Utilities Tests
 * Additional tests to achieve complete coverage and edge cases
 */

const { sendNotFound, sendConflict, sendInternalServerError, sendServiceUnavailable } = require('../../lib/http-utils');
const { testHelpers } = require('qtests/lib/envUtils.js');

describe('HTTP Utils Extended Coverage', () => { // covers additional edge cases
  let mockRes;
  let consoleSpy;
  let errorSpy;
  let warnSpy;

  beforeEach(() => {
    mockRes = testHelpers.createRes();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('sendInternalServerError edge cases', () => { // test unusual error inputs
    it('should log error with stack trace', () => { // ensures stack is logged
      sendInternalServerError(mockRes, 'Critical system failure');
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR] Internal server error: Critical system failure',
        expect.objectContaining({
          timestamp: expect.any(String),
          stack: expect.any(String)
        })
      );
    });

    it('should handle very long error messages', () => { // supports large payloads
      const longMessage = 'A'.repeat(1000);
      
      sendInternalServerError(mockRes, longMessage);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: longMessage,
        timestamp: expect.any(String)
      });
    });

    it('should handle error messages with special characters', () => { // handles unicode text
      const specialMessage = 'Error with "quotes" and \'apostrophes\' and émojis 🚨';
      
      sendInternalServerError(mockRes, specialMessage);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: specialMessage,
        timestamp: expect.any(String)
      });
    });
  });

  describe('sendServiceUnavailable edge cases', () => { // test retries and warnings
    it('should log warning with timestamp', () => { // verifies warn path
      sendServiceUnavailable(mockRes, 'Database temporarily offline');
      
      expect(warnSpy).toHaveBeenCalledWith(
        '[WARN] Service unavailable: Database temporarily offline',
        expect.objectContaining({
          timestamp: expect.any(String)
        })
      );
    });

    it('should include retryAfter hint in response', () => { // ensures hint in body
      sendServiceUnavailable(mockRes, 'Redis cache unavailable');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Redis cache unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });

    it('should handle null message properly', () => { // null should use default
      sendServiceUnavailable(mockRes, null);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service temporarily unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
  });

  describe('Response object validation edge cases', () => { // ensure invalid res objects throw
    it('should throw error when response object is null', () => { // validation for null res
      expect(() => {
        sendNotFound(null, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when response object is undefined', () => { // validation for undefined res
      expect(() => {
        sendConflict(undefined, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when status method is missing', () => { // ensures missing status fails
      const invalidRes = { json: jest.fn() };
      
      expect(() => {
        sendInternalServerError(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when json method is missing', () => { // ensures missing json fails
      const invalidRes = { status: jest.fn().mockReturnThis() };
      
      expect(() => {
        sendServiceUnavailable(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when status is not a function', () => { // rejects invalid status type
      const invalidRes = { status: 'not a function', json: jest.fn() };
      
      expect(() => {
        sendNotFound(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });

    it('should throw error when json is not a function', () => { // rejects invalid json type
      const invalidRes = { status: jest.fn().mockReturnThis(), json: 'not a function' };
      
      expect(() => {
        sendConflict(invalidRes, 'Test message');
      }).toThrow('Invalid Express response object provided');
    });
  });

  describe('Message handling edge cases', () => { // test unusual message formats
    it('should handle whitespace-only messages', () => { // whitespace should be treated empty
      sendNotFound(mockRes, '   ');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource not found',
        timestamp: expect.any(String)
      });
    });

    it('should handle empty string messages', () => { // empty string uses default
      sendConflict(mockRes, '');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Resource conflict',
        timestamp: expect.any(String)
      });
    });

    it('should trim leading and trailing whitespace', () => { // message normalization
      sendInternalServerError(mockRes, '  Error message  ');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error message',
        timestamp: expect.any(String)
      });
    });

    it('should handle messages with internal whitespace', () => { // internal spaces preserved
      sendServiceUnavailable(mockRes, 'Service  temporarily   unavailable');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service  temporarily   unavailable',
        timestamp: expect.any(String),
        retryAfter: '300'
      });
    });
  });

  describe('Timestamp validation', () => { // verify timestamps
    it('should include valid ISO timestamp in all responses', () => { // timestamp format assertion
      const beforeTime = new Date().toISOString();
      
      sendNotFound(mockRes, 'Test');
      
      const afterTime = new Date().toISOString();
      const responseTimestamp = mockRes.json.mock.calls[0][0].timestamp;
      
      expect(responseTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(responseTimestamp >= beforeTime).toBe(true);
      expect(responseTimestamp <= afterTime).toBe(true);
    });
  });

  describe('Method chaining', () => { // ensure utils return res for chaining
    it('should support method chaining by returning response object', () => { // ensures chainability
      const result = sendNotFound(mockRes, 'Test');
      
      expect(result).toBe(mockRes);
    });

    it('should maintain chainability for all HTTP utils', () => { // verify all helpers chain
      expect(sendConflict(mockRes, 'Test')).toBe(mockRes);
      expect(sendInternalServerError(mockRes, 'Test')).toBe(mockRes);
      expect(sendServiceUnavailable(mockRes, 'Test')).toBe(mockRes);
    });
  });
});
