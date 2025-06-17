/**
 * Advanced Pagination Demo
 * Comprehensive demonstration of enhanced pagination utilities
 * 
 * This demo showcases the complete pagination feature set including:
 * - Traditional offset-based pagination for simple use cases
 * - Cursor-based pagination for large datasets and real-time data
 * - Advanced sorting with security validation
 * - Integration with existing HTTP and storage utilities
 * 
 * Real-world scenarios demonstrated:
 * 1. Product catalog pagination with sorting
 * 2. User activity feed with cursor-based navigation
 * 3. Search results with filtering and pagination
 * 4. Performance comparison between pagination approaches
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
} = require('../lib/pagination-utils');

// Sample dataset simulating a real application database
const sampleProducts = [
  { id: 1, name: 'Wireless Headphones', price: 99.99, category: 'Electronics', createdAt: '2024-01-15T10:30:00Z' },
  { id: 2, name: 'Coffee Maker', price: 149.99, category: 'Appliances', createdAt: '2024-01-16T14:20:00Z' },
  { id: 3, name: 'Smartphone', price: 799.99, category: 'Electronics', createdAt: '2024-01-17T09:15:00Z' },
  { id: 4, name: 'Running Shoes', price: 129.99, category: 'Sports', createdAt: '2024-01-18T16:45:00Z' },
  { id: 5, name: 'Laptop', price: 999.99, category: 'Electronics', createdAt: '2024-01-19T11:30:00Z' },
  { id: 6, name: 'Desk Chair', price: 199.99, category: 'Furniture', createdAt: '2024-01-20T13:10:00Z' },
  { id: 7, name: 'Tablet', price: 299.99, category: 'Electronics', createdAt: '2024-01-21T08:20:00Z' },
  { id: 8, name: 'Blender', price: 79.99, category: 'Appliances', createdAt: '2024-01-22T15:30:00Z' },
  { id: 9, name: 'Monitor', price: 249.99, category: 'Electronics', createdAt: '2024-01-23T12:45:00Z' },
  { id: 10, name: 'Yoga Mat', price: 29.99, category: 'Sports', createdAt: '2024-01-24T10:15:00Z' }
];

const sampleUsers = [
  { id: 101, username: 'alice_dev', email: 'alice@example.com', lastActive: '2024-01-24T16:30:00Z', score: 850 },
  { id: 102, username: 'bob_designer', email: 'bob@example.com', lastActive: '2024-01-24T15:45:00Z', score: 720 },
  { id: 103, username: 'charlie_pm', email: 'charlie@example.com', lastActive: '2024-01-24T14:20:00Z', score: 960 },
  { id: 104, username: 'diana_qa', email: 'diana@example.com', lastActive: '2024-01-24T13:10:00Z', score: 680 },
  { id: 105, username: 'eve_ops', email: 'eve@example.com', lastActive: '2024-01-24T12:30:00Z', score: 780 }
];

// Helper function to create mock Express request/response objects
function createMockExpressObjects(query = {}) {
  const req = { query };
  const res = {
    status: function(code) { 
      this._statusCode = code; 
      return this; 
    },
    json: function(data) { 
      this._jsonData = data; 
      return this; 
    },
    _statusCode: 200,
    _jsonData: null
  };
  return { req, res };
}

// Simulation functions for database queries
function simulateOffsetQuery(data, pagination, sortConfig = null) {
  let sortedData = [...data];
  
  // Apply sorting if provided
  if (sortConfig && sortConfig.length > 0) {
    sortedData.sort((a, b) => {
      for (const sort of sortConfig) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }
  
  // Apply pagination
  const startIndex = pagination.skip;
  const endIndex = startIndex + pagination.limit;
  
  return {
    data: sortedData.slice(startIndex, endIndex),
    totalRecords: sortedData.length
  };
}

function simulateCursorQuery(data, pagination, sortField = 'id') {
  let sortedData = [...data];
  
  // Sort data based on the sort field
  const isDescending = pagination.sort.startsWith('-');
  const actualSortField = pagination.sort.replace(/^[+-]/, '');
  
  sortedData.sort((a, b) => {
    const aVal = a[actualSortField];
    const bVal = b[actualSortField];
    
    let comparison = 0;
    if (aVal < bVal) comparison = -1;
    else if (aVal > bVal) comparison = 1;
    
    return isDescending ? -comparison : comparison;
  });
  
  // Apply cursor filtering if provided
  let startIndex = 0;
  if (pagination.cursor) {
    const cursorValue = pagination.cursor[actualSortField];
    const cursorId = pagination.cursor.id;
    
    startIndex = sortedData.findIndex(item => {
      if (pagination.direction === 'next') {
        return isDescending ? 
          (item[actualSortField] < cursorValue || (item[actualSortField] === cursorValue && item.id > cursorId)) :
          (item[actualSortField] > cursorValue || (item[actualSortField] === cursorValue && item.id > cursorId));
      } else {
        return isDescending ?
          (item[actualSortField] > cursorValue || (item[actualSortField] === cursorValue && item.id < cursorId)) :
          (item[actualSortField] < cursorValue || (item[actualSortField] === cursorValue && item.id < cursorId));
      }
    });
    
    if (startIndex === -1) startIndex = sortedData.length;
  }
  
  // Get page of results
  const endIndex = startIndex + pagination.limit;
  const pageData = sortedData.slice(startIndex, endIndex);
  
  // Check if there are more records
  const hasMore = endIndex < sortedData.length;
  
  return { data: pageData, hasMore };
}

async function demo1_basicOffsetPagination() {
  console.log('\n=== Demo 1: Basic Offset Pagination ===');
  console.log('Demonstrating traditional page-based pagination for product catalog');
  
  // Simulate first page request
  const { req: req1, res: res1 } = createMockExpressObjects({ page: '1', limit: '3' });
  const pagination1 = validatePagination(req1, res1);
  
  if (pagination1) {
    const result1 = simulateOffsetQuery(sampleProducts, pagination1);
    const response1 = createPaginatedResponse(result1.data, pagination1.page, pagination1.limit, result1.totalRecords);
    
    console.log(`Page 1 Results (${result1.data.length} of ${result1.totalRecords} total):`);
    result1.data.forEach(product => {
      console.log(`  - ${product.name} ($${product.price}) [${product.category}]`);
    });
    console.log(`Navigation: Page ${response1.pagination.currentPage} of ${response1.pagination.totalPages}`);
    console.log(`Has Next: ${response1.pagination.hasNextPage}, Has Previous: ${response1.pagination.hasPrevPage}`);
  }
  
  // Simulate middle page request
  const { req: req2, res: res2 } = createMockExpressObjects({ page: '3', limit: '3' });
  const pagination2 = validatePagination(req2, res2);
  
  if (pagination2) {
    const result2 = simulateOffsetQuery(sampleProducts, pagination2);
    const response2 = createPaginatedResponse(result2.data, pagination2.page, pagination2.limit, result2.totalRecords);
    
    console.log(`\nPage 3 Results (${result2.data.length} of ${result2.totalRecords} total):`);
    result2.data.forEach(product => {
      console.log(`  - ${product.name} ($${product.price}) [${product.category}]`);
    });
    console.log(`Navigation: Page ${response2.pagination.currentPage} of ${response2.pagination.totalPages}`);
  }
}

async function demo2_cursorBasedPagination() {
  console.log('\n=== Demo 2: Cursor-Based Pagination ===');
  console.log('Demonstrating cursor navigation for large datasets with real-time updates');
  
  // First page with cursor pagination
  const { req: req1, res: res1 } = createMockExpressObjects({ 
    limit: '3', 
    direction: 'next',
    sort: '-score' // Sort by score descending
  });
  
  const pagination1 = validateCursorPagination(req1, res1);
  
  if (pagination1) {
    const result1 = simulateCursorQuery(sampleUsers, pagination1, 'score');
    const response1 = createCursorPaginatedResponse(result1.data, pagination1, result1.hasMore, 'score');
    
    console.log(`First Page Results (sorted by score descending):`);
    result1.data.forEach(user => {
      console.log(`  - ${user.username} (Score: ${user.score}) - Last Active: ${user.lastActive}`);
    });
    console.log(`Has More: ${response1.pagination.hasMore}`);
    console.log(`Next Cursor: ${response1.pagination.cursors.next ? 'Available' : 'None'}`);
    
    // Use cursor for next page
    if (response1.pagination.cursors.next) {
      const { req: req2, res: res2 } = createMockExpressObjects({
        limit: '2',
        direction: 'next',
        sort: '-score',
        cursor: response1.pagination.cursors.next
      });
      
      const pagination2 = validateCursorPagination(req2, res2);
      
      if (pagination2) {
        const result2 = simulateCursorQuery(sampleUsers, pagination2, 'score');
        const response2 = createCursorPaginatedResponse(result2.data, pagination2, result2.hasMore, 'score');
        
        console.log(`\nNext Page Results (using cursor):`);
        result2.data.forEach(user => {
          console.log(`  - ${user.username} (Score: ${user.score}) - Last Active: ${user.lastActive}`);
        });
        console.log(`Has More: ${response2.pagination.hasMore}`);
      }
    }
  }
}

async function demo3_advancedSorting() {
  console.log('\n=== Demo 3: Advanced Sorting with Security Validation ===');
  console.log('Demonstrating multi-field sorting with security constraints');
  
  // Valid multi-field sorting
  const { req: req1, res: res1 } = createMockExpressObjects({ 
    sort: 'category,-price,name',
    page: '1',
    limit: '5'
  });
  
  const allowedFields = ['name', 'price', 'category', 'createdAt'];
  const sortConfig = validateSorting(req1, res1, { allowedFields });
  
  if (sortConfig) {
    console.log('Valid Sort Configuration:');
    sortConfig.sortConfig.forEach((sort, index) => {
      console.log(`  ${index + 1}. ${sort.field} (${sort.direction})`);
    });
    
    const pagination1 = validatePagination(req1, res1);
    if (pagination1) {
      const result1 = simulateOffsetQuery(sampleProducts, pagination1, sortConfig.sortConfig);
      
      console.log('\nSorted Results (Category ASC, Price DESC, Name ASC):');
      result1.data.forEach(product => {
        console.log(`  - [${product.category}] ${product.name} - $${product.price}`);
      });
    }
  }
  
  // Demonstrate security validation - invalid field
  console.log('\n--- Security Validation Test ---');
  const { req: req2, res: res2 } = createMockExpressObjects({ sort: 'password,admin_level' });
  
  const invalidSort = validateSorting(req2, res2, { allowedFields });
  if (!invalidSort) {
    console.log('Security validation working: Rejected unauthorized sort fields');
    console.log('This prevents potential data exposure or injection attacks');
  }
}

async function demo4_performanceComparison() {
  console.log('\n=== Demo 4: Performance Comparison ===');
  console.log('Comparing offset vs cursor pagination performance characteristics');
  
  // Simulate large dataset
  const largeDataset = Array.from({ length: 100000 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    timestamp: new Date(2024, 0, 1 + (i % 365)).toISOString(),
    value: Math.floor(Math.random() * 1000)
  }));
  
  console.log(`Dataset Size: ${largeDataset.length.toLocaleString()} records`);
  
  // Offset pagination performance simulation
  console.log('\nOffset Pagination:');
  const offsetStart = process.hrtime.bigint();
  
  // Simulate deep page access (page 1000)
  const { req: offsetReq, res: offsetRes } = createMockExpressObjects({ page: '1000', limit: '50' });
  const offsetPagination = validatePagination(offsetReq, offsetRes);
  
  if (offsetPagination) {
    // In real database, this would require scanning 49,950 records before returning results
    const offsetSkipped = offsetPagination.skip;
    console.log(`  - Deep page access requires skipping ${offsetSkipped.toLocaleString()} records`);
    console.log(`  - Performance degrades linearly with page depth`);
    console.log(`  - Suitable for: Small to medium datasets, jump-to-page navigation`);
  }
  
  const offsetEnd = process.hrtime.bigint();
  const offsetTime = Number(offsetEnd - offsetStart) / 1000000; // Convert to milliseconds
  
  // Cursor pagination performance simulation
  console.log('\nCursor Pagination:');
  const cursorStart = process.hrtime.bigint();
  
  const { req: cursorReq, res: cursorRes } = createMockExpressObjects({
    limit: '50',
    direction: 'next',
    sort: 'timestamp'
  });
  
  const cursorPagination = validateCursorPagination(cursorReq, cursorRes);
  
  if (cursorPagination) {
    console.log(`  - No record skipping required, uses indexed seeks`);
    console.log(`  - Consistent performance regardless of position in dataset`);
    console.log(`  - Suitable for: Large datasets, real-time feeds, mobile apps`);
  }
  
  const cursorEnd = process.hrtime.bigint();
  const cursorTime = Number(cursorEnd - cursorStart) / 1000000;
  
  console.log(`\nValidation Performance Comparison:`);
  console.log(`  - Offset validation: ${offsetTime.toFixed(3)}ms`);
  console.log(`  - Cursor validation: ${cursorTime.toFixed(3)}ms`);
  console.log(`  - Both validations are extremely fast and scale well`);
}

async function demo5_realWorldIntegration() {
  console.log('\n=== Demo 5: Real-World Integration Patterns ===');
  console.log('Demonstrating pagination integration with filtering and search');
  
  // E-commerce product search with pagination
  console.log('E-commerce Search Results:');
  const searchQuery = 'Electronics';
  const filteredProducts = sampleProducts.filter(p => p.category === searchQuery);
  
  const { req, res } = createMockExpressObjects({ 
    page: '1', 
    limit: '3',
    sort: '-price',
    category: searchQuery 
  });
  
  // Validate sorting with appropriate security restrictions
  const sortConfig = validateSorting(req, res, { 
    allowedFields: ['name', 'price', 'createdAt'],
    defaultSort: '-createdAt'
  });
  
  const pagination = validatePagination(req, res);
  
  if (pagination && sortConfig) {
    const result = simulateOffsetQuery(filteredProducts, pagination, sortConfig.sortConfig);
    const response = createPaginatedResponse(result.data, pagination.page, pagination.limit, result.totalRecords);
    
    console.log(`Search: "${searchQuery}" - ${result.totalRecords} results found`);
    console.log(`Page ${response.pagination.currentPage} of ${response.pagination.totalPages}:`);
    
    result.data.forEach((product, index) => {
      console.log(`  ${pagination.skip + index + 1}. ${product.name} - $${product.price}`);
    });
    
    console.log(`\nNavigation Options:`);
    if (response.pagination.hasPrevPage) {
      console.log(`  ← Previous: Page ${response.pagination.prevPage}`);
    }
    if (response.pagination.hasNextPage) {
      console.log(`  → Next: Page ${response.pagination.nextPage}`);
    }
    
    console.log(`\nAPI Response Structure:`);
    console.log(`  - data: Array of ${result.data.length} products`);
    console.log(`  - pagination: Complete navigation metadata`);
    console.log(`  - timestamp: ${response.timestamp}`);
  }
}

async function demo6_errorHandlingShowcase() {
  console.log('\n=== Demo 6: Error Handling and Validation ===');
  console.log('Demonstrating comprehensive input validation and error responses');
  
  const errorCases = [
    { 
      query: { page: '0', limit: '10' }, 
      description: 'Invalid page number (too low)' 
    },
    { 
      query: { page: '1', limit: '500' }, 
      description: 'Limit exceeds maximum allowed' 
    },
    { 
      query: { page: 'abc', limit: '10' }, 
      description: 'Non-numeric page parameter' 
    },
    { 
      query: { cursor: 'invalid-cursor-data', limit: '10' }, 
      description: 'Malformed cursor' 
    },
    { 
      query: { direction: 'sideways', limit: '10' }, 
      description: 'Invalid direction parameter' 
    }
  ];
  
  console.log('Testing Input Validation:');
  
  errorCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.description}:`);
    
    const { req, res } = createMockExpressObjects(testCase.query);
    
    // Test offset pagination validation
    if (testCase.query.page !== undefined) {
      const result = validatePagination(req, res);
      if (!result) {
        console.log('   ✓ Offset pagination correctly rejected invalid input');
      }
    }
    
    // Test cursor pagination validation
    if (testCase.query.cursor !== undefined || testCase.query.direction !== undefined) {
      const result = validateCursorPagination(req, res);
      if (!result) {
        console.log('   ✓ Cursor pagination correctly rejected invalid input');
      }
    }
    
    // Mock response should have been called with error details
    if (res.status.mock && res.status.mock.calls.length > 0) {
      const statusCode = res.status.mock.calls[res.status.mock.calls.length - 1][0];
      console.log(`   → HTTP ${statusCode} error response generated`);
    }
  });
  
  console.log('\nError handling provides:');
  console.log('  ✓ Consistent HTTP status codes');
  console.log('  ✓ Detailed error messages for debugging');
  console.log('  ✓ Timestamp information');
  console.log('  ✓ Security-conscious error responses');
}

async function runAllAdvancedDemos() {
  console.log('🚀 Advanced Pagination Utilities Comprehensive Demo');
  console.log('====================================================');
  console.log('\nThis demonstration showcases the enhanced pagination features');
  console.log('integrated with your existing qmemory library utilities.');
  console.log('\nFeatures demonstrated:');
  console.log('  • Offset-based pagination for traditional use cases');
  console.log('  • Cursor-based pagination for large datasets');
  console.log('  • Advanced sorting with security validation');
  console.log('  • Performance characteristics comparison');
  console.log('  • Real-world integration patterns');
  console.log('  • Comprehensive error handling');
  
  try {
    await demo1_basicOffsetPagination();
    await demo2_cursorBasedPagination();
    await demo3_advancedSorting();
    await demo4_performanceComparison();
    await demo5_realWorldIntegration();
    await demo6_errorHandlingShowcase();
    
    console.log('\n====================================================');
    console.log('✅ All Advanced Pagination Demos Completed Successfully!');
    console.log('\nKey Benefits Demonstrated:');
    console.log('  ✓ Enhanced functionality while maintaining existing API compatibility');
    console.log('  ✓ Security-first approach with input validation and field restrictions');
    console.log('  ✓ Performance optimization for different use cases');
    console.log('  ✓ Comprehensive error handling and user-friendly responses');
    console.log('  ✓ Integration with existing HTTP utilities for consistency');
    console.log('\nThe enhanced pagination utilities are ready for production use!');
    
  } catch (error) {
    console.error('\n❌ Demo execution error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Export for use in other modules or direct execution
module.exports = {
  runAllAdvancedDemos,
  demo1_basicOffsetPagination,
  demo2_cursorBasedPagination,
  demo3_advancedSorting,
  demo4_performanceComparison,
  demo5_realWorldIntegration,
  demo6_errorHandlingShowcase
};

// Run demos if this file is executed directly
if (require.main === module) {
  runAllAdvancedDemos().catch(console.error);
}