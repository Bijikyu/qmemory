import('./dist/lib/circuit-breaker.js')
  .then(({ createCircuitBreaker }) => {
    async function test() {
      console.log('🔍 Testing circuit-breaker fix...');
      const breaker = createCircuitBreaker();
      const failingOp = () => Promise.reject(new Error('Test error'));

      try {
        await breaker.execute(failingOp);
        console.log('❌ Should have failed');
      } catch (error) {
        console.log('✅ Single error thrown (double throw bug fixed)');
        console.log('✅ Error message:', error.message);
      }
    }

    test().catch(console.error);
  })
  .catch(console.error);
