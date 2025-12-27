// Test script to verify error property access fixes
const { FileSystemBinaryStorage } = require('./dist/lib/binary-storage.js');
const fs = require('fs');

async function testErrorPropertyAccess() {
  console.log('Testing error property access fixes...');

  // Create test storage
  const storage = new FileSystemBinaryStorage('./test-storage');

  try {
    // This should trigger the error code access
    await storage.get('nonexistent-file');
    console.log('❌ Should have thrown an error');
  } catch (error) {
    console.log('✅ Error caught:', error.message);
    console.log('✅ Error type:', typeof error);
    console.log('✅ Has code property:', 'code' in error);
    console.log('✅ Error code:', error && typeof error === 'object' && error.code);
  }

  // Clean up
  try {
    fs.rmSync('./test-storage', { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

testErrorPropertyAccess().catch(console.error);
