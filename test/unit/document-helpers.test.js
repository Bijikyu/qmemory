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

// Mock the database utilities module BEFORE importing document helpers
const mockSafeDbOperation = jest.fn();
jest.mock('../../lib/database-utils', () => ({
  safeDbOperation: mockSafeDbOperation,
  handleMongoError: jest.fn()
}));

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

describe('Document Helpers', () => {
  let mockModel;
  let consoleSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockSafeDbOperation.mockClear();
    
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
    });

    it('should return undefined when operation fails', async () => {
      mockSafeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'VALIDATION_ERROR', message: 'Invalid ID' } 
      });

      const result = await findDocumentById(mockModel, 'invalid-id');

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
    });
  });

  describe('cascadeDeleteDocument', () => {
    it('should execute cascade operations and delete main document', async () => {
      const cascadeOp1 = jest.fn().mockResolvedValue(true);
      const cascadeOp2 = jest.fn().mockResolvedValue(true);
      const cascadeOperations = [cascadeOp1, cascadeOp2];

      mockSafeDbOperation.mockResolvedValue({ success: true, data: true });

      const result = await cascadeDeleteDocument(mockModel, '123', cascadeOperations);

      expect(result).toBe(true);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'cascadeDeleteDocument',
        { model: 'TestModel', id: '123', cascadeCount: 2 }
      );
    });

    it('should continue with main deletion even if cascade operations fail', async () => {
      const cascadeOp1 = jest.fn().mockRejectedValue(new Error('Cascade failed'));
      const cascadeOp2 = jest.fn().mockResolvedValue(true);
      const cascadeOperations = [cascadeOp1, cascadeOp2];

      mockSafeDbOperation.mockImplementation(async (operation) => {
        const result = await operation();
        return { success: true, data: result };
      });

      mockModel.findByIdAndDelete.mockResolvedValue({ _id: '123' });

      const result = await cascadeDeleteDocument(mockModel, '123', cascadeOperations);

      expect(result).toBe(true);
      expect(cascadeOp1).toHaveBeenCalled();
      expect(cascadeOp2).toHaveBeenCalled();
    });

    it('should work with empty cascade operations array', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: true });

      const result = await cascadeDeleteDocument(mockModel, '123', []);

      expect(result).toBe(true);
    });
  });

  describe('createDocument', () => {
    it('should return created document when successful', async () => {
      const mockCreatedDoc = { _id: '123', name: 'New Document' };
      mockSafeDbOperation.mockResolvedValue({ success: true, data: mockCreatedDoc });

      const data = { name: 'New Document' };
      const result = await createDocument(mockModel, data);

      expect(result).toEqual(mockCreatedDoc);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
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
      mockSafeDbOperation.mockResolvedValue(errorResponse);

      const data = { name: '' }; // Invalid data
      
      await expect(createDocument(mockModel, data)).rejects.toThrow('Validation failed');
    });
  });

  describe('findDocuments', () => {
    it('should return array of documents when successful', async () => {
      const mockDocuments = [
        { _id: '1', name: 'Doc 1' },
        { _id: '2', name: 'Doc 2' }
      ];
      mockSafeDbOperation.mockResolvedValue({ success: true, data: mockDocuments });

      const condition = { status: 'active' };
      const result = await findDocuments(mockModel, condition);

      expect(result).toEqual(mockDocuments);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findDocuments',
        { model: 'TestModel', condition, hasSort: false }
      );
    });

    it('should handle sorting options', async () => {
      const mockDocuments = [{ _id: '1', name: 'Doc 1' }];
      mockSafeDbOperation.mockResolvedValue({ success: true, data: mockDocuments });

      const condition = { status: 'active' };
      const sortOptions = { name: 1 };
      const result = await findDocuments(mockModel, condition, sortOptions);

      expect(result).toEqual(mockDocuments);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findDocuments',
        { model: 'TestModel', condition, hasSort: true }
      );
    });

    it('should return empty array when operation fails', async () => {
      mockSafeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'CONNECTION_ERROR', message: 'Database error' } 
      });

      const result = await findDocuments(mockModel, { status: 'active' });

      expect(result).toEqual([]);
    });
  });

  describe('findOneDocument', () => {
    it('should return document when found successfully', async () => {
      const mockDocument = { _id: '123', name: 'Test Document' };
      mockSafeDbOperation.mockResolvedValue({ success: true, data: mockDocument });

      const condition = { name: 'Test Document' };
      const result = await findOneDocument(mockModel, condition);

      expect(result).toEqual(mockDocument);
      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findOneDocument',
        { model: 'TestModel', condition }
      );
    });

    it('should return undefined when document not found', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: undefined });

      const result = await findOneDocument(mockModel, { name: 'Nonexistent' });

      expect(result).toBeUndefined();
    });

    it('should return undefined when operation fails', async () => {
      mockSafeDbOperation.mockResolvedValue({ 
        success: false, 
        error: { type: 'CONNECTION_ERROR', message: 'Database error' } 
      });

      const result = await findOneDocument(mockModel, { name: 'Test' });

      expect(result).toBeUndefined();
    });
  });

  describe('bulkUpdateDocuments', () => {
    it('should return count of successful updates', async () => {
      // Mock successful updates
      mockSafeDbOperation
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
      expect(mockSafeDbOperation).toHaveBeenCalledTimes(3);
    });

    it('should handle empty updates array', async () => {
      const result = await bulkUpdateDocuments(mockModel, []);

      expect(result).toBe(0);
      expect(mockSafeDbOperation).not.toHaveBeenCalled();
    });

    it('should continue processing even when individual updates fail', async () => {
      // Mix of successful and failed updates
      mockSafeDbOperation
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
      expect(mockSafeDbOperation).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with safeDbOperation', () => {
    it('should pass correct parameters to safeDbOperation', async () => {
      mockSafeDbOperation.mockResolvedValue({ success: true, data: { _id: '123' } });

      await findDocumentById(mockModel, '123');

      expect(mockSafeDbOperation).toHaveBeenCalledWith(
        expect.any(Function),
        'findDocumentById',
        { model: 'TestModel', id: '123' }
      );
    });

    it('should handle safeDbOperation errors gracefully', async () => {
      mockSafeDbOperation.mockRejectedValue(new Error('Unexpected error'));

      // Should not throw, but handle gracefully
      try {
        const result = await findDocumentById(mockModel, '123');
        expect(result).toBeUndefined();
      } catch (error) {
        // Document helpers should handle errors gracefully and not throw
        expect(error).toBeUndefined();
      }
    });
  });
});