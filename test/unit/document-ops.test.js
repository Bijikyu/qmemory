/**
 * Unit tests for document operation functions
 * Tests all document CRUD operations with mocked Mongoose models and dependencies.
 */

const mongoose = require('mongoose');
const {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  listUserDocs,
  createUniqueDoc,
  updateUserDoc
} = require('../../lib/document-ops');

// Mock dependencies
jest.mock('../../lib/http-utils', () => ({
  sendNotFound: jest.fn()
}));

jest.mock('../../lib/database-utils', () => ({
  ensureUnique: jest.fn()
}));

const { sendNotFound } = require('../../lib/http-utils');
const { ensureUnique } = require('../../lib/database-utils');

describe('Document Operations Module', () => {
  let mockModel;
  let mockRes;
  let mockDoc;

  beforeEach(() => {
    mockDoc = {
      _id: 'doc123',
      user: 'alice',
      title: 'Test Document',
      save: jest.fn().mockResolvedValue(undefined)
    };

    mockModel = {
      findOne: jest.fn(),
      findOneAndDelete: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findById: jest.fn()
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockModel = createMockModel();
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  describe('performUserDocOp', () => {
    test('should execute operation callback and return result', async () => {
      const mockDoc = { _id: '123', user: 'testuser', title: 'Test Doc' };
      const mockCallback = jest.fn().mockResolvedValue(mockDoc);

      const result = await performUserDocOp(mockModel, '123', 'testuser', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockModel, '123', 'testuser');
      expect(result).toEqual(mockDoc);
    });

    test('should return null for CastError (invalid ObjectId)', async () => {
      const castError = new mongoose.Error.CastError('Invalid ObjectId', 'invalid', '_id');
      const mockCallback = jest.fn().mockRejectedValue(castError);

      const result = await performUserDocOp(mockModel, 'invalid', 'testuser', mockCallback);

      expect(result).toBeNull();
    });

    test('should re-throw non-CastError errors', async () => {
      const otherError = new Error('Database connection failed');
      const mockCallback = jest.fn().mockRejectedValue(otherError);

      await expect(
        performUserDocOp(mockModel, '123', 'testuser', mockCallback)
      ).rejects.toThrow('Database connection failed');
    });

    test('should handle null result from operation', async () => {
      const mockCallback = jest.fn().mockResolvedValue(null);

      const result = await performUserDocOp(mockModel, '123', 'testuser', mockCallback);

      expect(result).toBeNull();
    });
  });

  describe('findUserDoc', () => {
    test('should find document by ID and user', async () => {
      const mockDoc = { _id: '123', user: 'testuser', title: 'Test Doc' };
      mockModel.findOne.mockResolvedValue(mockDoc);

      const result = await findUserDoc(mockModel, '123', 'testuser');

      expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '123', user: 'testuser' });
      expect(result).toEqual(mockDoc);
    });

    test('should return null when document not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await findUserDoc(mockModel, '123', 'testuser');

      expect(result).toBeNull();
    });

    test('should handle invalid ObjectId gracefully', async () => {
      const result = await findUserDoc(mockModel, 'invalid', 'testuser');

      expect(result).toBeNull();
    });
  });

  describe('deleteUserDoc', () => {
    test('should delete document by ID and user', async () => {
      const mockDoc = { _id: '123', user: 'testuser', title: 'Test Doc' };
      mockModel.findOneAndDelete.mockResolvedValue(mockDoc);

      const result = await deleteUserDoc(mockModel, '123', 'testuser');

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: '123', user: 'testuser' });
      expect(result).toEqual(mockDoc);
    });

    test('should return null when document not found for deletion', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(null);

      const result = await deleteUserDoc(mockModel, '123', 'testuser');

      expect(result).toBeNull();
    });
  });

  describe('userDocActionOr404', () => {
    test('should return document when action succeeds', async () => {
      const mockDoc = { _id: '123', user: 'testuser' };
      const mockAction = jest.fn().mockResolvedValue(mockDoc);

      const result = await userDocActionOr404(
        mockModel, '123', 'testuser', mockRes, mockAction, 'Not found'
      );

      expect(result).toEqual(mockDoc);
      expect(sendNotFound).not.toHaveBeenCalled();
    });

    test('should send 404 when action returns null', async () => {
      const mockAction = jest.fn().mockResolvedValue(null);

      const result = await userDocActionOr404(
        mockModel, '123', 'testuser', mockRes, mockAction, 'Document not found'
      );

      expect(result).toBeUndefined();
      expect(sendNotFound).toHaveBeenCalledWith(mockRes, 'Document not found');
    });

    test('should re-throw errors from action', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        userDocActionOr404(mockModel, '123', 'testuser', mockRes, mockAction, 'Not found')
      ).rejects.toThrow('Database error');
    });
  });

  describe('fetchUserDocOr404', () => {
    test('should return document when found', async () => {
      const mockDoc = { _id: '123', user: 'testuser' };
      mockModel.findOne.mockResolvedValue(mockDoc);

      const result = await fetchUserDocOr404(
        mockModel, '123', 'testuser', mockRes, 'Document not found'
      );

      expect(result).toEqual(mockDoc);
      expect(sendNotFound).not.toHaveBeenCalled();
    });

    test('should send 404 when document not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await fetchUserDocOr404(
        mockModel, '123', 'testuser', mockRes, 'Document not found'
      );

      expect(result).toBeUndefined();
      expect(sendNotFound).toHaveBeenCalledWith(mockRes, 'Document not found');
    });
  });

  describe('deleteUserDocOr404', () => {
    test('should return deleted document when found', async () => {
      const mockDoc = { _id: '123', user: 'testuser' };
      mockModel.findOneAndDelete.mockResolvedValue(mockDoc);

      const result = await deleteUserDocOr404(
        mockModel, '123', 'testuser', mockRes, 'Document not found'
      );

      expect(result).toEqual(mockDoc);
      expect(sendNotFound).not.toHaveBeenCalled();
    });

    test('should send 404 when document not found for deletion', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(null);

      const result = await deleteUserDocOr404(
        mockModel, '123', 'testuser', mockRes, 'Document not found'
      );

      expect(result).toBeUndefined();
      expect(sendNotFound).toHaveBeenCalledWith(mockRes, 'Document not found');
    });
  });

  describe('listUserDocs', () => {
    test('should return all user documents with sorting', async () => {
      const mockDocs = [
        { _id: '1', user: 'testuser', title: 'Doc 1' },
        { _id: '2', user: 'testuser', title: 'Doc 2' }
      ];
      const mockSort = { createdAt: -1 };

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocs)
      });

      const result = await listUserDocs(mockModel, 'testuser', mockSort);

      expect(mockModel.find).toHaveBeenCalledWith({ user: 'testuser' });
      expect(mockModel.find().sort).toHaveBeenCalledWith(mockSort);
      expect(result).toEqual(mockDocs);
    });

    test('should return empty array when no documents found', async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await listUserDocs(mockModel, 'testuser', {});

      expect(result).toEqual([]);
    });

    test('should handle null sort parameter', async () => {
      const mockDocs = [{ _id: '1', user: 'testuser' }];

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocs)
      });

      const result = await listUserDocs(mockModel, 'testuser', null);

      expect(mockModel.find().sort).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockDocs);
    });
  });

  describe('createUniqueDoc', () => {
    test('should create document when unique', async () => {
      const fields = { title: 'New Doc', user: 'testuser' };
      const uniqueQuery = { title: 'New Doc' };
      const savedDoc = { _id: '123', ...fields };

      ensureUnique.mockResolvedValue(true);

      // Mock the model constructor and save method
      const mockDocInstance = {
        save: jest.fn().mockResolvedValue(savedDoc)
      };
      mockModel.mockImplementation(() => mockDocInstance);

      const result = await createUniqueDoc(
        mockModel, fields, uniqueQuery, mockRes, 'Duplicate found'
      );

      expect(ensureUnique).toHaveBeenCalledWith(mockModel, uniqueQuery, mockRes, 'Duplicate found');
      expect(mockModel).toHaveBeenCalledWith(fields);
      expect(mockDocInstance.save).toHaveBeenCalled();
      expect(result).toEqual(savedDoc);
    });

    test('should return undefined when duplicate exists', async () => {
      const fields = { title: 'Duplicate Doc', user: 'testuser' };
      const uniqueQuery = { title: 'Duplicate Doc' };

      ensureUnique.mockResolvedValue(false); // Duplicate found

      const result = await createUniqueDoc(
        mockModel, fields, uniqueQuery, mockRes, 'Duplicate found'
      );

      expect(result).toBeUndefined();
      expect(mockModel).not.toHaveBeenCalled();
    });

    test('should re-throw database errors', async () => {
      const fields = { title: 'New Doc', user: 'testuser' };
      const uniqueQuery = { title: 'New Doc' };

      ensureUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        createUniqueDoc(mockModel, fields, uniqueQuery, mockRes, 'Duplicate')
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateUserDoc', () => {
    let mockDocInstance;

    beforeEach(() => {
      mockDocInstance = {
        _id: '123',
        user: 'testuser',
        title: 'Original Title',
        save: jest.fn()
      };
      mockModel.findById.mockResolvedValue(mockDoc);
    });

    test('should update document when found and unique', async () => {
      const fieldsToUpdate = { title: 'Updated Title' };
      const uniqueQuery = { title: 'Updated Title' };

      // Mock fetchUserDocOr404 behavior
      mockModel.findOne.mockResolvedValue(mockDocInstance);
      ensureUnique.mockResolvedValue(true);
      mockDocInstance.save.mockResolvedValue({
        ...mockDocInstance,
        ...fieldsToUpdate
      });

      const result = await updateUserDoc(
        mockModel, '123', 'testuser', fieldsToUpdate, uniqueQuery, mockRes, 'Duplicate'
      );

      expect(ensureUnique).toHaveBeenCalledWith(mockModel, uniqueQuery, mockRes, 'Duplicate');
      expect(mockDocInstance.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    test('should return undefined when document not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await updateUserDoc(
        mockModel, '123', 'testuser', { title: 'New' }, {}, mockRes, 'Duplicate'
      );

      expect(result).toBeUndefined();
      expect(sendNotFound).toHaveBeenCalled();
    });

    test('should return undefined when uniqueness check fails', async () => {
      const fieldsToUpdate = { title: 'Duplicate Title' };
      const uniqueQuery = { title: 'Duplicate Title' };

      mockModel.findOne.mockResolvedValue(mockDocInstance);
      ensureUnique.mockResolvedValue(false); // Duplicate found

      const result = await updateUserDoc(
        mockModel, '123', 'testuser', fieldsToUpdate, uniqueQuery, mockRes, 'Duplicate'
      );

      expect(result).toBeUndefined();
      expect(mockDocInstance.save).not.toHaveBeenCalled();
    });

    test('should skip uniqueness check when unique fields not changing', async () => {
      const fieldsToUpdate = { description: 'New description' };
      const uniqueQuery = { title: 'Original Title' }; // Title not changing

      mockModel.findOne.mockResolvedValue(mockDocInstance);
      mockDocInstance.save.mockResolvedValue({
        ...mockDocInstance,
        ...fieldsToUpdate
      });

      const result = await updateUserDoc(
        mockModel, '123', 'testuser', fieldsToUpdate, uniqueQuery, mockRes, 'Duplicate'
      );

      expect(ensureUnique).not.toHaveBeenCalled(); // Should be skipped
      expect(mockDocInstance.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('should handle update without uniqueness constraint', async () => {
      const fieldsToUpdate = { description: 'New description' };

      mockModel.findOne.mockResolvedValue(mockDocInstance);
      mockDocInstance.save.mockResolvedValue({
        ...mockDocInstance,
        ...fieldsToUpdate
      });

      const result = await updateUserDoc(
        mockModel, '123', 'testuser', fieldsToUpdate, null, mockRes, 'Duplicate'
      );

      expect(ensureUnique).not.toHaveBeenCalled();
      expect(mockDocInstance.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
  // Helper functions to create mock objects
  function createMockModel() {
    return {
      findOne: jest.fn(),
      findOneAndDelete: jest.fn(),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      }),
      create: jest.fn(),
      findById: jest.fn(),
      mockImplementation: jest.fn(),
    };
  }

  function createMockResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }
});