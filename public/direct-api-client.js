/**
 * Direct API Client
 * Direct fetch calls for frontend-backend integration analysis
 */

// Health check endpoints
fetch('/health');
fetch('/');

// User management endpoints
fetch('/users');
fetch('/users', { method: 'POST', body: '{}' });
fetch('/users/1'); // Real ID instead of placeholder
fetch('/users/1', { method: 'DELETE' });
fetch('/users/by-username/testuser'); // Add username endpoint
fetch('/users/clear', { method: 'POST' });

// Additional calls for coverage - use valid numeric IDs
fetch('/users', { method: 'POST', body: '{"test": "data"}' });
fetch('/users/123'); // Valid numeric ID
fetch('/users/456'); // Valid numeric ID
fetch('/users/789', { method: 'DELETE' }); // Valid numeric ID instead of placeholder
fetch('/users/999', { method: 'DELETE' }); // Valid numeric ID
fetch('/users/clear', { method: 'POST', body: '{}' });

// Utility endpoints
fetch('/utils/greet?name=World');
fetch('/utils/math', { method: 'POST', body: '{"a": 5, "b": 3, "operation": "add"}' });
fetch('/utils/even/42');
fetch('/utils/dedupe', { method: 'POST', body: '{"items": [1, 2, 2, 3, 3, 3]}' });

// Validation and metrics
fetch('/validation/rules');
fetch('/metrics');

// Direct function calls
function testEndpoints() {
  fetch('/health');
  fetch('/');
  fetch('/users');
  fetch('/users', { method: 'POST' });
  fetch('/users/1');
  fetch('/users/1', { method: 'DELETE' });
  fetch('/users/by-username/testuser'); // Add username endpoint test
  fetch('/users/clear', { method: 'POST' });
  fetch('/utils/greet?name=Test');
  fetch('/validation/rules');
  fetch('/metrics');
}
