/**
 * Binary Storage Tests
 * 
 * Comprehensive test suite for all binary storage implementations:
 * - Interface compliance testing
 * - Memory storage functionality
 * - File system storage functionality
 * - Storage factory functionality
 * - Error handling and edge cases
 */

const {
  IStorage,
  MemoryBinaryStorage,
  FileSystemBinaryStorage,
  StorageFactory,
  getDefaultStorage
} = require('../../lib/binary-storage');

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Binary Storage', () => {
  describe('IStorage Interface', () => {
    test('should define the required interface methods', () => {
      const storage = new IStorage();
      
      expect(typeof storage.save).toBe('function');
      expect(typeof storage.get).toBe('function');
      expect(typeof storage.delete).toBe('function');
      expect(typeof storage.exists).toBe('function');
      expect(typeof storage.getStats).toBe('function');
    });

    test('should throw errors for unimplemented methods', async () => {
      const storage = new IStorage();
      
      await expect(storage.save('key', Buffer.from('data'))).rejects.toThrow('save method must be implemented');
      await expect(storage.get('key')).rejects.toThrow('get method must be implemented');
      await expect(storage.delete('key')).rejects.toThrow('delete method must be implemented');
      await expect(storage.exists('key')).rejects.toThrow('exists method must be implemented');
    });

    test('should provide default stats implementation', async () => {
      const storage = new IStorage();
      const stats = await storage.getStats();
      
      expect(stats).toEqual({
        type: 'unknown',
        itemCount: 0,
        totalSize: 0
      });
    });
  });

  describe('MemoryBinaryStorage', () => {
    let storage;

    beforeEach(() => {
      storage = new MemoryBinaryStorage();
    });

    afterEach(async () => {
      await storage.clear();
    });

    describe('Basic Operations', () => {
      test('should save and retrieve binary data', async () => {
        const key = 'test-image';
        const data = Buffer.from('binary image data', 'utf8');
        
        await storage.save(key, data);
        const retrieved = await storage.get(key);
        
        expect(retrieved).toEqual(data);
        expect(Buffer.isBuffer(retrieved)).toBe(true);
      });

      test('should return null for non-existent keys', async () => {
        const result = await storage.get('non-existent-key');
        expect(result).toBeNull();
      });

      test('should check existence correctly', async () => {
        const key = 'test-key';
        const data = Buffer.from('test data');
        
        expect(await storage.exists(key)).toBe(false);
        
        await storage.save(key, data);
        expect(await storage.exists(key)).toBe(true);
        
        await storage.delete(key);
        expect(await storage.exists(key)).toBe(false);
      });

      test('should delete stored data', async () => {
        const key = 'delete-test';
        const data = Buffer.from('data to delete');
        
        await storage.save(key, data);
        expect(await storage.exists(key)).toBe(true);
        
        await storage.delete(key);
        expect(await storage.exists(key)).toBe(false);
        expect(await storage.get(key)).toBeNull();
      });

      test('should handle deleting non-existent keys gracefully', async () => {
        await expect(storage.delete('non-existent')).resolves.not.toThrow();
      });
    });

    describe('Data Integrity', () => {
      test('should store and retrieve data without corruption', async () => {
        const originalData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
        
        await storage.save('binary-test', originalData);
        const retrievedData = await storage.get('binary-test');
        
        expect(retrievedData).toEqual(originalData);
        expect(retrievedData.length).toBe(originalData.length);
        
        // Verify each byte
        for (let i = 0; i < originalData.length; i++) {
          expect(retrievedData[i]).toBe(originalData[i]);
        }
      });

      test('should handle empty buffers', async () => {
        const emptyBuffer = Buffer.alloc(0);
        
        await storage.save('empty', emptyBuffer);
        const retrieved = await storage.get('empty');
        
        expect(retrieved).toEqual(emptyBuffer);
        expect(retrieved.length).toBe(0);
      });

      test('should handle large buffers', async () => {
        const largeBuffer = Buffer.alloc(1024 * 1024, 0xAB); // 1MB of 0xAB
        
        await storage.save('large', largeBuffer);
        const retrieved = await storage.get('large');
        
        expect(retrieved.length).toBe(largeBuffer.length);
        expect(retrieved[0]).toBe(0xAB);
        expect(retrieved[retrieved.length - 1]).toBe(0xAB);
      });

      test('should return copies of data to prevent external mutation', async () => {
        const originalData = Buffer.from([1, 2, 3, 4]);
        
        await storage.save('mutation-test', originalData);
        const retrieved1 = await storage.get('mutation-test');
        const retrieved2 = await storage.get('mutation-test');
        
        // Modify one copy
        retrieved1[0] = 99;
        
        // Other copy should be unchanged
        expect(retrieved2[0]).toBe(1);
        
        // Original stored data should be unchanged
        const retrieved3 = await storage.get('mutation-test');
        expect(retrieved3[0]).toBe(1);
      });
    });

    describe('Key Validation', () => {
      test('should reject invalid keys', async () => {
        const data = Buffer.from('test');
        
        await expect(storage.save('', data)).rejects.toThrow('Key must be a non-empty string');
        await expect(storage.save(123, data)).rejects.toThrow('Key must be a non-empty string');
        await expect(storage.save(null, data)).rejects.toThrow('Key must be a non-empty string');
        await expect(storage.save(undefined, data)).rejects.toThrow('Key must be a non-empty string');
      });

      test('should reject keys with path separators', async () => {
        const data = Buffer.from('test');
        
        await expect(storage.save('key/with/slash', data)).rejects.toThrow('Key cannot contain path separators');
        await expect(storage.save('key\\with\\backslash', data)).rejects.toThrow('Key cannot contain path separators');
        await expect(storage.save('../relative', data)).rejects.toThrow('Key cannot contain path separators');
      });

      test('should reject overly long keys', async () => {
        const longKey = 'a'.repeat(251);
        const data = Buffer.from('test');
        
        await expect(storage.save(longKey, data)).rejects.toThrow('Key must be 250 characters or less');
      });
    });

    describe('Data Validation', () => {
      test('should reject non-Buffer data', async () => {
        await expect(storage.save('key', 'string')).rejects.toThrow('Data must be a Buffer object');
        await expect(storage.save('key', 123)).rejects.toThrow('Data must be a Buffer object');
        await expect(storage.save('key', {})).rejects.toThrow('Data must be a Buffer object');
        await expect(storage.save('key', null)).rejects.toThrow('Data must be a Buffer object');
      });
    });

    describe('Size Management', () => {
      test('should track storage size correctly', async () => {
        const data1 = Buffer.from('hello');
        const data2 = Buffer.from('world');
        
        await storage.save('key1', data1);
        await storage.save('key2', data2);
        
        const stats = await storage.getStats();
        expect(stats.totalSize).toBe(data1.length + data2.length);
        expect(stats.itemCount).toBe(2);
      });

      test('should enforce size limits', async () => {
        const smallStorage = new MemoryBinaryStorage(100); // 100 byte limit
        const largeData = Buffer.alloc(150, 0xFF);
        
        await expect(smallStorage.save('large', largeData)).rejects.toThrow('Storage size limit exceeded');
      });

      test('should update size when replacing existing data', async () => {
        const smallData = Buffer.from('small');
        const largeData = Buffer.from('much larger data string');
        
        await storage.save('key', smallData);
        const stats1 = await storage.getStats();
        
        await storage.save('key', largeData);
        const stats2 = await storage.getStats();
        
        expect(stats2.totalSize).toBe(largeData.length);
        expect(stats2.itemCount).toBe(1);
        expect(stats2.totalSize - stats1.totalSize).toBe(largeData.length - smallData.length);
      });

      test('should decrease size when deleting data', async () => {
        const data = Buffer.from('data to delete');
        
        await storage.save('key', data);
        const statsBefore = await storage.getStats();
        
        await storage.delete('key');
        const statsAfter = await storage.getStats();
        
        expect(statsAfter.totalSize).toBe(statsBefore.totalSize - data.length);
        expect(statsAfter.itemCount).toBe(statsBefore.itemCount - 1);
      });
    });

    describe('Statistics', () => {
      test('should provide accurate statistics', async () => {
        await storage.save('key1', Buffer.from('data1'));
        await storage.save('key2', Buffer.from('data2'));
        await storage.save('key3', Buffer.from('data3'));
        
        const stats = await storage.getStats();
        
        expect(stats.type).toBe('memory');
        expect(stats.itemCount).toBe(3);
        expect(stats.totalSize).toBe(15); // 'data1' + 'data2' + 'data3'
        expect(stats.keys).toEqual(expect.arrayContaining(['key1', 'key2', 'key3']));
        expect(stats.utilizationPercent).toBeDefined();
        expect(typeof stats.utilizationPercent).toBe('number');
      });

      test('should calculate utilization percentage correctly', async () => {
        const storage = new MemoryBinaryStorage(1000);
        await storage.save('key', Buffer.alloc(250));
        
        const stats = await storage.getStats();
        expect(stats.utilizationPercent).toBe(25);
      });
    });

    describe('Clear Functionality', () => {
      test('should clear all data', async () => {
        await storage.save('key1', Buffer.from('data1'));
        await storage.save('key2', Buffer.from('data2'));
        
        await storage.clear();
        
        expect(await storage.exists('key1')).toBe(false);
        expect(await storage.exists('key2')).toBe(false);
        
        const stats = await storage.getStats();
        expect(stats.itemCount).toBe(0);
        expect(stats.totalSize).toBe(0);
      });
    });
  });

  describe('FileSystemBinaryStorage', () => {
    let storage;
    let tempDir;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'binary-storage-test-'));
      storage = new FileSystemBinaryStorage(tempDir);
    });

    afterEach(async () => {
      try {
        await fs.rmdir(tempDir, { recursive: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('Basic Operations', () => {
      test('should save and retrieve binary data from file system', async () => {
        const key = 'test-file';
        const data = Buffer.from('file system test data', 'utf8');
        
        await storage.save(key, data);
        const retrieved = await storage.get(key);
        
        expect(retrieved).toEqual(data);
        expect(Buffer.isBuffer(retrieved)).toBe(true);
      });

      test('should return null for non-existent files', async () => {
        const result = await storage.get('non-existent-key');
        expect(result).toBeNull();
      });

      test('should check file existence correctly', async () => {
        const key = 'existence-test';
        const data = Buffer.from('test data');
        
        expect(await storage.exists(key)).toBe(false);
        
        await storage.save(key, data);
        expect(await storage.exists(key)).toBe(true);
        
        await storage.delete(key);
        expect(await storage.exists(key)).toBe(false);
      });

      test('should delete files correctly', async () => {
        const key = 'delete-test';
        const data = Buffer.from('data to delete');
        
        await storage.save(key, data);
        expect(await storage.exists(key)).toBe(true);
        
        await storage.delete(key);
        expect(await storage.exists(key)).toBe(false);
        expect(await storage.get(key)).toBeNull();
      });

      test('should handle deleting non-existent files gracefully', async () => {
        await expect(storage.delete('non-existent')).resolves.not.toThrow();
      });
    });

    describe('File System Integration', () => {
      test('should create storage directory if it does not exist', async () => {
        const newDir = path.join(tempDir, 'new-storage-dir');
        const newStorage = new FileSystemBinaryStorage(newDir);
        
        await newStorage.save('test', Buffer.from('data'));
        
        const dirExists = await fs.access(newDir).then(() => true).catch(() => false);
        expect(dirExists).toBe(true);
      });

      test('should handle concurrent operations safely', async () => {
        const promises = [];
        
        for (let i = 0; i < 10; i++) {
          promises.push(storage.save(`key${i}`, Buffer.from(`data${i}`)));
        }
        
        await Promise.all(promises);
        
        for (let i = 0; i < 10; i++) {
          const exists = await storage.exists(`key${i}`);
          expect(exists).toBe(true);
        }
      });

      test('should persist data across storage instances', async () => {
        const key = 'persistence-test';
        const data = Buffer.from('persistent data');
        
        await storage.save(key, data);
        
        // Create new storage instance pointing to same directory
        const newStorage = new FileSystemBinaryStorage(tempDir);
        const retrieved = await newStorage.get(key);
        
        expect(retrieved).toEqual(data);
      });
    });

    describe('Key Safety', () => {
      test('should handle special characters in keys safely', async () => {
        const specialKeys = [
          'key-with-dashes',
          'key_with_underscores',
          'key.with.dots',
          'key with spaces',
          'key@with#special$chars',
          'key(with)parentheses'
        ];
        
        for (const key of specialKeys) {
          const data = Buffer.from(`data for ${key}`);
          await storage.save(key, data);
          const retrieved = await storage.get(key);
          expect(retrieved).toEqual(data);
        }
      });

      test('should reject dangerous keys', async () => {
        const dangerousKeys = [
          '../escape',
          'path/with/slash',
          'path\\with\\backslash',
          'key\0with\0null'
        ];
        
        const data = Buffer.from('test');
        
        for (const key of dangerousKeys) {
          await expect(storage.save(key, data)).rejects.toThrow();
        }
      });
    });

    describe('Statistics', () => {
      test('should provide file system statistics', async () => {
        await storage.save('file1', Buffer.from('content1'));
        await storage.save('file2', Buffer.from('content2'));
        
        const stats = await storage.getStats();
        
        expect(stats.type).toBe('filesystem');
        expect(stats.itemCount).toBe(2);
        expect(stats.totalSize).toBeGreaterThan(0);
        expect(stats.storageDir).toBe(tempDir);
        expect(stats.keys).toEqual(expect.arrayContaining(['file1', 'file2']));
      });

      test('should handle statistics for empty storage', async () => {
        const stats = await storage.getStats();
        
        expect(stats.type).toBe('filesystem');
        expect(stats.itemCount).toBe(0);
        expect(stats.totalSize).toBe(0);
      });
    });
  });

  describe('StorageFactory', () => {
    test('should create memory storage by default', () => {
      const storage = StorageFactory.createStorage();
      expect(storage).toBeInstanceOf(MemoryBinaryStorage);
    });

    test('should create memory storage with custom config', () => {
      const storage = StorageFactory.createStorage({
        type: 'memory',
        config: { maxSize: 5000 }
      });
      expect(storage).toBeInstanceOf(MemoryBinaryStorage);
      expect(storage.maxSize).toBe(5000);
    });

    test('should create file system storage', () => {
      const storage = StorageFactory.createStorage({
        type: 'filesystem',
        config: { storageDir: './test-storage' }
      });
      expect(storage).toBeInstanceOf(FileSystemBinaryStorage);
    });

    test('should create file system storage with "file" alias', () => {
      const storage = StorageFactory.createStorage({ type: 'file' });
      expect(storage).toBeInstanceOf(FileSystemBinaryStorage);
    });

    test('should fall back to memory storage for unknown types', () => {
      const storage = StorageFactory.createStorage({ type: 'unknown' });
      expect(storage).toBeInstanceOf(MemoryBinaryStorage);
    });

    test('should create storage from environment variables', () => {
      // Test with default environment (no variables set)
      const storage = StorageFactory.createFromEnvironment();
      expect(storage).toBeInstanceOf(MemoryBinaryStorage);
    });
  });

  describe('Default Storage', () => {
    test('should provide a default storage instance', () => {
      const storage1 = getDefaultStorage();
      const storage2 = getDefaultStorage();
      
      expect(storage1).toBe(storage2); // Should be the same instance (singleton)
      expect(storage1).toBeInstanceOf(MemoryBinaryStorage);
    });
  });

  describe('Error Handling', () => {
    test('should provide meaningful error messages', async () => {
      const storage = new MemoryBinaryStorage();
      
      try {
        await storage.save('', Buffer.from('data'));
      } catch (error) {
        expect(error.message).toContain('Key must be a non-empty string');
      }
      
      try {
        await storage.save('key', 'not a buffer');
      } catch (error) {
        expect(error.message).toContain('Data must be a Buffer object');
      }
    });

    test('should handle storage errors gracefully', async () => {
      const storage = new FileSystemBinaryStorage('/invalid/path/that/cannot/exist');
      
      await expect(storage.save('key', Buffer.from('data'))).rejects.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    test('memory storage should be fast for small datasets', async () => {
      const storage = new MemoryBinaryStorage();
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        await storage.save(`key${i}`, Buffer.from(`data${i}`));
      }
      
      const saveTime = Date.now() - start;
      expect(saveTime).toBeLessThan(1000); // Should complete in under 1 second
      
      const readStart = Date.now();
      for (let i = 0; i < 100; i++) {
        await storage.get(`key${i}`);
      }
      const readTime = Date.now() - readStart;
      expect(readTime).toBeLessThan(500); // Reads should be even faster
    });
  });
});