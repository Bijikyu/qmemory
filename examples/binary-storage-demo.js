/**
 * Binary Storage Demo
 * 
 * Demonstrates the usage of the binary storage interface and implementations
 * for storing and retrieving binary data like images, documents, and other files.
 */

const {
  IStorage,
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage
} = require('../lib/binary-storage');

async function demonstrateBinaryStorage() {
  console.log('=== Binary Storage Demonstration ===\n');

  // 1. Using the default storage (memory-based)
  console.log('1. Using Default Storage:');
  const defaultStorage = getDefaultStorage();
  
  // Create some sample binary data (simulating an image file)
  const imageData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, // JPEG header
    0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, // JFIF header
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00 // Rest of JPEG data
  ]);
  
  await defaultStorage.save('profile-image.jpg', imageData);
  console.log(`✓ Saved profile image (${imageData.length} bytes)`);
  
  const retrievedImage = await defaultStorage.get('profile-image.jpg');
  console.log(`✓ Retrieved profile image (${retrievedImage.length} bytes)`);
  console.log(`✓ Data integrity check: ${Buffer.compare(imageData, retrievedImage) === 0 ? 'PASSED' : 'FAILED'}\n`);

  // 2. Using Memory Storage with custom size limit
  console.log('2. Using Memory Storage with Size Limit:');
  const memoryStorage = new MemoryBinaryStorage(1024 * 10); // 10KB limit
  
  const documentData = Buffer.from('This is a sample document content with some binary data mixed in.\x00\x01\x02\xFF');
  await memoryStorage.save('document.pdf', documentData);
  
  const stats = await memoryStorage.getStats();
  console.log(`✓ Storage stats: ${stats.itemCount} items, ${stats.totalSize} bytes (${stats.utilizationPercent}% full)`);
  console.log(`✓ Available keys: ${stats.keys.join(', ')}\n`);

  // 3. Using File System Storage
  console.log('3. Using File System Storage:');
  const fsStorage = new FileSystemBinaryStorage('./temp-storage');
  
  // Store multiple file types
  const textFile = Buffer.from('Hello, World! This is a text file.', 'utf8');
  const binaryFile = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // ZIP file header
  
  await Promise.all([
    fsStorage.save('readme.txt', textFile),
    fsStorage.save('archive.zip', binaryFile)
  ]);
  
  const fsStats = await fsStorage.getStats();
  console.log(`✓ File system storage: ${fsStats.itemCount} files, ${fsStats.totalSize} bytes`);
  console.log(`✓ Storage directory: ${fsStats.storageDir}`);
  console.log(`✓ Stored files: ${fsStats.keys.join(', ')}\n`);

  // 4. Using Storage Factory
  console.log('4. Using Storage Factory:');
  
  // Create different storage types via factory
  const factoryMemory = StorageFactory.createStorage({ 
    type: 'memory', 
    config: { maxSize: 5000 } 
  });
  
  const factoryFile = StorageFactory.createStorage({ 
    type: 'filesystem', 
    config: { storageDir: './factory-storage' } 
  });
  
  await factoryMemory.save('factory-test', Buffer.from('Factory memory test'));
  await factoryFile.save('factory-test', Buffer.from('Factory file test'));
  
  console.log(`✓ Factory memory storage exists: ${await factoryMemory.exists('factory-test')}`);
  console.log(`✓ Factory file storage exists: ${await factoryFile.exists('factory-test')}\n`);

  // 5. Demonstrating different data types
  console.log('5. Handling Different Data Types:');
  
  const storage = new MemoryBinaryStorage();
  
  // Text as binary
  const textData = Buffer.from('Hello, World!', 'utf8');
  await storage.save('text-file', textData);
  
  // JSON as binary
  const jsonData = Buffer.from(JSON.stringify({ name: 'John', age: 30 }), 'utf8');
  await storage.save('json-file', jsonData);
  
  // Raw binary data
  const rawBinary = Buffer.alloc(100);
  for (let i = 0; i < 100; i++) {
    rawBinary[i] = i % 256;
  }
  await storage.save('raw-binary', rawBinary);
  
  // Empty file
  const emptyFile = Buffer.alloc(0);
  await storage.save('empty-file', emptyFile);
  
  console.log('✓ Stored various data types:');
  console.log(`  - Text file: ${(await storage.get('text-file')).toString('utf8')}`);
  console.log(`  - JSON file: ${(await storage.get('json-file')).toString('utf8')}`);
  console.log(`  - Raw binary: ${(await storage.get('raw-binary')).length} bytes`);
  console.log(`  - Empty file: ${(await storage.get('empty-file')).length} bytes\n`);

  // 6. Error handling demonstration
  console.log('6. Error Handling:');
  
  try {
    await storage.save('', Buffer.from('test')); // Invalid key
  } catch (error) {
    console.log(`✓ Caught expected error: ${error.message}`);
  }
  
  try {
    await storage.save('test-key', 'not a buffer'); // Invalid data
  } catch (error) {
    console.log(`✓ Caught expected error: ${error.message}`);
  }
  
  const nonExistent = await storage.get('does-not-exist');
  console.log(`✓ Non-existent key returns: ${nonExistent}\n`);

  // 7. Cleanup demonstration
  console.log('7. Cleanup and Deletion:');
  
  await storage.save('temp-file', Buffer.from('temporary data'));
  console.log(`✓ Created temp file, exists: ${await storage.exists('temp-file')}`);
  
  await storage.delete('temp-file');
  console.log(`✓ Deleted temp file, exists: ${await storage.exists('temp-file')}`);
  
  const finalStats = await storage.getStats();
  console.log(`✓ Final storage stats: ${finalStats.itemCount} items, ${finalStats.totalSize} bytes\n`);

  console.log('=== Binary Storage Demo Complete ===');
}

async function runPerformanceTest() {
  console.log('\n=== Performance Test ===');
  
  const storage = new MemoryBinaryStorage();
  const testData = Buffer.alloc(1024, 0xAB); // 1KB of data
  const iterations = 1000;
  
  // Write performance test
  const writeStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await storage.save(`perf-test-${i}`, testData);
  }
  const writeTime = Date.now() - writeStart;
  
  // Read performance test
  const readStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await storage.get(`perf-test-${i}`);
  }
  const readTime = Date.now() - readStart;
  
  console.log(`✓ Write performance: ${iterations} operations in ${writeTime}ms (${(writeTime/iterations).toFixed(2)}ms per operation)`);
  console.log(`✓ Read performance: ${iterations} operations in ${readTime}ms (${(readTime/iterations).toFixed(2)}ms per operation)`);
  
  const stats = await storage.getStats();
  console.log(`✓ Total data stored: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
}

// Run the demonstration
if (require.main === module) {
  demonstrateBinaryStorage()
    .then(() => runPerformanceTest())
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

module.exports = {
  demonstrateBinaryStorage,
  runPerformanceTest
};