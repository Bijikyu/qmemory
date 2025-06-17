/**
 * Enhanced Database Utilities Test Suite
 * Comprehensive testing for advanced database operation helpers
 * 
 * This test suite validates the enhanced database utilities including:
 * - MongoDB error handling and classification
 * - Safe database operation wrappers with timing
 * - Retry logic with exponential backoff
 * - Idempotency checking for critical operations
 * - Query optimization patterns
 * - Aggregation pipeline builders
 */

const {
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline
} = require('../../lib/database-utils');

describe('Enhanced Database Utilities', () => {
  
  describe('handleMongoError', () => {
    it('should handle duplicate key errors correctly', () => {
      const error = {
        code: 11000,
        message: 'Duplicate key error',
        keyValue: { email: 'test@example.com' }
      };
      
      const result = handleMongoError(error, 'createUser', { userId: '123' });
      
      expect(result.type).toBe('DUPLICATE_KEY_ERROR');
      expect(result.message).toBe('Resource already exists');
      expect(result.recoverable).toBe(true);
      expect(result.statusCode).toBe(409);
      expect(result.details).toEqual({ email: 'test@example.com' });
    });

    it('should handle validation errors correctly', () => {
      const error = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: {
          email: { message: 'Email is required' },
          name: { message: 'Name is required' }
        }
      };
      
      const result = handleMongoError(error, 'createUser', { userId: '123' });
      
      expect(result.type).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Data validation failed');
      expect(result.recoverable).toBe(true);
      expect(result.statusCode).toBe(400);
      expect(result.details).toEqual(error.errors);
    });

    it('should handle connection errors correctly', () => {
      const error = {
        name: 'MongoNetworkError',
        message: 'Connection failed',
        code: null
      };
      
      const result = handleMongoError(error, 'findUser', { userId: '123' });
      
      expect(result.type).toBe('CONNECTION_ERROR');
      expect(result.message).toBe('Database connection failed');
      expect(result.recoverable).toBe(false);
      expect(result.statusCode).toBe(503);
    });

    it('should handle timeout errors correctly', () => {
      const error = {
        name: 'MongoServerSelectionError',
        message: 'Server selection timeout',
        code: null
      };
      
      const result = handleMongoError(error, 'findUser', { userId: '123' });
      
      expect(result.type).toBe('TIMEOUT_ERROR');
      expect(result.message).toBe('Database operation timed out');
      expect(result.recoverable).toBe(true);
      expect(result.statusCode).toBe(504);
    });

    it('should handle unknown errors with fallback', () => {
      const error = {
        name: 'UnknownError',
        message: 'Something went wrong',
        code: 999
      };
      
      const result = handleMongoError(error, 'updateUser', { userId: '123' });
      
      expect(result.type).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Database operation failed');
      expect(result.recoverable).toBe(false);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('safeDbOperation', () => {
    it('should execute successful operations and return timing', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ id: '123', name: 'Test User' });
      
      const result = await safeDbOperation(mockOperation, 'createUser', { userId: '123' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123', name: 'Test User' });
      expect(typeof result.processingTime).toBe('number');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle operation failures and return error info', async () => {
      const mockError = {
        code: 11000,
        message: 'Duplicate key error',
        keyValue: { email: 'test@example.com' }
      };
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      const result = await safeDbOperation(mockOperation, 'createUser', { userId: '123' });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('DUPLICATE_KEY_ERROR');
      expect(result.error.recoverable).toBe(true);
      expect(typeof result.processingTime).toBe('number');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should include context in error logging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Test error');
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      await safeDbOperation(mockOperation, 'testOperation', { userId: '123', action: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database operation failed: testOperation'),
        expect.objectContaining({
          context: { userId: '123', action: 'test' }
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('retryDbOperation', () => {
    it('should succeed on first attempt without retry', async () => {
      const mockOperation = jest.fn().mockResolvedValue({ id: '123' });
      
      const result = await retryDbOperation(mockOperation, 'findUser', {
        maxRetries: 3,
        context: { userId: '123' }
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry recoverable errors with exponential backoff', async () => {
      const mockError = {
        name: 'MongoServerSelectionError',
        message: 'Server selection timeout'
      };
      
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ id: '123' });
      
      // Mock setTimeout to avoid actual delays in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((cb) => cb());
      
      const result = await retryDbOperation(mockOperation, 'findUser', {
        maxRetries: 3,
        baseDelay: 100
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: '123' });
      expect(mockOperation).toHaveBeenCalledTimes(3);
      
      global.setTimeout = originalSetTimeout;
    });

    it('should not retry non-recoverable errors', async () => {
      const mockError = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: { email: 'Invalid email' }
      };
      
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      const result = await retryDbOperation(mockOperation, 'createUser', {
        maxRetries: 3,
        retryCondition: (error) => error.type === 'CONNECTION_ERROR' // Only retry connection errors
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('VALIDATION_ERROR');
      expect(mockOperation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should stop retrying after max attempts', async () => {
      const mockError = {
        name: 'MongoServerSelectionError',
        message: 'Server selection timeout'
      };
      
      const mockOperation = jest.fn().mockRejectedValue(mockError);
      
      // Mock setTimeout to avoid actual delays in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((cb) => cb());
      
      const result = await retryDbOperation(mockOperation, 'findUser', {
        maxRetries: 2,
        baseDelay: 100
      });
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('TIMEOUT_ERROR');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('ensureIdempotency', () => {
    let mockModel;

    beforeEach(() => {
      mockModel = {
        modelName: 'User',
        findOne: jest.fn()
      };
    });

    it('should return existing record if found (idempotent)', async () => {
      const existingRecord = { _id: '123', email: 'test@example.com', name: 'Test User' };
      mockModel.findOne.mockResolvedValue(existingRecord);
      
      const mockOperation = jest.fn();
      
      const result = await ensureIdempotency(
        mockModel,
        { field: 'email', value: 'test@example.com' },
        mockOperation,
        'createUser'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingRecord);
      expect(result.idempotent).toBe(true);
      expect(mockOperation).not.toHaveBeenCalled();
      expect(mockModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should execute operation if no existing record found', async () => {
      mockModel.findOne.mockResolvedValue(null);
      
      const newRecord = { _id: '456', email: 'new@example.com', name: 'New User' };
      const mockOperation = jest.fn().mockResolvedValue(newRecord);
      
      const result = await ensureIdempotency(
        mockModel,
        { field: 'email', value: 'new@example.com' },
        mockOperation,
        'createUser'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(newRecord);
      expect(result.idempotent).toBeUndefined();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle race conditions gracefully', async () => {
      // First call returns null (no existing record)
      // Second call (after race condition) returns the record created by another process
      const raceRecord = { _id: '789', email: 'race@example.com', name: 'Race User' };
      mockModel.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(raceRecord);
      
      const duplicateError = {
        code: 11000,
        message: 'Duplicate key error',
        keyValue: { email: 'race@example.com' }
      };
      const mockOperation = jest.fn().mockRejectedValue(duplicateError);
      
      const result = await ensureIdempotency(
        mockModel,
        { field: 'email', value: 'race@example.com' },
        mockOperation,
        'createUser'
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(raceRecord);
      expect(result.idempotent).toBe(true);
      expect(result.raceCondition).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledTimes(2);
    });

    it('should propagate non-duplicate errors', async () => {
      mockModel.findOne.mockResolvedValue(null);
      
      const validationError = {
        name: 'ValidationError',
        message: 'Validation failed',
        errors: { name: 'Name is required' }
      };
      const mockOperation = jest.fn().mockRejectedValue(validationError);
      
      const result = await ensureIdempotency(
        mockModel,
        { field: 'email', value: 'invalid@example.com' },
        mockOperation,
        'createUser'
      );
      
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('optimizeQuery', () => {
    let mockQuery;

    beforeEach(() => {
      mockQuery = {
        lean: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        hint: jest.fn().mockReturnThis()
      };
    });

    it('should apply lean optimization by default', () => {
      const result = optimizeQuery(mockQuery);
      
      expect(mockQuery.lean).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockQuery);
    });

    it('should apply all optimization options', () => {
      const options = {
        lean: true,
        select: 'name email',
        limit: 10,
        skip: 20,
        sort: { createdAt: -1 },
        populate: 'author',
        hint: { email: 1 }
      };
      
      optimizeQuery(mockQuery, options);
      
      expect(mockQuery.lean).toHaveBeenCalledTimes(1);
      expect(mockQuery.select).toHaveBeenCalledWith('name email');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.skip).toHaveBeenCalledWith(20);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockQuery.populate).toHaveBeenCalledWith('author');
      expect(mockQuery.hint).toHaveBeenCalledWith({ email: 1 });
    });

    it('should skip null/undefined options', () => {
      const options = {
        lean: false,
        select: null,
        limit: null,
        skip: 0, // Should still be applied
        sort: undefined,
        populate: '',
        hint: null
      };
      
      optimizeQuery(mockQuery, options);
      
      expect(mockQuery.lean).not.toHaveBeenCalled();
      expect(mockQuery.select).not.toHaveBeenCalled();
      expect(mockQuery.limit).not.toHaveBeenCalled();
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.sort).not.toHaveBeenCalled();
      expect(mockQuery.populate).toHaveBeenCalledWith('');
      expect(mockQuery.hint).not.toHaveBeenCalled();
    });
  });

  describe('createAggregationPipeline', () => {
    it('should create empty pipeline for no stages', () => {
      const result = createAggregationPipeline([]);
      
      expect(result).toEqual([]);
    });

    it('should build pipeline with all stage types', () => {
      const stages = [
        { match: { status: 'active' } },
        { group: { _id: '$category', total: { $sum: 1 } } },
        { sort: { total: -1 } },
        { limit: 10 },
        { project: { category: '$_id', count: '$total' } },
        { lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'details' } },
        { unwind: '$details' }
      ];
      
      const result = createAggregationPipeline(stages);
      
      expect(result).toEqual([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $project: { category: '$_id', count: '$total' } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'details' } },
        { $unwind: '$details' }
      ]);
    });

    it('should handle stages with multiple operations', () => {
      const stages = [
        { 
          match: { status: 'active' },
          group: { _id: '$type', count: { $sum: 1 } }
        }
      ];
      
      const result = createAggregationPipeline(stages);
      
      expect(result).toEqual([
        { $match: { status: 'active' } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);
    });

    it('should ignore unknown stage types', () => {
      const stages = [
        { match: { status: 'active' } },
        { unknownStage: { field: 'value' } },
        { sort: { createdAt: -1 } }
      ];
      
      const result = createAggregationPipeline(stages);
      
      expect(result).toEqual([
        { $match: { status: 'active' } },
        { $sort: { createdAt: -1 } }
      ]);
    });
  });

  // Integration tests for existing utilities to ensure backward compatibility
  describe('Existing utilities (backward compatibility)', () => {
    describe('ensureMongoDB', () => {
      it('should be available and callable', () => {
        expect(typeof ensureMongoDB).toBe('function');
        
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        // Should not throw when called
        expect(() => ensureMongoDB(mockRes)).not.toThrow();
      });
    });

    describe('ensureUnique', () => {
      it('should be available and callable', async () => {
        expect(typeof ensureUnique).toBe('function');
        
        const mockModel = {
          findOne: jest.fn().mockResolvedValue(null)
        };
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        
        const result = await ensureUnique(mockModel, { email: 'test@example.com' }, mockRes, 'User already exists');
        
        expect(result).toBe(true);
        expect(mockModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      });
    });
  });
});