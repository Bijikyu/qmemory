/**
 * Document Helpers Test Suite
 * Comprehensive testing for generic MongoDB CRUD operations
 * 
 * This test suite validates the document helper utilities including:
 * - Safe document retrieval with error handling
 * - Document updates with consistent return patterns
 * - Document deletion with boolean returns
 * - Cascading deletion with cleanup operations
 * - Document creation with validation handling
 * - Document queries with condition filtering
 * - Bulk operations with individual error handling
 */

const {
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments
} = require('../../lib/document-helpers');

// Mock the database utilities module
const mockSafeDbOperation = jest.fn();
jest.mock('../../lib/database-utils', () => ({
  safeDbOperation: mockSafeDbOperation,
  handleMongoError: jest.fn()
}));

describe('Document Helpers', () => {
  let mockModel;
  let consoleSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to verify logging
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
    };

    // Create mock Mongoose model
    mockModel = {
      modelName: 'TestModel',
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn()
    };
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('findDocumentById', () => {
    it('should return document when found successfully', async () => {
      const mockDocument = { _id: '123', name: 'Test Document' };
      mockSafeDbOperation.mockResolvedValue({ success: true, data: mockDocument });

      const result = await findDocumentById(mockModel, '123');

      expect(result).toEqual(mockDocument);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findDocumentById',
        { model: 'TestModel', id: '123' }
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'findDocumentById is running with TestModel model and 123 id'
      );
    });

    it('should return undefined when document not found', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: undefined });

      const result = await findDocumentById(mockModel, '123');

      expect(result).toBeUndefined();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'findDocumentById is returning undefined'
      );
    });

    it('should return undefined when operation fails', async () => {
      mockSafeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'VALIDATION_ERROR', message: 'Invalid ID' } 
      });

      const result = await findDocumentById(mockModel, 'invalid-id');

      expect(result).toBeUndefined();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'findDocumentById is returning undefined due to error'
      );
    });

    it('should normalize null to undefined', async () => {
      mockSafeDbOperation.mockImplementation(async (operation) => {
        const result = await operation();
        return { success: true, data: result };
      });

      // Mock findById to return null (MongoDB behavior for not found)
      mockModel.findById.mockResolvedValue(null);

      const result = await findDocumentById(mockModel, '123');

      expect(result).toBeUndefined();
    });
  });

  describe('updateDocumentById', () => {
    it('should return updated document when successful', async () => {
      const mockUpdatedDoc = { _id: '123', name: 'Updated Document' };
      mockSafeDbOperation.mockResolvedValue({ success: true, data: mockUpdatedDoc });

      const updates = { name: 'Updated Document' };
      const result = await updateDocumentById(mockModel, '123', updates);

      expect(result).toEqual(mockUpdatedDoc);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'updateDocumentById',
        { model: 'TestModel', id: '123', updateFields: ['name'] }
      );
    });

    it('should return undefined when document not found', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: undefined });

      const result = await updateDocumentById(mockModel, '123', { name: 'Test' });

      expect(result).toBeUndefined();
    });

    it('should return undefined when operation fails', async () => {
      mockSafeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'VALIDATION_ERROR', message: 'Update failed' } 
      });

      const result = await updateDocumentById(mockModel, '123', { name: 'Test' });

      expect(result).toBeUndefined();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'updateDocumentById is returning undefined due to error'
      );
    });
  });

  describe('deleteDocumentById', () => {
    it('should return true when document deleted successfully', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: true });

      const result = await deleteDocumentById(mockModel, '123');

      expect(result).toBe(true);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'deleteDocumentById',
        { model: 'TestModel', id: '123' }
      );
    });

    it('should return false when document not found', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: false });

      const result = await deleteDocumentById(mockModel, '123');

      expect(result).toBe(false);
    });

    it('should return false when operation fails', async () => {
      mockSafeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'CONNECTION_ERROR', message: 'Database error' } 
      });

      const result = await deleteDocumentById(mockModel, '123');

      expect(result).toBe(false);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'deleteDocumentById is returning false due to error'
      );
    });
  });

  describe('cascadeDeleteDocument', () => {
    it('should execute cascade operations and delete main document', async () => {
      const cascadeOp1 = jest.fn().mockResolvedValue(true);
      const cascadeOp2 = jest.fn().mockResolvedValue(true);
      const cascadeOperations = [cascadeOp1, cascadeOp2];

      safeDbOperation.mockResolvedValue({ success: true, data: true });

      const result = await cascadeDeleteDocument(mockModel, '123', cascadeOperations);

      expect(result).toBe(true);
      expect(cascadeOp1).toHaveBeenCalled();
      expect(cascadeOp2).toHaveBeenCalled();
      expect(safeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'cascadeDeleteDocument',
        { model: 'TestModel', id: '123', cascadeCount: 2 }
      );
    });

    it('should continue with main deletion even if cascade operations fail', async () => {
      const cascadeOp1 = jest.fn().mockRejectedValue(new Error('Cascade failed'));
      const cascadeOp2 = jest.fn().mockResolvedValue(true);
      const cascadeOperations = [cascadeOp1, cascadeOp2];

      safeDbOperation.mockImplementation(async (operation) => {
        const result = await operation();
        return { success: true, data: result };
      });

      mockModel.findByIdAndDelete.mockResolvedValue({ _id: '123' });

      const result = await cascadeDeleteDocument(mockModel, '123', cascadeOperations);

      expect(result).toBe(true);
      expect(cascadeOp1).toHaveBeenCalled();
      expect(cascadeOp2).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[WARN] Cascade operation 1 failed:',
        'Cascade failed'
      );
    });

    it('should work with empty cascade operations array', async () => {
      safeDbOperation.mockResolvedValue({ success: true, data: true });

      const result = await cascadeDeleteDocument(mockModel, '123', []);

      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'cascadeDeleteDocument is running with TestModel model, 123 id, and 0 cascade operations'
      );
    });

    it('should return false when main deletion fails', async () => {
      safeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'CONNECTION_ERROR', message: 'Database error' } 
      });

      const result = await cascadeDeleteDocument(mockModel, '123', []);

      expect(result).toBe(false);
    });
  });

  describe('createDocument', () => {
    it('should return created document when successful', async () => {
      const mockCreatedDoc = { _id: '123', name: 'New Document' };
      safeDbOperation.mockResolvedValue({ success: true, data: mockCreatedDoc });

      const data = { name: 'New Document' };
      const result = await createDocument(mockModel, data);

      expect(result).toEqual(mockCreatedDoc);
      expect(safeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'createDocument',
        { model: 'TestModel', dataFields: ['name'] }
      );
    });

    it('should throw error when creation fails', async () => {
      const errorResponse = {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 400
        }
      };
      safeDbOperation.mockResolvedValue(errorResponse);

      const data = { name: '' }; // Invalid data
      
      await expect(createDocument(mockModel, data)).rejects.toThrow('Validation failed');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'createDocument is throwing error due to failure'
      );
    });

    it('should preserve error properties when throwing', async () => {
      const errorResponse = {
        success: false,
        error: {
          type: 'DUPLICATE_KEY_ERROR',
          message: 'Document already exists',
          statusCode: 409
        }
      };
      safeDbOperation.mockResolvedValue(errorResponse);

      try {
        await createDocument(mockModel, { name: 'Duplicate' });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Document already exists');
        expect(error.code).toBe(409);
        expect(error.type).toBe('DUPLICATE_KEY_ERROR');
      }
    });
  });

  describe('findDocuments', () => {
    it('should return array of documents when successful', async () => {
      const mockDocuments = [
        { _id: '1', name: 'Doc 1' },
        { _id: '2', name: 'Doc 2' }
      ];
      safeDbOperation.mockResolvedValue({ success: true, data: mockDocuments });

      const condition = { status: 'active' };
      const result = await findDocuments(mockModel, condition);

      expect(result).toEqual(mockDocuments);
      expect(safeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findDocuments',
        { model: 'TestModel', condition, hasSort: false }
      );
    });

    it('should handle sorting options', async () => {
      const mockDocuments = [{ _id: '1', name: 'Doc 1' }];
      safeDbOperation.mockResolvedValue({ success: true, data: mockDocuments });

      const condition = { status: 'active' };
      const sortOptions = { name: 1 };
      const result = await findDocuments(mockModel, condition, sortOptions);

      expect(result).toEqual(mockDocuments);
      expect(safeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findDocuments',
        { model: 'TestModel', condition, hasSort: true }
      );
    });

    it('should return empty array when operation fails', async () => {
      safeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'CONNECTION_ERROR', message: 'Database error' } 
      });

      const result = await findDocuments(mockModel, { status: 'active' });

      expect(result).toEqual([]);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'findDocuments is returning empty array due to error'
      );
    });
  });

  describe('findOneDocument', () => {
    it('should return document when found successfully', async () => {
      const mockDocument = { _id: '123', name: 'Test Document' };
      safeDbOperation.mockResolvedValue({ success: true, data: mockDocument });

      const condition = { name: 'Test Document' };
      const result = await findOneDocument(mockModel, condition);

      expect(result).toEqual(mockDocument);
      expect(safeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findOneDocument',
        { model: 'TestModel', condition }
      );
    });

    it('should return undefined when document not found', async () => {
      safeDbOperation.mockResolvedValue({ success: true, data: undefined });

      const result = await findOneDocument(mockModel, { name: 'Nonexistent' });

      expect(result).toBeUndefined();
    });

    it('should return undefined when operation fails', async () => {
      safeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'CONNECTION_ERROR', message: 'Database error' } 
      });

      const result = await findOneDocument(mockModel, { name: 'Test' });

      expect(result).toBeUndefined();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'findOneDocument is returning undefined due to error'
      );
    });
  });

  describe('bulkUpdateDocuments', () => {
    it('should return count of successful updates', async () => {
      // Mock successful updates
      safeDbOperation
        .mockResolvedValueOnce({ success: true, data: true })
        .mockResolvedValueOnce({ success: true, data: true })
        .mockResolvedValueOnce({ success: false, data: false });

      const updates = [
        { id: '1', data: { name: 'Updated 1' } },
        { id: '2', data: { name: 'Updated 2' } },
        { id: '3', data: { name: 'Updated 3' } }
      ];

      const result = await bulkUpdateDocuments(mockModel, updates);

      expect(result).toBe(2); // 2 successful updates
      expect(safeDbOperation).toHaveBeenCalledTimes(3);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'bulkUpdateDocuments is returning 2 successful updates'
      );
    });

    it('should handle empty updates array', async () => {
      const result = await bulkUpdateDocuments(mockModel, []);

      expect(result).toBe(0);
      expect(safeDbOperation).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'bulkUpdateDocuments is running with TestModel model and 0 updates'
      );
    });

    it('should continue processing even when individual updates fail', async () => {
      // Mix of successful and failed updates
      safeDbOperation
        .mockResolvedValueOnce({ success: false, error: { message: 'Error 1' } })
        .mockResolvedValueOnce({ success: true, data: true })
        .mockResolvedValueOnce({ success: false, error: { message: 'Error 2' } });

      const updates = [
        { id: '1', data: { name: 'Update 1' } },
        { id: '2', data: { name: 'Update 2' } },
        { id: '3', data: { name: 'Update 3' } }
      ];

      const result = await bulkUpdateDocuments(mockModel, updates);

      expect(result).toBe(1); // Only 1 successful update
      expect(safeDbOperation).toHaveBeenCalledTimes(3);
    });

    it('should track update progress correctly', async () => {
      safeDbOperation
        .mockResolvedValueOnce({ success: true, data: true })
        .mockResolvedValueOnce({ success: true, data: false }) // Document not found
        .mockResolvedValueOnce({ success: true, data: true });

      const updates = [
        { id: '1', data: { name: 'Update 1' } },
        { id: '2', data: { name: 'Update 2' } },
        { id: '3', data: { name: 'Update 3' } }
      ];

      const result = await bulkUpdateDocuments(mockModel, updates);

      expect(result).toBe(2); // 2 successful updates (middle one returned false)
    });
  });

  describe('Integration with safeDbOperation', () => {
    it('should pass correct parameters to safeDbOperation', async () => {
      safeDbOperation.mockResolvedValue({ success: true, data: { _id: '123' } });

      await findDocumentById(mockModel, '123');

      const [operation, operationName, context] = safeDbOperation.mock.calls[0];
      
      expect(typeof operation).toBe('function');
      expect(operationName).toBe('findDocumentById');
      expect(context).toEqual({ model: 'TestModel', id: '123' });
    });

    it('should handle safeDbOperation errors gracefully', async () => {
      const error = new Error('Unexpected error');
      safeDbOperation.mockRejectedValue(error);

      // Should not throw, but handle gracefully
      const result = await findDocumentById(mockModel, '123');
      
      expect(result).toBeUndefined();
    });
  });
});