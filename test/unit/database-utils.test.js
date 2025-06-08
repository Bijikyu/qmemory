/**
 * Unit tests for database utility functions
 * Tests MongoDB connection validation and uniqueness checking with mocked dependencies.
 */

const { ensureMongoDB, ensureUnique } = require('../../lib/database-utils');

// Mock mongoose module
const mongoose = {
  connection: { readyState: 1 },
  Error: {
    CastError: class CastError extends Error {
      constructor(message, value, path) {
        super(message);
        this.name = 'CastError';
        this.value = value;
        this.path = path;
      }
    }
  }
};
jest.doMock('mongoose', () => mongoose);

describe('Database Utils module', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('ensureMongoDB function', () => {
    test('should return true when database is connected', () => {
      // Reset mock before test
      jest.resetModules();

      // Re-mock mongoose with connected state
      jest.doMock('mongoose', () => ({
        connection: { readyState: 1 }
      }));

      // Re-require the module to pick up the mock
      const { ensureMongoDB: freshEnsureMongoDB } = require('../../lib/database-utils');

      const result = freshEnsureMongoDB(mockRes);

      expect(result).toBe(true);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should return false and send 503 when database is disconnected', () => {
      mongoose.connection = { readyState: 0 };

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Database functionality unavailable' });
    });

    test('should return false and send 503 when database is connecting', () => {
      mongoose.connection = { readyState: 2 };

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    test('should handle connection state check errors', () => {
      // Simulate an error when accessing connection readyState
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => { throw new Error('Connection error'); }
      });

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error checking database connection' });

      // Reset to normal state
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        writable: true
      });
    });
  });

  describe('ensureUnique function', () => {
    let mockModel;

    beforeEach(() => {
      mockModel = {
        findOne: jest.fn()
      };
    });

    test('should return true when no duplicate is found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await ensureUnique(mockModel, { username: 'test' }, mockRes, 'Duplicate found');

      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ username: 'test' });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should return false and send 409 when duplicate is found', async () => {
      mockModel.findOne.mockResolvedValue({ id: 1, username: 'test' });

      const result = await ensureUnique(mockModel, { username: 'test' }, mockRes, 'Username already exists');

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Username already exists' });
    });

    test('should throw error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      mockModel.findOne.mockRejectedValue(dbError);

      await expect(ensureUnique(mockModel, { username: 'test' }, mockRes, 'Duplicate')).rejects.toThrow('Database connection failed');
    });
  });
});
