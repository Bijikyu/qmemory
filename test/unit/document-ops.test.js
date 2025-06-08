
/**
 * Unit tests for document operation functions
 * Tests all CRUD operations, error handling, and user ownership enforcement
 * using mocked Mongoose models and Express response objects.
 */

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

// Mock the database utils dependency
jest.mock('../../lib/database-utils', () => ({
  ensureUnique: jest.fn()
}));

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

    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log
    console.error = jest.fn(); // Mock console.error
  });

  describe('performUserDocOp function', () => {
    test('should execute operation successfully', async () => {
      const mockOp = jest.fn().mockResolvedValue(mockDoc);

      const result = await performUserDocOp(
        mockModel,
        'doc123',
        'alice',
        mockOp
      );

      expect(result).toBe(mockDoc);
      expect(mockOp).toHaveBeenCalledWith(mockModel, 'doc123', 'alice');
    });

    test('should handle CastError gracefully', async () => {
      const castError = new Error('Cast to ObjectId failed');
      castError.name = 'CastError';
      const mockOp = jest.fn().mockRejectedValue(castError);

      const result = await performUserDocOp(
        mockModel,
        'invalid-id',
        'alice',
        mockOp
      );

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith(
        'performUserDocOp caught CastError, returning null'
      );
    });

    test('should propagate non-CastError exceptions', async () => {
      const dbError = new Error('Database connection failed');
      const mockOp = jest.fn().mockRejectedValue(dbError);

      await expect(performUserDocOp(
        mockModel,
        'doc123',
        'alice',
        mockOp
      )).rejects.toThrow('Database connection failed');
    });
  });

  describe('findUserDoc function', () => {
    test('should find document by ID and user', async () => {
      mockModel.findOne.mockResolvedValue(mockDoc);

      const result = await findUserDoc(mockModel, 'doc123', 'alice');

      expect(result).toBe(mockDoc);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: 'doc123',
        user: 'alice'
      });
    });

    test('should return null when document not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await findUserDoc(mockModel, 'doc123', 'alice');

      expect(result).toBeNull();
    });

    test('should return null for invalid ObjectId', async () => {
      const result = await findUserDoc(mockModel, 'invalid-id', 'alice');

      expect(result).toBeNull();
    });
  });

  describe('deleteUserDoc function', () => {
    test('should delete document and return it', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(mockDoc);

      const result = await deleteUserDoc(mockModel, 'doc123', 'alice');

      expect(result).toBe(mockDoc);
      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'doc123',
        user: 'alice'
      });
    });

    test('should return null when document not found', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(null);

      const result = await deleteUserDoc(mockModel, 'doc123', 'alice');

      expect(result).toBeNull();
    });
  });

  describe('userDocActionOr404 function', () => {
    test('should return document when action succeeds', async () => {
      const mockAction = jest.fn().mockResolvedValue(mockDoc);

      const result = await userDocActionOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        mockAction,
        'Document not found'
      );

      expect(result).toBe(mockDoc);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should send 404 when action returns null', async () => {
      const mockAction = jest.fn().mockResolvedValue(null);

      const result = await userDocActionOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        mockAction,
        'Document not found'
      );

      expect(result).toBeNull();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Document not found'
      });
    });

    test('should propagate action errors', async () => {
      const actionError = new Error('Action failed');
      const mockAction = jest.fn().mockRejectedValue(actionError);

      await expect(userDocActionOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        mockAction,
        'Document not found'
      )).rejects.toThrow('Action failed');
    });
  });

  describe('fetchUserDocOr404 function', () => {
    test('should return document when found', async () => {
      mockModel.findOne.mockResolvedValue(mockDoc);

      const result = await fetchUserDocOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        'Document not found'
      );

      expect(result).toBe(mockDoc);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should send 404 when document not found', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await fetchUserDocOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        'Document not found'
      );

      expect(result).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Document not found'
      });
    });
  });

  describe('deleteUserDocOr404 function', () => {
    test('should return deleted document when found', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(mockDoc);

      const result = await deleteUserDocOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        'Document not found'
      );

      expect(result).toBe(mockDoc);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should send 404 when document not found', async () => {
      mockModel.findOneAndDelete.mockResolvedValue(null);

      const result = await deleteUserDocOr404(
        mockModel,
        'doc123',
        'alice',
        mockRes,
        'Document not found'
      );

      expect(result).toBeUndefined();
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('listUserDocs function', () => {
    test('should return all user documents with default sorting', async () => {
      const mockDocs = [mockDoc, { ...mockDoc, _id: 'doc456' }];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocs)
      });

      const result = await listUserDocs(mockModel, 'alice');

      expect(result).toBe(mockDocs);
      expect(mockModel.find).toHaveBeenCalledWith({ user: 'alice' });
    });

    test('should apply custom sorting', async () => {
      const mockDocs = [mockDoc];
      const mockSort = { title: 1 };
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockDocs)
      });

      const result = await listUserDocs(mockModel, 'alice', mockSort);

      expect(result).toBe(mockDocs);
      expect(mockModel.find().sort).toHaveBeenCalledWith(mockSort);
    });

    test('should return empty array when no documents found', async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      const result = await listUserDocs(mockModel, 'alice');

      expect(result).toEqual([]);
    });
  });

  describe('createUniqueDoc function', () => {
    test('should create document when unique', async () => {
      ensureUnique.mockResolvedValue(true);
      mockModel.create.mockResolvedValue(mockDoc);

      const fields = { title: 'New Document', user: 'alice' };
      const uniqueQuery = { title: 'New Document' };

      const result = await createUniqueDoc(
        mockModel,
        fields,
        uniqueQuery,
        mockRes,
        'Document already exists'
      );

      expect(result).toBe(mockDoc);
      expect(ensureUnique).toHaveBeenCalledWith(
        mockModel,
        uniqueQuery,
        mockRes,
        'Document already exists'
      );
      expect(mockModel.create).toHaveBeenCalledWith(fields);
    });

    test('should return undefined when duplicate exists', async () => {
      ensureUnique.mockResolvedValue(false);

      const fields = { title: 'Duplicate Document', user: 'alice' };
      const uniqueQuery = { title: 'Duplicate Document' };

      const result = await createUniqueDoc(
        mockModel,
        fields,
        uniqueQuery,
        mockRes,
        'Document already exists'
      );

      expect(result).toBeUndefined();
      expect(mockModel.create).not.toHaveBeenCalled();
    });

    test('should propagate creation errors', async () => {
      ensureUnique.mockResolvedValue(true);
      const createError = new Error('Creation failed');
      mockModel.create.mockRejectedValue(createError);

      const fields = { title: 'New Document', user: 'alice' };
      const uniqueQuery = { title: 'New Document' };

      await expect(createUniqueDoc(
        mockModel,
        fields,
        uniqueQuery,
        mockRes,
        'Document already exists'
      )).rejects.toThrow('Creation failed');
    });
  });

  describe('updateUserDoc function', () => {
    beforeEach(() => {
      mockModel.findById.mockResolvedValue(mockDoc);
    });

    test('should update document without uniqueness check', async () => {
      const fieldsToUpdate = { title: 'Updated Title' };

      const result = await updateUserDoc(
        mockModel,
        'doc123',
        'alice',
        fieldsToUpdate
      );

      expect(result).toBe(mockDoc);
      expect(mockModel.findById).toHaveBeenCalledWith('doc123');
      expect(Object.assign).toHaveBeenCalledWith(mockDoc, fieldsToUpdate);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    test('should update document with uniqueness check', async () => {
      ensureUnique.mockResolvedValue(true);
      const fieldsToUpdate = { title: 'Unique Title' };
      const uniqueQuery = { title: 'Unique Title' };

      const result = await updateUserDoc(
        mockModel,
        'doc123',
        'alice',
        fieldsToUpdate,
        uniqueQuery,
        mockRes,
        'Title already exists'
      );

      expect(result).toBe(mockDoc);
      expect(ensureUnique).toHaveBeenCalledWith(
        mockModel,
        uniqueQuery,
        mockRes,
        'Title already exists'
      );
    });

    test('should return undefined when uniqueness check fails', async () => {
      ensureUnique.mockResolvedValue(false);
      const fieldsToUpdate = { title: 'Duplicate Title' };
      const uniqueQuery = { title: 'Duplicate Title' };

      const result = await updateUserDoc(
        mockModel,
        'doc123',
        'alice',
        fieldsToUpdate,
        uniqueQuery,
        mockRes,
        'Title already exists'
      );

      expect(result).toBeUndefined();
      expect(mockDoc.save).not.toHaveBeenCalled();
    });

    test('should return null when document not found', async () => {
      mockModel.findById.mockResolvedValue(null);

      const result = await updateUserDoc(
        mockModel,
        'nonexistent',
        'alice',
        { title: 'Updated' }
      );

      expect(result).toBeNull();
    });

    test('should return null when user does not own document', async () => {
      const otherUserDoc = { ...mockDoc, user: 'bob' };
      mockModel.findById.mockResolvedValue(otherUserDoc);

      const result = await updateUserDoc(
        mockModel,
        'doc123',
        'alice',
        { title: 'Updated' }
      );

      expect(result).toBeNull();
    });
  });
});
