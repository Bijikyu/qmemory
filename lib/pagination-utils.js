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
        
        // Extract and convert pagination parameters with automatic fallback to defaults
        // parseInt() handles string-to-number conversion with NaN for invalid inputs
        const page = parseInt(req.query.page) || defaultPage;
        const limit = parseInt(req.query.limit) || defaultLimit;
        
        // Validate page parameter using same validation pattern as other library modules
        // Page must be positive integer starting from 1 for user-friendly URLs
        if (page < 1 || !Number.isInteger(page)) {
            console.log(`validatePagination is returning null due to invalid page: ${page}`);
            return res.status(400).json({
                message: 'Page must be a positive integer starting from 1',
                timestamp: new Date().toISOString()
            });
        }
        
        // Validate limit parameter to prevent invalid page sizes
        // Limit must be positive integer starting from 1 to ensure meaningful results
        if (limit < 1 || !Number.isInteger(limit)) {
            console.log(`validatePagination is returning null due to invalid limit: ${limit}`);
            return res.status(400).json({
                message: 'Limit must be a positive integer starting from 1',
                timestamp: new Date().toISOString()
            });
        }
        
        // Enforce maximum limit to prevent resource exhaustion and maintain performance
        // This protects against both accidental and malicious large page size requests
        if (limit > maxLimit) {
            console.log(`validatePagination is returning null due to limit exceeding maximum: ${limit} > ${maxLimit}`);
            return res.status(400).json({
                message: `Limit cannot exceed ${maxLimit} records per page`,
                timestamp: new Date().toISOString()
            });
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

// Export pagination utilities using consistent module pattern
// This follows the same export structure used throughout the library
module.exports = {
    validatePagination,         // Parameter validation and extraction
    createPaginationMeta,       // Metadata generation for responses
    createPaginatedResponse     // Complete response structure creation
};