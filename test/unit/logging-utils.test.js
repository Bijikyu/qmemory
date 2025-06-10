/**
 * Logging Utilities Test Suite
 * Comprehensive tests for centralized logging functions
 */

const { logFunctionEntry, logFunctionExit, logFunctionError } = require('../../lib/logging-utils');

describe('Logging Utils Module', () => {
  let consoleSpy;
  let errorSpy;
  
  beforeEach(() => {
    // Spy on console methods to capture logging output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore original console methods and clear environment
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
    delete process.env.NODE_ENV;
  });

  describe('logFunctionEntry', () => {
    it('should log function entry in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionEntry('testFunction', { param1: 'value1', param2: 42 });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction started with param1: value1, param2: 42'
      );
    });

    it('should handle empty parameters object', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionEntry('testFunction', {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction started with '
      );
    });

    it('should handle undefined parameters', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionEntry('testFunction');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction started with '
      );
    });

    it('should serialize object parameters', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionEntry('testFunction', { 
        obj: { nested: 'value' },
        str: 'string'
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction started with obj: {"nested":"value"}, str: string'
      );
    });

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      logFunctionEntry('testFunction', { param: 'value' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log when NODE_ENV is undefined', () => {
      // NODE_ENV is undefined by default
      
      logFunctionEntry('testFunction', { param: 'value' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('logFunctionExit', () => {
    it('should log function exit in development mode with string result', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionExit('testFunction', 'result value');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction completed with result: result value'
      );
    });

    it('should log function exit with object result', () => {
      process.env.NODE_ENV = 'development';
      
      const result = { success: true, data: 'test' };
      logFunctionExit('testFunction', result);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        `[DEBUG] testFunction completed with result: ${JSON.stringify(result, null, 2)}`
      );
    });

    it('should handle null result', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionExit('testFunction', null);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction completed with result: null'
      );
    });

    it('should handle undefined result', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionExit('testFunction', undefined);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction completed with result: undefined'
      );
    });

    it('should handle boolean result', () => {
      process.env.NODE_ENV = 'development';
      
      logFunctionExit('testFunction', true);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DEBUG] testFunction completed with result: true'
      );
    });

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      logFunctionExit('testFunction', 'result');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should not log when NODE_ENV is undefined', () => {
      logFunctionExit('testFunction', 'result');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('logFunctionError', () => {
    it('should always log errors regardless of environment', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error message');
      error.stack = 'Error stack trace';
      
      logFunctionError('testFunction', error);
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR] testFunction failed:',
        {
          message: 'Test error message',
          stack: 'Error stack trace',
          name: 'Error',
          timestamp: expect.any(String)
        }
      );
    });

    it('should log errors in development mode', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Development error');
      
      logFunctionError('testFunction', error);
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR] testFunction failed:',
        expect.objectContaining({
          message: 'Development error',
          name: 'Error',
          timestamp: expect.any(String)
        })
      );
    });

    it('should handle custom error types', () => {
      const customError = new TypeError('Type error message');
      
      logFunctionError('testFunction', customError);
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR] testFunction failed:',
        expect.objectContaining({
          message: 'Type error message',
          name: 'TypeError'
        })
      );
    });

    it('should include valid ISO timestamp', () => {
      const error = new Error('Test error');
      
      logFunctionError('testFunction', error);
      
      const logCall = errorSpy.mock.calls[0][1];
      expect(logCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle error without stack trace', () => {
      const error = new Error('No stack error');
      delete error.stack;
      
      logFunctionError('testFunction', error);
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[ERROR] testFunction failed:',
        expect.objectContaining({
          message: 'No stack error',
          stack: undefined,
          name: 'Error'
        })
      );
    });
  });

  describe('Environment handling', () => {
    it('should handle test environment like production', () => {
      process.env.NODE_ENV = 'test';
      
      logFunctionEntry('testFunction', { param: 'value' });
      logFunctionExit('testFunction', 'result');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle staging environment like production', () => {
      process.env.NODE_ENV = 'staging';
      
      logFunctionEntry('testFunction', { param: 'value' });
      logFunctionExit('testFunction', 'result');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});