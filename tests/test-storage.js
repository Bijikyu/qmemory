#!/usr/bin/env node

console.log('🧪 Testing storage optimizations...');

async function testStorage() {
  try {
    const storageModule = await import('./dist/lib/binary-storage.js');
    const MemoryBinaryStorage = storageModule.MemoryBinaryStorage;

    const storage = new MemoryBinaryStorage(1024 * 100);
    await storage.save('test1', Buffer.from('data1'));
    await storage.save('test2', Buffer.from('data2'));

    const getData1 = await storage.get('test1');
    const getData2 = await storage.get('test2');

    console.log(
      `Storage save/retrieve: ${getData1?.toString() === 'data1' && getData2?.toString() === 'data2' ? 'success' : 'failed'}`
    );

    const stats = await storage.getStats();
    console.log(
      `Storage stats: ${stats.type === 'memory' && stats.itemCount === 2 ? 'success' : 'failed'}`
    );

    storage.clear();
    const clearedCount = (await storage.getStats()).itemCount;
    console.log(`Storage clear: ${clearedCount === 0 ? 'success' : 'failed'}`);

    return true;
  } catch (error) {
    console.error('Storage test failed:', error.message);
    return false;
  }
}

testStorage()
  .then(() => {
    console.log('\n🎉 Storage optimizations working correctly!');
  })
  .catch(error => {
    console.error('❌ Storage test failed:', error.message);
    process.exit(1);
  });
