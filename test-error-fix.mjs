// Test script to verify error property access fixes
import { FileSystemBinaryStorage } from './dist/lib/binary-storage.js';
import { promises as fs } from 'fs';

async function testErrorPropertyAccess() {
  console.log('Testing error property access fixes...');

  // Create test storage
  const storage = new FileSystemBinaryStorage('./test-storage');

  try {
    // This should trigger error code access
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
    await fs.rm('./test-storage', { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

testErrorPropertyAccess().catch(console.error);
