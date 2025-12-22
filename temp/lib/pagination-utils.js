/**
 * Pagination Utilities
 * Standardized pagination parameter validation and response formatting
 *
 * This module provides comprehensive pagination functionality that integrates
 * seamlessly with the existing HTTP utilities and maintains consistency with
 * the library's design patterns. It handles parameter validation, database
 * query preparation, and response metadata generation.
 *
 * Design rationale:
 * - Consistent pagination behavior across all endpoints that handle large datasets
 * - Standardized error responses using existing HTTP utility patterns
 * - Centralized parameter validation and calculation to reduce code duplication
 * - RESTful pagination conventions with 1-based page numbering for user-friendly URLs
 * - 0-based skip calculations optimized for database queries
 *
 * Benefits:
 * 1. Uniform pagination behavior across the entire API surface
 * 2. Reduced controller complexity through centralized validation logic
 * 3. Consistent error messaging and HTTP status codes
 * 4. Performance optimization through proper database query parameters
 * 5. Client-friendly metadata for building navigation controls
 *
 * Integration with existing utilities:
 * - Uses existing HTTP utilities (sendInternalServerError) for consistent error handling
 * - Follows the same logging patterns as other modules for debugging consistency
 * - Maintains the same parameter validation approach used throughout the library
 */
// Import existing HTTP utilities to maintain consistency with library patterns
import {
  sendInternalServerError,
  validateExpressResponse,
  sendErrorResponse,
} from './http-utils.js';
import { logFunctionEntry } from './logging-utils.js';
import localVars from '../../config/localVars.js';
const parseIntegerParam = (paramValue, paramName) => {
  const paramStr = String(paramValue).trim();
  const paramNum = parseInt(paramStr, 10);
  // Check if input is a valid integer string (no decimals, no non-numeric chars)
  if (isNaN(paramNum) || paramStr.includes('.') || !/^\d+$/.test(paramStr)) {
    return {
      isValid: false,
      value: null,
      error: `${paramName} must be a positive integer starting from 1`,
    };
  }
  // Check if the parsed number is positive (>= 1)
  if (paramNum < 1) {
    return {
      isValid: false,
      value: null,
      error: `${paramName} must be a positive integer starting from 1`,
    };
  }
  return { isValid: true, value: paramNum, error: null };
};
/**
 * Validates and extracts pagination parameters from request query string
 *
 * This function implements comprehensive pagination parameter validation following
 * the same defensive programming patterns used throughout the library. It handles
 * parameter extraction, type conversion, range validation, and automatic error
 * response generation when validation fails.
 *
 * Validation rules applied:
 * - Page must be a positive integer starting from 1 (user-friendly numbering)
 * - Limit must be a positive integer starting from 1 (prevents empty pages)
 * - Both parameters have sensible defaults when not provided by client
 * - Maximum limit enforced to prevent resource exhaustion attacks
 * - Invalid parameters trigger immediate HTTP error responses
 *
 * Design decisions:
 * - Returns null on validation failure after sending error response
 * - Uses parseInt() with fallback to defaults for robust parameter handling
 * - Calculates skip offset automatically for database query optimization
 * - Provides detailed error messages for better API developer experience
 * - Follows existing library pattern of direct HTTP response on validation failure
 *
 * Performance considerations:
 * - Validation is O(1) and very fast for all input types
 * - Skip calculation prevents database from scanning unwanted records
 * - Early return on validation failure prevents unnecessary processing
 *
 * @param req - Express request object containing pagination query parameters
 * @param res - Express response object for sending validation error responses
 * @param options - Configuration options for pagination behavior
 * @param options.defaultPage - Default page number when not specified (default: 1)
 * @param options.defaultLimit - Default records per page when not specified (default: 50)
 * @param options.maxLimit - Maximum allowed records per page (default: 100)
 * @returns Pagination parameters object with page, limit, skip, or null if validation fails
 */
function validatePagination(req, res, options = {}) {
  // Validate Express response object using shared utility
  validateExpressResponse(res);
  // Validate request object
  if (!req) {
    throw new Error('Invalid Express request object provided');
  }
  logFunctionEntry('validatePagination', { query: req.query });
  try {
    // Set default configuration values with reasonable limits
    // These defaults balance usability with performance considerations
    const {
      defaultPage = localVars.DEFAULT_PAGINATION_PAGE, // Start with first page for intuitive user experience
      defaultLimit = localVars.DEFAULT_PAGINATION_LIMIT, // 50 records balances performance with usability
      maxLimit = localVars.DEFAULT_PAGINATION_MAX_LIMIT, // Prevent resource exhaustion while allowing flexibility
    } = options;
    // Ensure query object exists to prevent property access errors
    // Defensive programming prevents crashes when query is undefined
    req.query = req.query || {};
    // Extract and convert pagination parameters with proper validation
    // Handle string inputs and check for valid numeric values
    let page = defaultPage;
    let limit = defaultLimit;
    // Parse page parameter if provided - validate for proper integer format
    if (req.query.page !== undefined) {
      const pageResult = parseIntegerParam(req.query.page, 'Page');
      if (!pageResult.isValid) {
        console.log(`validatePagination is returning null due to invalid page: ${req.query.page}`);
        sendErrorResponse(res, 400, pageResult.error);
        return null;
      }
      page = pageResult.value;
    }
    // Parse limit parameter if provided - validate for proper integer format
    if (req.query.limit !== undefined) {
      const limitResult = parseIntegerParam(req.query.limit, 'Limit');
      if (!limitResult.isValid) {
        console.log(
          `validatePagination is returning null due to invalid limit: ${req.query.limit}`
        );
        sendErrorResponse(res, 400, limitResult.error);
        return null;
      }
      limit = limitResult.value;
    }
    // Validate page parameter using same validation pattern as other library modules
    // Page must be positive integer starting from 1 for user-friendly URLs
    if (page < 1 || !Number.isInteger(page)) {
      console.log(`validatePagination is returning null due to invalid page: ${page}`);
      sendErrorResponse(res, 400, 'Page must be a positive integer starting from 1');
      return null;
    }
    // Validate limit parameter to prevent invalid page sizes
    // Limit must be positive integer starting from 1 to ensure meaningful results
    if (limit < 1 || !Number.isInteger(limit)) {
      console.log(`validatePagination is returning null due to invalid limit: ${limit}`);
      sendErrorResponse(res, 400, 'Limit must be a positive integer starting from 1');
      return null;
    }
    // Enforce maximum limit to prevent resource exhaustion and maintain performance
    // This protects against both accidental and malicious large page size requests
    if (limit > maxLimit) {
      console.log(
        `validatePagination is returning null due to limit exceeding maximum: ${limit} > ${maxLimit}`
      );
      sendErrorResponse(res, 400, `Limit cannot exceed ${maxLimit} records per page`);
      return null;
    }
    // Calculate database skip offset for efficient query performance
    // Convert 1-based page numbering to 0-based database offset
    const skip = (page - 1) * limit;
    // Return validated pagination parameters ready for database queries
    const pagination = { page, limit, skip };
    console.log(`validatePagination is returning: ${JSON.stringify(pagination)}`);
    return pagination;
  } catch (error) {
    // Handle unexpected errors using existing HTTP utility for consistency
    // This maintains the same error handling patterns used throughout the library
    console.error('Pagination validation error:', error);
    sendInternalServerError(res, 'Internal server error during pagination validation');
    return null;
  }
}
/**
 * Creates comprehensive pagination metadata for API responses
 *
 * This function generates standardized pagination metadata that enables clients
 * to build navigation controls and understand the complete dataset context.
 * The metadata follows common pagination patterns used in REST APIs.
 *
 * Design rationale:
 * - Provides all information needed for client-side navigation implementation
 * - Calculates derived values (totalPages, hasNext/PrevPage) to reduce client complexity
 * - Includes both boolean flags and specific page numbers for flexible client usage
 * - Follows naming conventions that are intuitive for API consumers
 * - Enables clients to display "Page X of Y" style navigation
 *
 * Metadata structure optimized for common use cases:
 * - Navigation buttons (previous/next with enabled/disabled states)
 * - Page number displays with current page highlighting
 * - Result count displays ("Showing X-Y of Z results")
 * - Jump-to-page functionality with total page validation
 *
 * Performance characteristics:
 * - All calculations are O(1) operations using basic arithmetic
 * - Metadata generation is very fast regardless of dataset size
 * - Values are computed once and cached in the response object
 *
 * @param page - Current page number (1-based)
 * @param limit - Number of records per page
 * @param totalRecords - Total number of records in the complete dataset
 * @returns Comprehensive pagination metadata object for API responses
 */
function createPaginationMeta(page, limit, totalRecords) {
  // Calculate total pages with proper ceiling division to handle partial pages
  // Math.ceil ensures that any remainder creates an additional page
  const totalPages = Math.ceil(totalRecords / limit);
  // Calculate navigation state flags for client-side button state management
  // These boolean flags simplify client logic for enabling/disabling navigation
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  // Return comprehensive metadata object with all navigation information
  // Structure designed for easy consumption by various client implementations
  return {
    currentPage: page, // Current page for highlighting in navigation
    totalPages, // Total pages for "X of Y" displays
    totalRecords, // Total records for result count displays
    recordsPerPage: limit, // Records per page for consistency validation
    hasNextPage, // Boolean flag for next button state
    hasPrevPage, // Boolean flag for previous button state
    nextPage: hasNextPage ? page + 1 : null, // Next page number or null for conditional rendering
    prevPage: hasPrevPage ? page - 1 : null, // Previous page number or null for conditional rendering
  };
}
/**
 * Creates a paginated response object with data and metadata
 *
 * This function combines query results with pagination metadata to create
 * standardized API responses that include both the requested data and all
 * navigation information needed by clients.
 *
 * Design rationale:
 * - Provides consistent response structure across all paginated endpoints
 * - Combines data and metadata in a single response to reduce client requests
 * - Follows common API patterns that clients expect for paginated data
 * - Enables clients to implement rich navigation experiences
 *
 * Response structure considerations:
 * - Data array contains the actual results for the current page
 * - Pagination object contains all navigation metadata
 * - Structure is optimized for JSON serialization and client consumption
 *
 * @param data - Array of records for the current page
 * @param page - Current page number
 * @param limit - Records per page
 * @param totalRecords - Total records in complete dataset
 * @returns Complete paginated response with data and metadata
 */
function createPaginatedResponse(data, page, limit, totalRecords) {
  return {
    data, // Current page results
    pagination: createPaginationMeta(page, limit, totalRecords), // Navigation metadata
    timestamp: new Date().toISOString(), // Response timestamp for consistency
  };
}
/**
 * Validates and extracts cursor-based pagination parameters from request query
 *
 * Cursor-based pagination provides better performance for large datasets and prevents
 * pagination drift when data is being modified. This approach uses stable unique
 * identifiers as cursors rather than numeric offsets.
 *
 * Design benefits:
 * - Consistent results even when data is added/removed during pagination
 * - Better performance for large datasets (no OFFSET scanning required)
 * - Supports real-time data without pagination drift issues
 * - Natural ordering preservation for time-series or sorted data
 *
 * Cursor format expectations:
 * - Encoded cursor strings containing sort field values and unique identifiers
 * - Base64 encoded JSON for tamper resistance and URL safety
 * - Graceful fallback to first page when cursor is invalid
 *
 * @param req - Express request object containing cursor parameters
 * @param res - Express response object for sending error responses
 * @param options - Configuration options for cursor pagination
 * @param options.defaultLimit - Default page size (default: 50)
 * @param options.maxLimit - Maximum allowed page size (default: 100)
 * @param options.defaultSort - Default sort field (default: 'id')
 * @returns Cursor pagination object or null if validation fails
 */
function validateCursorPagination(req, res, options = {}) {
  logFunctionEntry('validateCursorPagination', { query: req.query });
  // Validate Express response object using shared utility
  validateExpressResponse(res);
  // Validate request object
  if (!req) {
    throw new Error('Invalid Express request object provided');
  }
  try {
    // Set default configuration values for cursor pagination
    const {
      defaultLimit = localVars.DEFAULT_CURSOR_PAGINATION_LIMIT,
      maxLimit = localVars.DEFAULT_CURSOR_PAGINATION_MAX_LIMIT,
      defaultSort = localVars.DEFAULT_CURSOR_PAGINATION_SORT,
    } = options;
    // Ensure query object exists to prevent property access errors
    req.query = req.query || {};
    // Extract cursor pagination parameters
    let limit = defaultLimit;
    const cursor = req.query.cursor || null;
    const direction = req.query.direction || 'next'; // 'next' or 'prev'
    const sort = req.query.sort || defaultSort;
    // Parse limit parameter if provided
    if (req.query.limit !== undefined) {
      const limitResult = parseIntegerParam(req.query.limit, 'Limit');
      if (!limitResult.isValid) {
        console.log(
          `validateCursorPagination is returning null due to invalid limit: ${req.query.limit}`
        );
        sendErrorResponse(res, 400, limitResult.error);
        return null;
      }
      limit = limitResult.value;
    }
    // Validate limit parameter range
    if (limit < 1 || !Number.isInteger(limit)) {
      console.log(`validateCursorPagination is returning null due to invalid limit: ${limit}`);
      sendErrorResponse(res, 400, 'Limit must be a positive integer starting from 1');
      return null;
    }
    // Enforce maximum limit to prevent resource exhaustion
    if (limit > maxLimit) {
      console.log(
        `validateCursorPagination is returning null due to limit exceeding maximum: ${limit} > ${maxLimit}`
      );
      sendErrorResponse(res, 400, `Limit cannot exceed ${maxLimit} records per page`);
      return null;
    }
    // Validate direction parameter
    if (!['next', 'prev'].includes(direction)) {
      console.log(
        `validateCursorPagination is returning null due to invalid direction: ${direction}`
      );
      sendErrorResponse(res, 400, 'Direction must be either "next" or "prev"');
      return null;
    }
    // Parse cursor if provided
    let decodedCursor = null;
    if (cursor) {
      try {
        const cursorJson = Buffer.from(cursor, 'base64').toString('utf-8');
        decodedCursor = JSON.parse(cursorJson);
        console.log(`validateCursorPagination decoded cursor:`, decodedCursor);
      } catch (error) {
        console.log(
          `validateCursorPagination is returning null due to invalid cursor: ${error.message}`
        );
        sendErrorResponse(res, 400, 'Invalid cursor format');
        return null;
      }
    }
    const pagination = {
      limit,
      cursor: decodedCursor,
      direction: direction,
      sort,
      rawCursor: cursor,
    };
    console.log(`validateCursorPagination is returning: ${JSON.stringify(pagination)}`);
    return pagination;
  } catch (error) {
    console.error('Cursor pagination validation error:', error);
    sendInternalServerError(res, 'Internal server error during cursor pagination validation');
    return null;
  }
}
/**
 * Creates encoded cursor for cursor-based pagination
 *
 * Generates a tamper-resistant, URL-safe cursor that encodes the position
 * information needed to continue pagination from a specific point in the dataset.
 *
 * Cursor encoding strategy:
 * - Includes sort field value and unique identifier for stable positioning
 * - Base64 encoding for URL safety and basic tamper resistance
 * - JSON structure for flexibility with multiple sort fields
 * - Compact format to minimize URL length impact
 *
 * @param record - The record to create a cursor from
 * @param sortField - Field name used for sorting
 * @returns Base64 encoded cursor string
 */
function createCursor(record, sortField = 'id') {
  if (!record) return null;
  const cursorData = {
    [sortField]: record[sortField],
    id: record.id || record._id, // Support both SQL and MongoDB style IDs
    timestamp: new Date().toISOString(),
  };
  const cursorJson = JSON.stringify(cursorData);
  const encodedCursor = Buffer.from(cursorJson, 'utf-8').toString('base64');
  console.log(
    `createCursor generated cursor for ${sortField}=${record[sortField]}: ${encodedCursor}`
  );
  return encodedCursor;
}
/**
 * Creates cursor-based pagination metadata for API responses
 *
 * Generates comprehensive pagination metadata for cursor-based pagination that
 * includes navigation cursors and page context information. This metadata enables
 * clients to implement forward/backward navigation and understand their position
 * in the dataset.
 *
 * @param data - Current page of records
 * @param pagination - Pagination parameters used for the query
 * @param hasMore - Whether more records exist in the requested direction
 * @param sortField - Field used for sorting and cursor generation
 * @returns Cursor pagination metadata object
 */
function createCursorPaginationMeta(data, pagination, hasMore, sortField = 'id') {
  const meta = {
    limit: pagination.limit,
    direction: pagination.direction,
    sort: pagination.sort,
    hasMore,
    cursors: {},
  };
  // Generate cursors for navigation if data exists
  if (data && data.length > 0) {
    if (pagination.direction === 'next') {
      meta.cursors.next = hasMore ? createCursor(data[data.length - 1], sortField) : null;
      meta.cursors.prev = createCursor(data[0], sortField);
    } else {
      meta.cursors.next = createCursor(data[data.length - 1], sortField);
      meta.cursors.prev = hasMore ? createCursor(data[0], sortField) : null;
    }
  }
  // Add current cursor for reference
  if (pagination.rawCursor) {
    meta.cursors.current = pagination.rawCursor;
  }
  console.log(`createCursorPaginationMeta generated metadata:`, meta);
  return meta;
}
/**
 * Validates and extracts sorting parameters from request query
 *
 * Provides standardized sorting parameter validation that integrates with both
 * offset-based and cursor-based pagination. Supports multiple sort fields with
 * direction specification and validates against allowed fields for security.
 *
 * Sorting parameter format:
 * - Single field: ?sort=name or ?sort=-name (descending)
 * - Multiple fields: ?sort=name,-createdAt,id
 * - Direction indicators: + for ascending (default), - for descending
 *
 * Security considerations:
 * - Validates sort fields against allowlist to prevent injection attacks
 * - Sanitizes field names to prevent NoSQL injection
 * - Limits number of sort fields to prevent performance issues
 *
 * @param req - Express request object containing sort parameters
 * @param res - Express response object for sending error responses
 * @param options - Configuration options for sorting validation
 * @param options.allowedFields - List of fields that can be sorted (required)
 * @param options.defaultSort - Default sort field and direction
 * @param options.maxSortFields - Maximum number of sort fields allowed
 * @returns Sort configuration object or null if validation fails
 */
function validateSorting(req, res, options = {}) {
  logFunctionEntry('validateSorting', { query: req.query });
  // Validate Express response object using shared utility
  validateExpressResponse(res);
  // Validate request object
  if (!req) {
    throw new Error('Invalid Express request object provided');
  }
  try {
    const {
      allowedFields = [],
      defaultSort = localVars.DEFAULT_CURSOR_PAGINATION_SORT,
      maxSortFields = localVars.DEFAULT_MAX_SORT_FIELDS,
    } = options;
    // Validate that allowed fields are provided
    if (!Array.isArray(allowedFields) || allowedFields.length === 0) {
      throw new Error('allowedFields must be provided and cannot be empty');
    }
    req.query = req.query || {};
    // Extract sort parameter
    const sortParam = req.query.sort || defaultSort;
    // Parse sort fields and directions
    const sortFields = sortParam
      .split(',')
      .map(field => field.trim())
      .filter(Boolean);
    // Validate number of sort fields
    if (sortFields.length > maxSortFields) {
      console.log(
        `validateSorting is returning null due to too many sort fields: ${sortFields.length} > ${maxSortFields}`
      );
      sendErrorResponse(res, 400, `Cannot sort by more than ${maxSortFields} fields`);
      return null;
    }
    // Parse and validate each sort field
    const sortConfig = [];
    for (const fieldSpec of sortFields) {
      const direction = fieldSpec.startsWith('-') ? 'desc' : 'asc';
      const fieldName = fieldSpec.replace(/^[+-]/, '');
      // Validate field name format (alphanumeric and underscore only)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
        console.log(`validateSorting is returning null due to invalid field format: ${fieldName}`);
        sendErrorResponse(res, 400, `Invalid field name format: ${fieldName}`);
        return null;
      }
      // Validate field name against allowlist
      if (!allowedFields.includes(fieldName)) {
        console.log(`validateSorting is returning null due to invalid field: ${fieldName}`);
        sendErrorResponse(
          res,
          400,
          `Invalid sort field: ${fieldName}. Allowed fields: ${allowedFields.join(', ')}`
        );
        return null;
      }
      sortConfig.push({ field: fieldName, direction });
    }
    const result = {
      sortConfig,
      sortString: sortParam,
      primarySort: sortConfig[0], // First sort field for cursor pagination
    };
    console.log(`validateSorting is returning: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.error('Sorting validation error:', error);
    sendInternalServerError(res, 'Internal server error during sorting validation');
    return null;
  }
}
/**
 * Creates complete cursor-based paginated response
 *
 * Combines data with cursor pagination metadata to create a standardized response
 * structure that enables efficient navigation through large datasets without the
 * performance issues of offset-based pagination.
 *
 * @param data - Array of records for the current page
 * @param pagination - Pagination parameters used for the query
 * @param hasMore - Whether more records exist in the requested direction
 * @param sortField - Field used for sorting and cursor generation
 * @returns Complete cursor-based paginated response
 */
function createCursorPaginatedResponse(data, pagination, hasMore, sortField = 'id') {
  return {
    data,
    pagination: createCursorPaginationMeta(data, pagination, hasMore, sortField),
    timestamp: new Date().toISOString(),
  };
}
// Export pagination utilities using consistent module pattern
// This follows the same export structure used throughout the library
export {
  validatePagination, // Parameter validation and extraction
  createPaginationMeta, // Metadata generation for responses
  createPaginatedResponse, // Complete response structure creation
  validateCursorPagination, // Cursor-based pagination validation
  createCursor, // Cursor encoding for navigation
  createCursorPaginationMeta, // Cursor pagination metadata
  createCursorPaginatedResponse, // Complete cursor response structure
  validateSorting, // Sorting parameter validation
};
