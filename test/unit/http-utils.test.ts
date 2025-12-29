/**
 * Unit tests for HTTP utility functions
 *
 * Test suite for HTTP response utility functions that provide standardized
 * error and success response formatting. These tests verify proper status
 * code setting, response formatting, and message handling across various
 * scenarios including edge cases and invalid inputs.
 *
 * Functions Tested:
 * - sendNotFound: 404 status with custom messages
 * - sendConflict: 409 status for resource conflicts
 * - sendInternalServerError: 500 status for server errors
 * - sendServiceUnavailable: 503 status for service downtime
 *
 * Test Coverage:
 * - Status code verification
 * - Response message formatting
 * - Default message handling for empty/null inputs
 * - Mock response object interaction
 * - Error condition simulation
 */

import {
  sendNotFound,
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
} from '../../lib/http-utils.js';
import { setupTestEnvironment, expectNotFoundResponse } from '../test-utils.js';

describe('HTTP Utils Module', () => {
  let mockRes: any;

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
      sendNotFound(mockRes, null as any);

      expectNotFoundResponse(mockRes, 'Resource not found');
    });
  });

  describe('sendConflict function', () => {
    test('should send 409 status with custom message', () => {
      const message = 'Email already exists';

      sendConflict(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'CONFLICT',
            message: 'Email already exists',
          }),
        })
      );
    });
  });

  describe('sendInternalServerError function', () => {
    test('should send 500 status with custom message', () => {
      const message = 'Database connection failed';

      sendInternalServerError(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'INTERNAL_ERROR',
            message: 'Database connection failed',
          }),
        })
      );
    });
  });

  describe('sendServiceUnavailable function', () => {
    test('should send 503 status with custom message', () => {
      const message = 'Service under maintenance';

      sendServiceUnavailable(mockRes, message);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'SERVICE_UNAVAILABLE',
            message: 'Service under maintenance',
          }),
        })
      );
    });
  });
});
