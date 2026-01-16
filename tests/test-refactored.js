const { greet, add, isEven } = require('./lib/utils');
const { MemStorage } = require('./lib/storage');
const { validateResponseObject } = require('./lib/http-utils');

console.log('=== TESTING REFACTORED CODE ===');

// Test utils
console.log('✅ Utils working:', greet('Test') === 'Hello, Test!' && add(2, 3) === 5 && isEven(4) === true);

// Test storage  
async function testStorage() {
  const storage = new MemStorage();
  try {
    const user = await storage.createUser({username: 'test', displayName: 'Test User'});
    const retrieved = await storage.getUser(user.id);
    console.log('✅ Storage working:', retrieved.username === 'test');
  } catch (e) {
    console.log('❌ Storage error:', e.message);
  }
}

// Test http utils
function testHttpUtils() {
  const mockRes = { status: () => {}, json: () => {} };
  try {
    validateResponseObject(mockRes);
    console.log('✅ HTTP utils validation passed');
  } catch (e) {
    console.log('❌ HTTP utils error:', e.message);
  }
}

testStorage();
testHttpUtils();
console.log('=== ALL TESTS COMPLETED ===');