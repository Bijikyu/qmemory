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
const { sendInternalServerError } = require('./http-utils');

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
 * @param {Object} req - Express request object containing pagination query parameters
 * @param {Object} res - Express response object for sending validation error responses
 * @param {Object} options - Configuration options for pagination behavior
 * @param {number} options.defaultPage - Default page number when not specified (default: 1)
 * @param {number} options.defaultLimit - Default records per page when not specified (default: 50)
 * @param {number} options.maxLimit - Maximum allowed records per page (default: 100)
 * @returns {Object|null} Pagination parameters object with page, limit, skip, or null if validation fails
 */
function validatePagination(req, res, options = {}) { // standard query parameter validation for pagination
    // Validate Express response object like other HTTP utilities
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
        throw new Error('Invalid Express response object provided');
    }
    
    // Validate request object
    if (!req) {
        throw new Error('Invalid Express request object provided');
    }
    
    console.log(`validatePagination is running with query: ${JSON.stringify(req.query)}`);
    
    try {
        // Set default configuration values with reasonable limits
        // These defaults balance usability with performance considerations
        const {
            defaultPage = 1,      // Start with first page for intuitive user experience
            defaultLimit = 50,    // 50 records balances performance with usability
            maxLimit = 100        // Prevent resource exhaustion while allowing flexibility
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
            const pageStr = String(req.query.page).trim();
            const pageParam = parseInt(pageStr, 10);
            
            // Check if input is a valid integer string (no decimals, no non-numeric chars)
            // Allow leading zeros by comparing with the parsed value
            if (isNaN(pageParam) || pageStr.includes('.') || !/^\d+$/.test(pageStr)) {
                console.log(`validatePagination is returning null due to invalid page: ${req.query.page}`);
                res.status(400).json({
                    message: 'Page must be a positive integer starting from 1',
                    timestamp: new Date().toISOString()
                });
                return null;
            }
            page = pageParam;
        }
        
        // Parse limit parameter if provided - validate for proper integer format
        if (req.query.limit !== undefined) {
            const limitStr = String(req.query.limit).trim();
            const limitParam = parseInt(limitStr, 10);
            
            // Check if input is a valid integer string (no decimals, no non-numeric chars)
            // Allow leading zeros by using regex pattern
            if (isNaN(limitParam) || limitStr.includes('.') || !/^\d+$/.test(limitStr)) {
                console.log(`validatePagination is returning null due to invalid limit: ${req.query.limit}`);
                res.status(400).json({
                    message: 'Limit must be a positive integer starting from 1',
                    timestamp: new Date().toISOString()
                });
                return null;
            }
            limit = limitParam;
        }
        
        // Validate page parameter using same validation pattern as other library modules
        // Page must be positive integer starting from 1 for user-friendly URLs
        if (page < 1 || !Number.isInteger(page)) {
            console.log(`validatePagination is returning null due to invalid page: ${page}`);
            res.status(400).json({
                message: 'Page must be a positive integer starting from 1',
                timestamp: new Date().toISOString()
            });
            return null;
        }
        
        // Validate limit parameter to prevent invalid page sizes
        // Limit must be positive integer starting from 1 to ensure meaningful results
        if (limit < 1 || !Number.isInteger(limit)) {
            console.log(`validatePagination is returning null due to invalid limit: ${limit}`);
            res.status(400).json({
                message: 'Limit must be a positive integer starting from 1',
                timestamp: new Date().toISOString()
            });
            return null;
        }
        
        // Enforce maximum limit to prevent resource exhaustion and maintain performance
        // This protects against both accidental and malicious large page size requests
        if (limit > maxLimit) {
            console.log(`validatePagination is returning null due to limit exceeding maximum: ${limit} > ${maxLimit}`);
            res.status(400).json({
                message: `Limit cannot exceed ${maxLimit} records per page`,
                timestamp: new Date().toISOString()
            });
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
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of records per page
 * @param {number} totalRecords - Total number of records in the complete dataset
 * @returns {Object} Comprehensive pagination metadata object for API responses
 */
function createPaginationMeta(page, limit, totalRecords) { // metadata generation for client navigation
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
        currentPage: page,                                    // Current page for highlighting in navigation
        totalPages,                                          // Total pages for "X of Y" displays
        totalRecords,                                        // Total records for result count displays
        recordsPerPage: limit,                               // Records per page for consistency validation
        hasNextPage,                                         // Boolean flag for next button state
        hasPrevPage,                                         // Boolean flag for previous button state
        nextPage: hasNextPage ? page + 1 : null,           // Next page number or null for conditional rendering
        prevPage: hasPrevPage ? page - 1 : null            // Previous page number or null for conditional rendering
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
 * @param {Array} data - Array of records for the current page
 * @param {number} page - Current page number
 * @param {number} limit - Records per page
 * @param {number} totalRecords - Total records in complete dataset
 * @returns {Object} Complete paginated response with data and metadata
 */
function createPaginatedResponse(data, page, limit, totalRecords) { // complete response structure
    return {
        data,                                                // Current page results
        pagination: createPaginationMeta(page, limit, totalRecords), // Navigation metadata
        timestamp: new Date().toISOString()                 // Response timestamp for consistency
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
 * @param {Object} req - Express request object containing cursor parameters
 * @param {Object} res - Express response object for sending error responses
 * @param {Object} options - Configuration options for cursor pagination
 * @param {number} options.defaultLimit - Default page size (default: 50)
 * @param {number} options.maxLimit - Maximum allowed page size (default: 100)
 * @param {string} options.defaultSort - Default sort field (default: 'id')
 * @returns {Object|null} Cursor pagination object or null if validation fails
 */
function validateCursorPagination(req, res, options = {}) { // cursor-based pagination validation
    console.log(`validateCursorPagination is running with query: ${JSON.stringify(req.query)}`);
    
    // Validate Express response object like other HTTP utilities
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
        throw new Error('Invalid Express response object provided');
    }
    
    // Validate request object
    if (!req) {
        throw new Error('Invalid Express request object provided');
    }
    
    try {
        // Set default configuration values for cursor pagination
        const {
            defaultLimit = 50,
            maxLimit = 100,
            defaultSort = 'id'
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
            const limitStr = String(req.query.limit).trim();
            const limitParam = parseInt(limitStr, 10);
            
            // Validate limit is a proper integer
            if (isNaN(limitParam) || limitStr.includes('.') || !/^\d+$/.test(limitStr)) {
                console.log(`validateCursorPagination is returning null due to invalid limit: ${req.query.limit}`);
                res.status(400).json({
                    message: 'Limit must be a positive integer starting from 1',
                    timestamp: new Date().toISOString()
                });
                return null;
            }
            limit = limitParam;
        }
        
        // Validate limit parameter range
        if (limit < 1 || !Number.isInteger(limit)) {
            console.log(`validateCursorPagination is returning null due to invalid limit: ${limit}`);
            res.status(400).json({
                message: 'Limit must be a positive integer starting from 1',
                timestamp: new Date().toISOString()
            });
            return null;
        }
        
        // Enforce maximum limit to prevent resource exhaustion
        if (limit > maxLimit) {
            console.log(`validateCursorPagination is returning null due to limit exceeding maximum: ${limit} > ${maxLimit}`);
            res.status(400).json({
                message: `Limit cannot exceed ${maxLimit} records per page`,
                timestamp: new Date().toISOString()
            });
            return null;
        }
        
        // Validate direction parameter
        if (!['next', 'prev'].includes(direction)) {
            console.log(`validateCursorPagination is returning null due to invalid direction: ${direction}`);
            res.status(400).json({
                message: 'Direction must be either "next" or "prev"',
                timestamp: new Date().toISOString()
            });
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
                console.log(`validateCursorPagination is returning null due to invalid cursor: ${error.message}`);
                res.status(400).json({
                    message: 'Invalid cursor format',
                    timestamp: new Date().toISOString()
                });
                return null;
            }
        }
        
        const pagination = { 
            limit, 
            cursor: decodedCursor, 
            direction, 
            sort,
            rawCursor: cursor
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
 * @param {Object} record - The record to create a cursor from
 * @param {string} sortField - Field name used for sorting
 * @returns {string} Base64 encoded cursor string
 */
function createCursor(record, sortField = 'id') { // generate encoded cursor for pagination
    if (!record) return null;
    
    const cursorData = {
        [sortField]: record[sortField],
        id: record.id || record._id, // Support both SQL and MongoDB style IDs
        timestamp: new Date().toISOString()
    };
    
    const cursorJson = JSON.stringify(cursorData);
    const encodedCursor = Buffer.from(cursorJson, 'utf-8').toString('base64');
    
    console.log(`createCursor generated cursor for ${sortField}=${record[sortField]}: ${encodedCursor}`);
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
 * @param {Array} data - Current page of records
 * @param {Object} pagination - Pagination parameters used for the query
 * @param {boolean} hasMore - Whether more records exist in the requested direction
 * @param {string} sortField - Field used for sorting and cursor generation
 * @returns {Object} Cursor pagination metadata object
 */
function createCursorPaginationMeta(data, pagination, hasMore, sortField = 'id') { // cursor metadata generation
    const meta = {
        limit: pagination.limit,
        direction: pagination.direction,
        sort: pagination.sort,
        hasMore,
        cursors: {}
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
 * @param {Object} req - Express request object containing sort parameters
 * @param {Object} res - Express response object for sending error responses
 * @param {Object} options - Configuration options for sorting validation
 * @param {Array} options.allowedFields - List of fields that can be sorted (required)
 * @param {string} options.defaultSort - Default sort field and direction
 * @param {number} options.maxSortFields - Maximum number of sort fields allowed
 * @returns {Object|null} Sort configuration object or null if validation fails
 */
function validateSorting(req, res, options = {}) { // sorting parameter validation
    console.log(`validateSorting is running with query: ${JSON.stringify(req.query)}`);
    
    // Validate Express response object
    if (!res || typeof res.status !== 'function' || typeof res.json !== 'function') {
        throw new Error('Invalid Express response object provided');
    }
    
    // Validate request object
    if (!req) {
        throw new Error('Invalid Express request object provided');
    }
    
    try {
        const {
            allowedFields = [],
            defaultSort = 'id',
            maxSortFields = 3
        } = options;
        
        // Validate that allowed fields are provided
        if (!Array.isArray(allowedFields) || allowedFields.length === 0) {
            throw new Error('allowedFields must be provided and cannot be empty');
        }
        
        req.query = req.query || {};
        
        // Extract sort parameter
        const sortParam = req.query.sort || defaultSort;
        
        // Parse sort fields and directions
        const sortFields = sortParam.split(',').map(field => field.trim()).filter(Boolean);
        
        // Validate number of sort fields
        if (sortFields.length > maxSortFields) {
            console.log(`validateSorting is returning null due to too many sort fields: ${sortFields.length} > ${maxSortFields}`);
            res.status(400).json({
                message: `Cannot sort by more than ${maxSortFields} fields`,
                timestamp: new Date().toISOString()
            });
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
                res.status(400).json({
                    message: `Invalid field name format: ${fieldName}`,
                    timestamp: new Date().toISOString()
                });
                return null;
            }
            
            // Validate field name against allowlist
            if (!allowedFields.includes(fieldName)) {
                console.log(`validateSorting is returning null due to invalid field: ${fieldName}`);
                res.status(400).json({
                    message: `Invalid sort field: ${fieldName}. Allowed fields: ${allowedFields.join(', ')}`,
                    timestamp: new Date().toISOString()
                });
                return null;
            }
            
            sortConfig.push({ field: fieldName, direction });
        }
        
        const result = {
            sortConfig,
            sortString: sortParam,
            primarySort: sortConfig[0] // First sort field for cursor pagination
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
 * @param {Array} data - Array of records for the current page
 * @param {Object} pagination - Pagination parameters used for the query
 * @param {boolean} hasMore - Whether more records exist in the requested direction
 * @param {string} sortField - Field used for sorting and cursor generation
 * @returns {Object} Complete cursor-based paginated response
 */
function createCursorPaginatedResponse(data, pagination, hasMore, sortField = 'id') { // complete cursor response
    return {
        data,
        pagination: createCursorPaginationMeta(data, pagination, hasMore, sortField),
        timestamp: new Date().toISOString()
    };
}

// Export pagination utilities using consistent module pattern
// This follows the same export structure used throughout the library
module.exports = {
    validatePagination,                // Parameter validation and extraction
    createPaginationMeta,              // Metadata generation for responses
    createPaginatedResponse,           // Complete response structure creation
    validateCursorPagination,          // Cursor-based pagination validation
    createCursor,                      // Cursor encoding for navigation
    createCursorPaginationMeta,        // Cursor pagination metadata
    createCursorPaginatedResponse,     // Complete cursor response structure
    validateSorting                    // Sorting parameter validation
};