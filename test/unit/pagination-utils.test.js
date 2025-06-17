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
  createPaginatedResponse
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