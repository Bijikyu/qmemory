/**
 * Debug test to see which tests are failing
 */

const BASE_URL = 'http://localhost:5000';

async function testEndpoint(method, url, body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`🧪 Testing: ${method} ${url}`);
    const response = await fetch(`${BASE_URL}${url}`, options);
    const data = await response.json();

    console.log(`   Status: ${response.status} (Expected: ${expectedStatus})`);
    console.log(`   Success: ${response.status === expectedStatus ? 'PASS' : 'FAIL'}`);

    if (response.status !== expectedStatus) {
      console.log(`   ❌ Wrong status! Expected: ${expectedStatus}, Got: ${response.status}`);
    }

    if (data.error) {
      console.log(`   🛡 Error Response: ${data.error.type} - ${data.error.message}`);
    }

    console.log(`   Raw response: ${JSON.stringify(data)}`);
    console.log('');

    return {
      success: response.ok && response.status === expectedStatus,
      data,
      status: response.status,
    };
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function debugFailingTests() {
  console.log('🚀 DEBUGGING FAILING TESTS');
  console.log('====================================');

  // Test all endpoints to see which fail
  console.log('\n📋 Testing all endpoints:');

  const tests = [
    { name: 'Health', method: 'GET', url: '/health' },
    { name: 'Users', method: 'GET', url: '/users' },
    {
      name: 'User Create',
      method: 'POST',
      url: '/users',
      body: { username: 'test', displayName: 'Test' },
    },
    { name: 'User Get', method: 'GET', url: '/users/1' },
    { name: 'User Update', method: 'PUT', url: '/users/1', body: { displayName: 'Updated' } },
    { name: 'User Delete', method: 'DELETE', url: '/users/1' },
    {
      name: 'Math Division Zero',
      method: 'POST',
      url: '/utils/math',
      body: { a: 10, b: 0, operation: 'divide' },
    },
    {
      name: 'Math Valid',
      method: 'POST',
      url: '/utils/math',
      body: { a: 5, b: 3, operation: 'add' },
    },
    { name: 'Even Check', method: 'GET', url: '/utils/even/42' },
    { name: 'Even Invalid', method: 'GET', url: '/utils/even/abc' },
    { name: '404 Test', method: 'GET', url: '/nonexistent' },
  ];

  for (const test of tests) {
    console.log(`\n🧪 ${test.name}:`);
    const result = await testEndpoint(test.method, test.url, test.body, test.expectedStatus);
    if (result.success) {
      console.log(`   ✅ ${test.name}: PASS`);
    } else {
      console.log(`   ❌ ${test.name}: FAIL - ${result.error}`);
    }
  }

  console.log('\n🚀 DEBUG COMPLETE');
}

debugFailingTests().catch(console.error);
