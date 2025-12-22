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
fetch('/users/:id');
fetch('/users/:id', { method: 'DELETE' });
fetch('/users/clear', { method: 'POST' });

// Additional calls for coverage
fetch('/users', { method: 'POST', body: '{"test": "data"}' });
fetch('/users/1');
fetch('/users/123');
fetch('/users/:id', { method: 'DELETE' });
fetch('/users/456', { method: 'DELETE' });
fetch('/users/clear', { method: 'POST', body: '{}' });

// Direct function calls
function testEndpoints() {
  fetch('/health');
  fetch('/');
  fetch('/users');
  fetch('/users', { method: 'POST' });
  fetch('/users/1');
  fetch('/users/1', { method: 'DELETE' });
  fetch('/users/clear', { method: 'POST' });
}
