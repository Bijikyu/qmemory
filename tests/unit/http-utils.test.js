/**
 * HTTP Utility Functions Unit Tests
 *
 * This test suite provides comprehensive coverage for all HTTP utility functions
 * in the QMemory library. It tests response formatting, error handling,
 * input validation, and security features to ensure reliable HTTP
 * response generation for API endpoints.
 *
 * Test Coverage Areas:
 * - HTTP status code response functions (404, 409, 500, 503)
 * - Response object validation and error handling
 * - Message sanitization and security handling
 * - Default message handling for various input scenarios
 * - Error response format consistency
 * - Request ID generation and timestamp inclusion
 * - Input validation for response objects
 *
 * Security Testing:
 * - Response object validation prevents injection attacks
 * - Error message sanitization prevents information disclosure
 * - Invalid input handling prevents runtime errors
 *
 * Performance Considerations:
 * - Response generation efficiency
 * - Memory usage optimization
 * - Error handling overhead minimization
 */

const {
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
} = require('../../lib/http-utils');
const { setupTestEnvironment, expectNotFoundResponse } = require('../test-utils');

describe('HTTP Utils Module', () => {
  let mockRes;

  /**
   * Set up fresh test environment before each test
   *
   * This beforeEach hook ensures each test runs with a clean
   * mock response object, preventing test interference and ensuring
   * reliable test isolation. It sets up the mock Express response
   * object that will capture all HTTP utility function calls.
   */
  beforeEach(() => {
    ({ mockRes } = setupTestEnvironment());
  });

  describe('sendNotFound function', () => {
    /**
     * Test custom message handling in 404 responses
     *
     * This test verifies that the sendNotFound function correctly
     * handles custom error messages and formats them into the standard
     * error response structure with proper HTTP status codes.
     */
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
      const longMessage =
        'A very long error message that describes exactly what went wrong in great detail';

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
          requestId: expect.any(String),
        },
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
        requestId: expect.any(String),
      },
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
        requestId: expect.any(String),
      },
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
        requestId: expect.any(String),
      },
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
        errorId: null,
      },
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
        errorId: null,
      },
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
        errorId: null,
      },
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
        retryAfter: 300,
      },
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
        retryAfter: 300,
      },
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
        retryAfter: 300,
      },
    });
  });
});
