
/**
 * Unit tests for database utility functions
 * Tests MongoDB connection validation and uniqueness checking with mocked dependencies.
 */

const mongoose = require('mongoose');
const { ensureMongoDB, ensureUnique } = require('../../lib/database-utils');

// Mock mongoose for isolated testing
jest.mock('mongoose');

describe('Database Utils Module', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('ensureMongoDB function', () => {
    test('should return true when database is connected', () => {
      mongoose.connection.readyState = 1; // Connected state

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(true);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should return false and send 503 when database is connecting', () => {
      mongoose.connection.readyState = 2; // Connecting state

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Database is not available'
      });
    });

    test('should return false and send 503 when database is disconnecting', () => {
      mongoose.connection.readyState = 3; // Disconnecting state

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Database is not available'
      });
    });

    test('should return false and send 500 when database is disconnected', () => {
      mongoose.connection.readyState = 0; // Disconnected state

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Database connection failed'
      });
    });

    test('should return false and send 500 for unknown connection state', () => {
      mongoose.connection.readyState = 99; // Unknown state

      const result = ensureMongoDB(mockRes);

      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Database connection failed'
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

    test('should return true when no duplicate found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await ensureUnique(
        mockModel,
        { username: 'alice' },
        mockRes,
        'Username already exists'
      );

      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ username: 'alice' });
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should return false and send 409 when duplicate found', async () => {
      mockModel.findOne.mockResolvedValue({ username: 'alice', id: 1 });

      const result = await ensureUnique(
        mockModel,
        { username: 'alice' },
        mockRes,
        'Username already exists'
      );

      expect(result).toBe(false);
      expect(mockModel.findOne).toHaveBeenCalledWith({ username: 'alice' });
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Username already exists'
      });
    });

    test('should handle complex queries', async () => {
      mockModel.findOne.mockResolvedValue(null);
      const complexQuery = { 
        $and: [
          { username: 'alice' },
          { email: 'alice@example.com' }
        ]
      };

      const result = await ensureUnique(
        mockModel,
        complexQuery,
        mockRes,
        'User with this username and email already exists'
      );

      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith(complexQuery);
    });

    test('should propagate database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockModel.findOne.mockRejectedValue(dbError);

      await expect(ensureUnique(
        mockModel,
        { username: 'alice' },
        mockRes,
        'Username already exists'
      )).rejects.toThrow('Database connection failed');

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});
