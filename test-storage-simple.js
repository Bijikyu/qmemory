#!/usr/bin/env node

const { MemoryBinaryStorage } = require('./dist/lib/binary-storage.js');

async function testStorageBasic() {
  console.log('Testing basic MemoryBinaryStorage...');

  const storage = new MemoryBinaryStorage(1024);
  await storage.save('test1', Buffer.from('data1'));
  await storage.save('test2', Buffer.from('data2'));

  const getData1 = await storage.get('test1');
  const getData2 = await storage.get('test2');

  console.log(
    'Save/retrieve test:',
    getData1?.toString() === 'data1' && getData2?.toString() === 'data2' ? 'PASS' : 'FAIL'
  );

  await storage.clear();
  const stats = await storage.getStats();
  console.log('Clear test:', stats.itemCount === 0 ? 'PASS' : 'FAIL');

  return true;
}

testStorageBasic()
  .then(() => console.log('\n✅ Storage test passed'))
  .catch(error => {
    console.error('\n❌ Storage test failed:', error.message);
    process.exit(1);
  });
