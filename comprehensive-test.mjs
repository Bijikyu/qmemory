/**
 * Comprehensive End-to-End Integration Test
 * Tests all fixed endpoints and validates bug fixes
 */

const BASE_URL = 'http://localhost:5000';

// Test helper with enhanced validation
async function testEndpoint(method, url, body = null, description = '', expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`🧪 Testing: ${method} ${url} - ${description}`);
    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    console.log(`   ✅ Status: ${response.status} (Expected: ${expectedStatus})`);
    if (response.status === expectedStatus) {
      console.log(`   ✅ PASS: Correct status code`);
    } else {
      console.log(`   ❌ FAIL: Wrong status code`);
    }

    // Test for proper error handling
    if (data.error) {
      console.log(`   🛡 Error Response: ${data.error.type} - ${data.error.message}`);
    }

    console.log(`   📄 Response length: ${JSON.stringify(data).length} chars`);
    console.log('');

    return {
      success: response.ok && response.status === expectedStatus,
      data,
      status: response.status,
      hasError: !!data.error,
    };
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    console.log('');
    return { success: false, error: error.message };
  }
}

// Test all critical bug fixes
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive End-to-End Integration Test');
  console.log('================================================');

  let totalTests = 0;
  let passedTests = 0;

  // Test 1: Basic health check (server startup)
  console.log('🏥 Test 1: Basic Server Health');
  const healthResult = await testEndpoint('GET', '/health', null, 'Basic health check');
  totalTests++;
  if (healthResult.success) passedTests++;

  // Test 2: Users pagination with bounds checking
  console.log('🏥 Test 2: Users Pagination (Bug Fix #3)');
  const usersResult = await testEndpoint(
    'GET',
    '/users?page=1&limit=5',
    null,
    'Pagination with bounds fix'
  );
  totalTests++;
  if (usersResult.success) passedTests++;

  // Test 3: User creation with validation
  console.log('🏥 Test 3: User Creation');
  const createResult = await testEndpoint(
    'POST',
    '/users',
    { username: 'testuser', displayName: 'Test User' },
    'User creation with validation'
  );
  totalTests++;
  if (createResult.success) passedTests++;

  // Test 4: Get user by ID with parseInt fix
  console.log('🏥 Test 4: Get User by ID (parseInt fix)');
  const getUserResult = await testEndpoint(
    'GET',
    '/users/1',
    null,
    'Get user with parseInt validation'
  );
  totalTests++;
  if (getUserResult.success) passedTests++;

  // Test 5: Math operations - Division by zero fix
  console.log('🏥 Test 5: Math Division (Bug Fix #2)');
  const mathBadResult = await testEndpoint(
    'POST',
    '/utils/math',
    { a: 10, b: 0, operation: 'divide' },
    'Division by zero error handling',
    400
  );
  totalTests++;
  if (mathBadResult.success) passedTests++;

  console.log('🏥 Test 6: Valid Math Operation');
  const mathGoodResult = await testEndpoint(
    'POST',
    '/utils/math',
    { a: 10, b: 5, operation: 'add' },
    'Valid math operation'
  );
  totalTests++;
  if (mathGoodResult.success) passedTests++;

  // Test 7: Even/odd with parseInt fix and validation
  console.log('🏥 Test 7: Even/Odd Check (parseInt fix)');
  const evenValidResult = await testEndpoint(
    'GET',
    '/utils/even/42',
    null,
    'Even check with valid input'
  );
  totalTests++;
  if (evenValidResult.success) passedTests++;

  console.log('🏥 Test 8: Invalid Even Input');
  const evenInvalidResult = await testEndpoint(
    'GET',
    '/utils/even/abc',
    null,
    'Even check with invalid input',
    400
  );
  totalTests++;
  if (evenInvalidResult.success) passedTests++;

  // Test 9: Type validation fix
  console.log('🏥 Test 9: Type Validation (typeof fix)');
  const typeBadResult = await testEndpoint(
    'POST',
    '/utils/math',
    { a: undefined, b: 5, operation: 'add' },
    'Type validation',
    400
  );
  totalTests++;
  if (typeBadResult.success) passedTests++;

  // Test 10: 404 handler with return fix
  console.log('🏥 Test 10: 404 Handler (return fix)');
  const notFoundResult = await testEndpoint(
    'GET',
    '/nonexistent',
    null,
    '404 handler with return statement',
    404
  );
  totalTests++;
  if (notFoundResult.success) passedTests++;

  // Test 11: Array deduplication
  console.log('🏥 Test 11: Array Deduplication');
  const dedupeResult = await testEndpoint(
    'POST',
    '/utils/dedupe',
    { items: [1, 2, 2, 3, 3, 4, 4, 5] },
    'Array deduplication utility'
  );
  totalTests++;
  if (dedupeResult.success) passedTests++;

  // Test 12: Metrics endpoint
  console.log('🏥 Test 12: Metrics Collection');
  const metricsResult = await testEndpoint('GET', '/metrics', null, 'System metrics collection');
  totalTests++;
  if (metricsResult.success) passedTests++;

  // Test 13: Validation rules
  console.log('🏥 Test 13: Validation Rules');
  const validationResult = await testEndpoint(
    'GET',
    '/validation/rules',
    null,
    'Validation rules endpoint'
  );
  totalTests++;
  if (validationResult.success) passedTests++;

  // Results summary
  console.log('================================================');
  console.log('🎯 COMPREHENSIVE TEST RESULTS');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Failed Tests: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - BUG FIXES SUCCESSFUL');
    console.log('🏆 MISSION: FULLY ACCOMPLISHED');
  } else {
    console.log('❌ SOME TESTS FAILED - BUGS REMAIN');
  }

  console.log('================================================');
  console.log('🚀 End-to-End Integration Testing Complete');
}

// Run comprehensive tests
runComprehensiveTests().catch(console.error);
