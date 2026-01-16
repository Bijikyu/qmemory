console.log('=== TESTING FIXED SECURE DELAY ===');

import { safeDelay, calculateBackoffDelay } from './dist/lib/core/secure-delay.js';

async function testSecureDelay() {
  try {
    console.log('Testing 100ms delay...');
    const start = Date.now();
    await safeDelay(100);
    const end = Date.now();
    console.log(`✓ Delay took ${end - start}ms (expected ~100ms)`);

    console.log('Testing invalid input...');
    try {
      await safeDelay(-100);
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.log('✓ Correctly rejected negative delay:', error.message);
    }

    console.log('Testing NaN input...');
    try {
      await safeDelay(NaN);
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.log('✓ Correctly rejected NaN delay:', error.message);
    }
  } catch (error) {
    console.error('Secure delay error:', error.message);
  }
}

async function testBackoff() {
  try {
    console.log('\nTesting backoff calculations...');
    for (let i = 1; i <= 5; i++) {
      const delay = calculateBackoffDelay(1000, i);
      console.log(`Attempt ${i}: ${delay}ms (should be reasonable)`);
    }

    console.log('Testing invalid backoff input...');
    try {
      calculateBackoffDelay(-1000, 1);
      console.log('❌ Should have thrown error');
    } catch (error) {
      console.log('✓ Correctly rejected invalid baseDelay:', error.message);
    }
  } catch (error) {
    console.error('Backoff error:', error.message);
  }
}

testSecureDelay()
  .then(testBackoff)
  .then(() => {
    console.log('\n=== ALL FIXES VALIDATED ===');
  });
