
/**
 * Unit tests for database utility functions
 * Tests MongoDB connection validation and uniqueness checking with mocked dependencies.
 */

const mongoose = require('mongoose');
const { ensureMongoDB, ensureUnique } = require('../../lib/database-utils');

// Mock mongoose to control connection state
jest.mock('mongoose', () => ({
  connection: {
    readyState: 1 // Default to connected state
  },
  Error: {
    CastError: class CastError extends Error {
      constructor(message) {
        super(message);
        this.name = 'CastError';
      }
    }
  }
}));

describe('Database Utils Module', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockResponse();
    // Reset mongoose connection state to connected
    mongoose.connection.readyState = 1;
    jest.clearAllMocks();
  });

  describe('ensureMongoDB function', () => {
    test('should return true when database is connected', () => {
      mongoose.connection.readyState = 1; // Connected
      
      const result = ensureMongoDB(mockRes);
      
      expect(result).toBe(true);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should return false and send 503 when database is disconnected', () => {
      mongoose.connection.readyState = 0; // Disconnected
      
      const result = ensureMongoDB(mockRes);
      
      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Database functionality unavailable'
      });
    });

    test('should return false and send 503 when database is connecting', () => {
      mongoose.connection.readyState = 2; // Connecting
      
      const result = ensureMongoDB(mockRes);
      
      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    test('should return false and send 503 when database is disconnecting', () => {
      mongoose.connection.readyState = 3; // Disconnecting
      
      const result = ensureMongoDB(mockRes);
      
      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(503);
    });

    test('should handle errors during connection check', () => {
      // Mock an error by making readyState throw
      Object.defineProperty(mongoose.connection, 'readyState', {
        get: () => {
          throw new Error('Connection error');
        },
        configurable: true
      });
      
      const result = ensureMongoDB(mockRes);
      
      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error checking database connection'
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

    test('should return true when no duplicate exists', async () => {
      mockModel.findOne.mockResolvedValue(null);
      
      const result = await ensureUnique(
        mockModel, 
        { username: 'unique' }, 
        mockRes, 
        'Duplicate found'
      );
      
      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ username: 'unique' });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should return false and send 409 when duplicate exists', async () => {
      const existingDoc = { _id: '123', username: 'duplicate' };
      mockModel.findOne.mockResolvedValue(existingDoc);
      
      const result = await ensureUnique(
        mockModel, 
        { username: 'duplicate' }, 
        mockRes, 
        'Username already taken'
      );
      
      expect(result).toBe(false);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username already taken'
      });
    });

    test('should handle complex query objects', async () => {
      mockModel.findOne.mockResolvedValue(null);
      const complexQuery = { 
        $and: [
          { username: 'test' }, 
          { email: 'test@example.com' }
        ]
      };
      
      const result = await ensureUnique(
        mockModel, 
        complexQuery, 
        mockRes, 
        'Duplicate found'
      );
      
      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith(complexQuery);
    });

    test('should re-throw database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockModel.findOne.mockRejectedValue(dbError);
      
      await expect(ensureUnique(
        mockModel, 
        { username: 'test' }, 
        mockRes, 
        'Duplicate found'
      )).rejects.toThrow('Database connection failed');
      
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle empty query objects', async () => {
      mockModel.findOne.mockResolvedValue(null);
      
      const result = await ensureUnique(mockModel, {}, mockRes, 'Duplicate');
      
      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({});
    });
  });
});
