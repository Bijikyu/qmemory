/**
 * Pagination Utilities Test Suite
 * Comprehensive tests for pagination parameter validation and response formatting
 * 
 * This test suite validates all aspects of the pagination utilities including
 * parameter validation, error handling, metadata generation, and integration
 * with existing HTTP utilities. Tests cover both normal operation and edge cases.
 */

const {
  validatePagination,
  createPaginationMeta,
  createPaginatedResponse,
  validateCursorPagination,
  createCursor,
  createCursorPaginationMeta,
  createCursorPaginatedResponse,
  validateSorting
} = require('../../lib/pagination-utils');

describe('Pagination Utilities', () => {
  // Mock Express response object for testing HTTP interactions
  let mockRes;

  beforeEach(() => {
    // Create fresh mock response object for each test
    // Matches the pattern used in other HTTP utility tests
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('validatePagination', () => {
    test('should return valid pagination object with default values', () => { // basic functionality test
      const mockReq = { query: {} };
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result).toEqual({
        page: 1,
        limit: 50,
        skip: 0
      });
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should return valid pagination object with custom values', () => { // custom parameter handling
      const mockReq = { query: { page: '3', limit: '25' } };
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result).toEqual({
        page: 3,
        limit: 25,
        skip: 50 // (3-1) * 25
      });
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('should use custom default options', () => { // options configuration test
      const mockReq = { query: {} };
      const options = {
        defaultPage: 2,
        defaultLimit: 100,
        maxLimit: 200
      };
      
      const result = validatePagination(mockReq, mockRes, options);
      
      expect(result).toEqual({
        page: 2,
        limit: 100,
        skip: 100 // (2-1) * 100
      });
    });

    test('should handle undefined query object gracefully', () => { // defensive programming test
      const mockReq = {};
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result).toEqual({
        page: 1,
        limit: 50,
        skip: 0
      });
      expect(mockReq.query).toEqual({}); // Should create empty query object
    });

    test('should reject invalid page values', () => { // page validation tests
      const testCases = [
        { page: '0', expected: 'Page must be a positive integer starting from 1' },
        { page: '-1', expected: 'Page must be a positive integer starting from 1' },
        { page: '1.5', expected: 'Page must be a positive integer starting from 1' },
        { page: 'invalid', expected: 'Page must be a positive integer starting from 1' }
      ];

      testCases.forEach(({ page, expected }) => {
        const mockReq = { query: { page } };
        const result = validatePagination(mockReq, mockRes);
        
        expect(result).toBeNull(); // Returns null after sending error response
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: expected,
          timestamp: expect.any(String)
        });
        
        // Reset mocks for next iteration
        mockRes.status.mockClear();
        mockRes.json.mockClear();
      });
    });

    test('should reject invalid limit values', () => { // limit validation tests
      const testCases = [
        { limit: '0', expected: 'Limit must be a positive integer starting from 1' },
        { limit: '-5', expected: 'Limit must be a positive integer starting from 1' },
        { limit: '2.7', expected: 'Limit must be a positive integer starting from 1' },
        { limit: 'bad', expected: 'Limit must be a positive integer starting from 1' }
      ];

      testCases.forEach(({ limit, expected }) => {
        const mockReq = { query: { limit } };
        const result = validatePagination(mockReq, mockRes);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: expected,
          timestamp: expect.any(String)
        });
        
        mockRes.status.mockClear();
        mockRes.json.mockClear();
      });
    });

    test('should enforce maximum limit', () => { // resource exhaustion prevention
      const mockReq = { query: { limit: '150' } }; // Exceeds default max of 100
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result).toBeNull();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Limit cannot exceed 100 records per page',
        timestamp: expect.any(String)
      });
    });

    test('should enforce custom maximum limit', () => { // custom max limit test
      const mockReq = { query: { limit: '250' } };
      const options = { maxLimit: 200 };
      
      const result = validatePagination(mockReq, mockRes, options);
      
      expect(result).toBeNull();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Limit cannot exceed 200 records per page',
        timestamp: expect.any(String)
      });
    });

    test('should calculate skip offset correctly for various pages', () => { // skip calculation verification
      const testCases = [
        { page: 1, limit: 10, expectedSkip: 0 },
        { page: 2, limit: 10, expectedSkip: 10 },
        { page: 5, limit: 25, expectedSkip: 100 },
        { page: 10, limit: 5, expectedSkip: 45 }
      ];

      testCases.forEach(({ page, limit, expectedSkip }) => {
        const mockReq = { query: { page: page.toString(), limit: limit.toString() } };
        const result = validatePagination(mockReq, mockRes);
        
        expect(result.skip).toBe(expectedSkip);
      });
    });

    test('should handle internal errors gracefully', () => { // error handling test
      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Create request that will cause an error - invalid response object
      const mockReq = { query: {} };
      const invalidRes = { status: 'not-a-function' }; // Invalid response object
      
      expect(() => {
        validatePagination(mockReq, invalidRes);
      }).toThrow('Invalid Express response object provided');
      
      // Restore console.error
      console.error = originalConsoleError;
    });

    test('should include timestamp in error responses', () => { // timestamp consistency test
      const mockReq = { query: { page: 'invalid' } };
      
      validatePagination(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/) // ISO format
      });
    });
  });

  describe('createPaginationMeta', () => {
    test('should generate correct metadata for first page', () => { // first page scenario
      const result = createPaginationMeta(1, 10, 45);
      
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 5, // Math.ceil(45/10)
        totalRecords: 45,
        recordsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: false,
        nextPage: 2,
        prevPage: null
      });
    });

    test('should generate correct metadata for middle page', () => { // middle page scenario
      const result = createPaginationMeta(3, 10, 45);
      
      expect(result).toEqual({
        currentPage: 3,
        totalPages: 5,
        totalRecords: 45,
        recordsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: true,
        nextPage: 4,
        prevPage: 2
      });
    });

    test('should generate correct metadata for last page', () => { // last page scenario
      const result = createPaginationMeta(5, 10, 45);
      
      expect(result).toEqual({
        currentPage: 5,
        totalPages: 5,
        totalRecords: 45,
        recordsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: true,
        nextPage: null,
        prevPage: 4
      });
    });

    test('should handle single page scenario', () => { // single page edge case
      const result = createPaginationMeta(1, 50, 25);
      
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 25,
        recordsPerPage: 50,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
    });

    test('should handle empty dataset', () => { // empty dataset edge case
      const result = createPaginationMeta(1, 10, 0);
      
      expect(result).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalRecords: 0,
        recordsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
    });

    test('should calculate total pages correctly with various scenarios', () => { // total pages calculation
      const testCases = [
        { limit: 10, total: 100, expected: 10 }, // Exact division
        { limit: 10, total: 105, expected: 11 }, // Remainder requires extra page
        { limit: 25, total: 50, expected: 2 },   // Exact division
        { limit: 25, total: 51, expected: 3 },   // Remainder requires extra page
        { limit: 1, total: 1, expected: 1 }      // Single record
      ];

      testCases.forEach(({ limit, total, expected }) => {
        const result = createPaginationMeta(1, limit, total);
        expect(result.totalPages).toBe(expected);
      });
    });
  });

  describe('createPaginatedResponse', () => {
    test('should create complete paginated response structure', () => { // complete response test
      const data = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      const result = createPaginatedResponse(data, 2, 10, 45);
      
      expect(result).toEqual({
        data,
        pagination: {
          currentPage: 2,
          totalPages: 5,
          totalRecords: 45,
          recordsPerPage: 10,
          hasNextPage: true,
          hasPrevPage: true,
          nextPage: 3,
          prevPage: 1
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      });
    });

    test('should handle empty data array', () => { // empty data handling
      const data = [];
      const result = createPaginatedResponse(data, 1, 10, 0);
      
      expect(result.data).toEqual([]);
      expect(result.pagination.totalRecords).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    test('should include timestamp in response', () => { // timestamp inclusion test
      const data = [{ test: 'data' }];
      const result = createPaginatedResponse(data, 1, 10, 1);
      
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
      // Verify ISO 8601 format
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    test('should preserve data array structure', () => { // data preservation test
      const complexData = [
        { id: 1, nested: { value: 'test' }, array: [1, 2, 3] },
        { id: 2, nested: { value: 'test2' }, array: [4, 5, 6] }
      ];
      
      const result = createPaginatedResponse(complexData, 1, 10, 2);
      
      expect(result.data).toEqual(complexData);
      // Note: createPaginatedResponse passes data directly, so it will be same reference
      expect(result.data).toBe(complexData);
    });
  });

  describe('Integration with existing HTTP utilities', () => {
    test('should follow same error response pattern as existing utilities', () => { // integration consistency test
      const mockReq = { query: { page: 'invalid' } };
      
      validatePagination(mockReq, mockRes);
      
      // Verify it uses same response structure as existing HTTP utils
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: expect.any(String),
        timestamp: expect.any(String)
      });
      
      // Verify timestamp format matches existing utilities
      const call = mockRes.json.mock.calls[0][0];
      expect(call.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    test('should handle response object validation like other utilities', () => { // response validation consistency
      const mockReq = { query: {} };
      const invalidRes = null;
      
      // Should throw error for invalid response object like other HTTP utilities
      expect(() => {
        validatePagination(mockReq, invalidRes);
      }).toThrow();
    });
  });

  describe('Enhanced Pagination Features', () => {
    describe('validateCursorPagination', () => {
      test('should validate cursor pagination with defaults', () => { // basic cursor validation
        const mockReq = { query: {} };
        
        const result = validateCursorPagination(mockReq, mockRes);
        
        expect(result).toEqual({
          limit: 50,
          cursor: null,
          direction: 'next',
          sort: 'id',
          rawCursor: null
        });
      });

      test('should validate cursor pagination with custom parameters', () => { // custom cursor parameters
        const mockReq = { 
          query: { 
            limit: '25', 
            direction: 'prev', 
            sort: 'createdAt' 
          } 
        };
        
        const result = validateCursorPagination(mockReq, mockRes);
        
        expect(result).toEqual({
          limit: 25,
          cursor: null,
          direction: 'prev',
          sort: 'createdAt',
          rawCursor: null
        });
      });

      test('should decode valid cursor', () => { // cursor decoding
        const cursorData = { id: 123, createdAt: '2023-01-01T00:00:00.000Z', timestamp: '2023-01-01T00:00:00.000Z' };
        const encodedCursor = Buffer.from(JSON.stringify(cursorData), 'utf-8').toString('base64');
        
        const mockReq = { query: { cursor: encodedCursor } };
        
        const result = validateCursorPagination(mockReq, mockRes);
        
        expect(result.cursor).toEqual(cursorData);
        expect(result.rawCursor).toBe(encodedCursor);
      });

      test('should reject invalid cursor', () => { // invalid cursor handling
        const mockReq = { query: { cursor: 'invalid-cursor' } };
        
        const result = validateCursorPagination(mockReq, mockRes);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid cursor format',
          timestamp: expect.any(String)
        });
      });

      test('should reject invalid direction', () => { // direction validation
        const mockReq = { query: { direction: 'invalid' } };
        
        const result = validateCursorPagination(mockReq, mockRes);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Direction must be either "next" or "prev"',
          timestamp: expect.any(String)
        });
      });

      test('should enforce maximum limit for cursor pagination', () => { // cursor max limit
        const mockReq = { query: { limit: '200' } };
        
        const result = validateCursorPagination(mockReq, mockRes);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Limit cannot exceed 100 records per page',
          timestamp: expect.any(String)
        });
      });
    });

    describe('createCursor', () => {
      test('should create encoded cursor for record', () => { // cursor creation
        const record = { id: 123, name: 'Test', createdAt: '2023-01-01T00:00:00.000Z' };
        
        const cursor = createCursor(record, 'createdAt');
        
        expect(cursor).toBeDefined();
        expect(typeof cursor).toBe('string');
        
        // Decode and verify cursor content
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        expect(decoded.createdAt).toBe('2023-01-01T00:00:00.000Z');
        expect(decoded.id).toBe(123);
        expect(decoded.timestamp).toBeDefined();
      });

      test('should handle null record', () => { // null record handling
        const cursor = createCursor(null);
        expect(cursor).toBeNull();
      });

      test('should support MongoDB style _id', () => { // MongoDB compatibility
        const record = { _id: '507f1f77bcf86cd799439011', name: 'Test' };
        
        const cursor = createCursor(record);
        
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        expect(decoded.id).toBe('507f1f77bcf86cd799439011');
      });
    });

    describe('createCursorPaginationMeta', () => {
      test('should create cursor metadata for next direction', () => { // next direction metadata
        const data = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ];
        const pagination = { limit: 10, direction: 'next', sort: 'id' };
        
        const meta = createCursorPaginationMeta(data, pagination, true, 'id');
        
        expect(meta.limit).toBe(10);
        expect(meta.direction).toBe('next');
        expect(meta.sort).toBe('id');
        expect(meta.hasMore).toBe(true);
        expect(meta.cursors.next).toBeDefined();
        expect(meta.cursors.prev).toBeDefined();
      });

      test('should create cursor metadata for prev direction', () => { // prev direction metadata
        const data = [
          { id: 3, name: 'Item 3' },
          { id: 4, name: 'Item 4' }
        ];
        const pagination = { limit: 10, direction: 'prev', sort: 'id' };
        
        const meta = createCursorPaginationMeta(data, pagination, true, 'id');
        
        expect(meta.direction).toBe('prev');
        expect(meta.hasMore).toBe(true);
        expect(meta.cursors.next).toBeDefined();
        expect(meta.cursors.prev).toBeDefined();
      });

      test('should handle empty data', () => { // empty data handling
        const pagination = { limit: 10, direction: 'next', sort: 'id' };
        
        const meta = createCursorPaginationMeta([], pagination, false, 'id');
        
        expect(meta.hasMore).toBe(false);
        expect(meta.cursors.next).toBeUndefined();
        expect(meta.cursors.prev).toBeUndefined();
      });
    });

    describe('validateSorting', () => {
      test('should validate single sort field', () => { // single field sorting
        const mockReq = { query: { sort: 'name' } };
        const options = { allowedFields: ['name', 'email', 'createdAt'] };
        
        const result = validateSorting(mockReq, mockRes, options);
        
        expect(result).toEqual({
          sortConfig: [{ field: 'name', direction: 'asc' }],
          sortString: 'name',
          primarySort: { field: 'name', direction: 'asc' }
        });
      });

      test('should validate multiple sort fields', () => { // multiple field sorting
        const mockReq = { query: { sort: 'name,-createdAt,email' } };
        const options = { allowedFields: ['name', 'email', 'createdAt'] };
        
        const result = validateSorting(mockReq, mockRes, options);
        
        expect(result.sortConfig).toEqual([
          { field: 'name', direction: 'asc' },
          { field: 'createdAt', direction: 'desc' },
          { field: 'email', direction: 'asc' }
        ]);
        expect(result.primarySort).toEqual({ field: 'name', direction: 'asc' });
      });

      test('should reject disallowed fields', () => { // field security validation
        const mockReq = { query: { sort: 'password' } };
        const options = { allowedFields: ['name', 'email'] };
        
        const result = validateSorting(mockReq, mockRes, options);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid sort field: password. Allowed fields: name, email',
          timestamp: expect.any(String)
        });
      });

      test('should enforce maximum sort fields', () => { // max fields validation
        const mockReq = { query: { sort: 'name,email,createdAt,updatedAt' } };
        const options = { allowedFields: ['name', 'email', 'createdAt', 'updatedAt'], maxSortFields: 3 };
        
        const result = validateSorting(mockReq, mockRes, options);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Cannot sort by more than 3 fields',
          timestamp: expect.any(String)
        });
      });

      test('should reject invalid field name format', () => { // field format validation
        const mockReq = { query: { sort: 'user.name' } };
        const options = { allowedFields: ['user.name'] };
        
        const result = validateSorting(mockReq, mockRes, options);
        
        expect(result).toBeNull();
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Invalid field name format: user.name',
          timestamp: expect.any(String)
        });
      });

      test('should use default sort when no sort provided', () => { // default sorting
        const mockReq = { query: {} };
        const options = { allowedFields: ['id', 'name', 'createdAt'], defaultSort: '-createdAt' };
        
        const result = validateSorting(mockReq, mockRes, options);
        
        expect(result.sortConfig).toEqual([{ field: 'createdAt', direction: 'desc' }]);
      });

      test('should require allowedFields configuration', () => { // config validation
        const mockReq = { query: { sort: 'name' } };
        
        expect(() => {
          validateSorting(mockReq, mockRes, {});
        }).toThrow('allowedFields must be provided and cannot be empty');
      });
    });

    describe('createCursorPaginatedResponse', () => {
      test('should create complete cursor response', () => { // complete cursor response
        const data = [{ id: 1, name: 'Item 1' }];
        const pagination = { limit: 10, direction: 'next', sort: 'id' };
        
        const response = createCursorPaginatedResponse(data, pagination, true, 'id');
        
        expect(response.data).toEqual(data);
        expect(response.pagination).toBeDefined();
        expect(response.pagination.hasMore).toBe(true);
        expect(response.timestamp).toBeDefined();
      });
    });
  });

  describe('Performance and edge cases', () => {
    test('should handle large page numbers efficiently', () => { // performance with large numbers
      const mockReq = { query: { page: '1000000', limit: '1' } };
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result.skip).toBe(999999); // (1000000-1) * 1
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should handle string numbers correctly', () => { // string number handling
      const mockReq = { query: { page: '007', limit: '025' } };
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result).toEqual({
        page: 7,   // parseInt handles leading zeros
        limit: 25, // parseInt handles leading zeros
        skip: 150  // (7-1) * 25
      });
    });

    test('should handle mixed valid and invalid parameters', () => { // mixed parameter scenarios
      const mockReq = { query: { page: '2', limit: 'invalid' } };
      
      const result = validatePagination(mockReq, mockRes);
      
      expect(result).toBeNull();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Limit must be a positive integer starting from 1',
        timestamp: expect.any(String)
      });
    });
  });
});