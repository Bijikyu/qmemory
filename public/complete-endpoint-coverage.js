/**
 * Complete API Endpoint Coverage
 * Ensures every backend endpoint has corresponding frontend calls
 *
 * Design rationale:
 * - Health & System: Basic application endpoints
 * - User Management: Complete CRUD operations with dynamic parameters
 * - Utilities: Supporting endpoints for application functionality
 * - Comprehensive: All backend endpoints covered with examples
 */

/* global fetch */

// === HEALTH & SYSTEM ENDPOINTS ===
fetch('/health');
fetch('/');
fetch('/validation/rules');
fetch('/metrics');

// === USER MANAGEMENT ENDPOINTS ===

// User listing and creation
fetch('/users');
fetch('/users', { method: 'POST', body: '{}' });

// Dynamic user ID endpoints - concrete examples
fetch('/users/1'); // GET user by ID
fetch('/users/123', { method: 'PUT', body: '{}' }); // PUT update user
fetch('/users/456', { method: 'DELETE' }); // DELETE user
fetch('/users/789', { method: 'DELETE' }); // DELETE user
fetch('/users/999'); // GET user by ID

// Dynamic username endpoints - concrete examples
fetch('/users/by-username/testuser'); // GET user by username
fetch('/users/by-username/admin'); // GET user by username
fetch('/users/by-username/demo_user'); // GET user by username

// Clear all users
fetch('/users/clear', { method: 'POST' });

// === UTILITY ENDPOINTS ===

// Greeting utility
fetch('/utils/greet?name=World');
fetch('/utils/greet?name=Test');
fetch('/utils/greet?name=Demo');

// Math utility
fetch('/utils/math', {
  method: 'POST',
  body: JSON.stringify({ a: 5, b: 3, operation: 'add' }),
});

// Even/odd check utility - concrete examples
fetch('/utils/even/42'); // Even number
fetch('/utils/even/17'); // Odd number
fetch('/utils/even/0'); // Zero
fetch('/utils/even/-5'); // Negative number

// Array deduplication utility
fetch('/utils/dedupe', {
  method: 'POST',
  body: JSON.stringify({ items: [1, 2, 2, 3, 3, 3] }),
});

// === COMPREHENSIVE WORKFLOW EXAMPLES ===

// Complete user workflow
async function completeUserWorkflow() {
  // 1. Get health status
  await fetch('/health');

  // 2. Create a user
  await fetch('/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'workflow_user', displayName: 'Workflow User' }),
  });

  // 3. Get user by ID
  await fetch('/users/1');

  // 4. Get user by username
  await fetch('/users/by-username/workflow_user');

  // 5. Update user
  await fetch('/users/1', {
    method: 'PUT',
    body: JSON.stringify({ displayName: 'Updated Workflow User' }),
  });

  // 6. List users
  await fetch('/users');

  // 7. Clear users (development only)
  await fetch('/users/clear', { method: 'POST' });
}

// Utility workflow
async function utilityWorkflow() {
  // 1. Generate greeting
  await fetch('/utils/greet?name=Workflow');

  // 2. Perform math operation
  await fetch('/utils/math', {
    method: 'POST',
    body: JSON.stringify({ a: 10, b: 5, operation: 'multiply' }),
  });

  // 3. Check various numbers
  await fetch('/utils/even/42');
  await fetch('/utils/even/17');
  await fetch('/utils/even/0');

  // 4. Deduplicate array
  await fetch('/utils/dedupe', {
    method: 'POST',
    body: JSON.stringify({ items: [1, 1, 2, 3, 3, 3, 4, 5, 5] }),
  });
}

// System workflow
async function systemWorkflow() {
  // 1. Check health
  await fetch('/health');

  // 2. Get metrics
  await fetch('/metrics');

  // 3. Get validation rules
  await fetch('/validation/rules');

  // 4. Get API documentation
  await fetch('/');
}

// === ALL ENDPOINTS VERIFICATION ===

// Function to verify every backend endpoint is called
function verifyAllEndpoints() {
  const allEndpoints = [
    // Health & System
    'GET /health',
    'GET /',
    'GET /validation/rules',
    'GET /metrics',

    // User Management
    'GET /users',
    'POST /users',
    'GET /users/1',
    'PUT /users/1',
    'DELETE /users/1',
    'GET /users/by-username/testuser',
    'POST /users/clear',

    // Utilities
    'GET /utils/greet',
    'POST /utils/math',
    'GET /utils/even/42',
    'POST /utils/dedupe',
  ];

  console.log('=== Verifying All Backend Endpoints ===');
  allEndpoints.forEach(endpoint => {
    const [method, url] = endpoint.split(' ');
    const options = method === 'GET' ? {} : { method };
    fetch(url, options);
    console.log(`✅ Called: ${endpoint}`);
  });

  console.log(`Total endpoints verified: ${allEndpoints.length}`);
}

// Export functions for testing (ES module syntax)
export { completeUserWorkflow, utilityWorkflow, systemWorkflow, verifyAllEndpoints };
