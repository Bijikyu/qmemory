/**
 * Pagination Utilities Demo
 * Practical examples showing how to use the pagination functionality
 * 
 * This demo shows real-world usage patterns for the pagination utilities
 * integrated with the qmemory library's existing storage and HTTP utilities.
 */

const qmemory = require('../index');

// Create sample data for demonstration
async function setupSampleData() {
    console.log('Setting up sample data...');
    await qmemory.storage.clear();
    
    // Create 23 sample users for pagination demonstration
    const users = [];
    for (let i = 1; i <= 23; i++) {
        const user = await qmemory.storage.createUser({
            username: `user${String(i).padStart(2, '0')}`,
            displayName: `User ${i}`,
            email: `user${i}@example.com`,
            role: i <= 5 ? 'admin' : 'user',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
        users.push(user);
    }
    
    console.log(`Created ${users.length} sample users`);
    return users;
}

// Simulate Express-like request/response objects for demonstration
function createMockExpressObjects(query = {}) {
    const req = { query };
    
    const res = {
        statusCode: null,
        responseData: null,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.responseData = data;
            console.log(`HTTP ${this.statusCode}:`, JSON.stringify(data, null, 2));
            return this;
        }
    };
    
    return { req, res };
}

// Demo 1: Basic pagination with default settings
async function demo1_basicPagination() {
    console.log('\n=== Demo 1: Basic Pagination ===');
    
    const { req, res } = createMockExpressObjects({ page: '1', limit: '10' });
    
    // Validate pagination parameters
    const pagination = qmemory.validatePagination(req, res);
    if (!pagination) return;
    
    console.log('Pagination config:', pagination);
    
    // Get paginated data
    const allUsers = await qmemory.storage.getAllUsers();
    const pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
    
    // Create complete response
    const response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);
    
    console.log('Response summary:');
    console.log(`- Page ${response.pagination.currentPage} of ${response.pagination.totalPages}`);
    console.log(`- Showing ${response.data.length} of ${response.pagination.totalRecords} total users`);
    console.log(`- Has next page: ${response.pagination.hasNextPage}`);
    console.log(`- Has previous page: ${response.pagination.hasPrevPage}`);
}

// Demo 2: Custom pagination settings
async function demo2_customPagination() {
    console.log('\n=== Demo 2: Custom Pagination Settings ===');
    
    const { req, res } = createMockExpressObjects({ page: '2', limit: '5' });
    
    // Use custom pagination options
    const pagination = qmemory.validatePagination(req, res, {
        defaultPage: 1,
        defaultLimit: 20,
        maxLimit: 50
    });
    
    if (!pagination) return;
    
    const allUsers = await qmemory.storage.getAllUsers();
    const pageData = allUsers.slice(pagination.skip, pagination.skip + pagination.limit);
    const response = qmemory.createPaginatedResponse(pageData, pagination.page, pagination.limit, allUsers.length);
    
    console.log('Custom pagination result:');
    console.log(`- Page ${pagination.page}, limit ${pagination.limit}, skip ${pagination.skip}`);
    console.log(`- Users on this page: ${pageData.map(u => u.username).join(', ')}`);
}

// Demo 3: Error handling scenarios
async function demo3_errorHandling() {
    console.log('\n=== Demo 3: Error Handling ===');
    
    const errorCases = [
        { query: { page: '0' }, description: 'Invalid page (zero)' },
        { query: { page: 'invalid' }, description: 'Non-numeric page' },
        { query: { limit: '-5' }, description: 'Negative limit' },
        { query: { limit: '200' }, description: 'Limit exceeds maximum' }
    ];
    
    for (const { query, description } of errorCases) {
        console.log(`\nTesting: ${description}`);
        const { req, res } = createMockExpressObjects(query);
        
        const result = qmemory.validatePagination(req, res);
        console.log(`Result: ${result ? 'Valid' : 'Error (as expected)'}`);
    }
}

// Demo 4: Navigation metadata usage
async function demo4_navigationMetadata() {
    console.log('\n=== Demo 4: Navigation Metadata ===');
    
    const totalUsers = (await qmemory.storage.getAllUsers()).length;
    const pageSize = 8;
    
    // Show navigation metadata for different pages
    const pages = [1, 2, 3]; // First, middle, last page
    
    for (const pageNum of pages) {
        console.log(`\nPage ${pageNum} navigation:`);
        const meta = qmemory.createPaginationMeta(pageNum, pageSize, totalUsers);
        
        console.log(`- Current: ${meta.currentPage}, Total pages: ${meta.totalPages}`);
        console.log(`- Previous: ${meta.prevPage || 'None'}, Next: ${meta.nextPage || 'None'}`);
        console.log(`- Can go back: ${meta.hasPrevPage}, Can go forward: ${meta.hasNextPage}`);
        
        // Simulate client-side navigation logic
        const navigationButtons = {
            previousEnabled: meta.hasPrevPage,
            nextEnabled: meta.hasNextPage,
            firstPage: 1,
            lastPage: meta.totalPages,
            currentPage: meta.currentPage
        };
        console.log('- UI state:', navigationButtons);
    }
}

// Run all demos
async function runAllDemos() {
    console.log('Pagination Utilities Demo');
    console.log('=====================================');
    
    try {
        await setupSampleData();
        await demo1_basicPagination();
        await demo2_customPagination();
        await demo3_errorHandling();
        await demo4_navigationMetadata();
        
        console.log('\nAll pagination demos completed successfully!');
        console.log('\nThe pagination utilities are fully integrated and working correctly.');
        
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Run demos if this file is executed directly
if (require.main === module) {
    runAllDemos();
}

module.exports = {
    setupSampleData,
    createMockExpressObjects,
    runAllDemos
};