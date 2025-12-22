#!/usr/bin/env node

/**
 * Simple test script to verify the new endpoints work
 */

const http = require('http');

// Test function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body,
        });
      });
    });

    req.on('error', err => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test the new endpoints
async function testEndpoints() {
  console.log('Testing new endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing /health endpoint...');
    const health = await makeRequest('/health');
    console.log(`   Status: ${health.statusCode}`);
    console.log(`   Response: ${health.body.substring(0, 100)}...\n`);

    // Test 404 endpoint
    console.log('2. Testing /test/404 endpoint...');
    const test404 = await makeRequest('/test/404');
    console.log(`   Status: ${test404.statusCode}`);
    console.log(`   Response: ${test404.body.substring(0, 100)}...\n`);

    // Test 409 endpoint
    console.log('3. Testing /test/409 endpoint...');
    const test409 = await makeRequest('/test/409', 'POST');
    console.log(`   Status: ${test409.statusCode}`);
    console.log(`   Response: ${test409.body.substring(0, 100)}...\n`);

    // Test 500 endpoint
    console.log('4. Testing /test/500 endpoint...');
    const test500 = await makeRequest('/test/500');
    console.log(`   Status: ${test500.statusCode}`);
    console.log(`   Response: ${test500.body.substring(0, 100)}...\n`);

    // Test 503 endpoint
    console.log('5. Testing /test/503 endpoint...');
    const test503 = await makeRequest('/test/503');
    console.log(`   Status: ${test503.statusCode}`);
    console.log(`   Response: ${test503.body.substring(0, 100)}...\n`);

    // Test validation endpoint
    console.log('6. Testing /test/validation endpoint...');
    const testValidation = await makeRequest('/test/validation', 'POST');
    console.log(`   Status: ${testValidation.statusCode}`);
    console.log(`   Response: ${testValidation.body.substring(0, 100)}...\n`);

    // Test auth endpoint
    console.log('7. Testing /test/auth endpoint...');
    const testAuth = await makeRequest('/test/auth');
    console.log(`   Status: ${testAuth.statusCode}`);
    console.log(`   Response: ${testAuth.body.substring(0, 100)}...\n`);

    // Test username search endpoint
    console.log('8. Testing /users/by-username/demo endpoint...');
    const usernameSearch = await makeRequest('/users/by-username/demo');
    console.log(`   Status: ${usernameSearch.statusCode}`);
    console.log(`   Response: ${usernameSearch.body.substring(0, 100)}...\n`);

    // Test user creation
    console.log('9. Testing user creation...');
    const createUser = await makeRequest('/users', 'POST', {
      username: 'testuser',
      displayName: 'Test User',
    });
    console.log(`   Status: ${createUser.statusCode}`);
    console.log(`   Response: ${createUser.body.substring(0, 100)}...\n`);

    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.log('Make sure the demo app is running on localhost:5000');
  }
}

// Run the tests
testEndpoints();
