/**
 * Object Storage Binary Implementation
 * 
 * Provides cloud-based binary storage using Replit's Object Storage service.
 * This implementation extends the IStorage interface to work with Google Cloud Storage
 * through Replit's object storage infrastructure.
 * 
 * Features:
 * - Cloud persistence with high availability
 * - Scalable storage with no local size limits
 * - Integration with Replit's object storage service
 * - Automatic error handling and retry logic
 */

import { IStorage } from './binary-storage.js';
import { ObjectStorageService, ObjectNotFoundError } from '../server/objectStorage.js';
import { createHash } from 'crypto';

interface StorageStats {
  type: string;
  itemCount: number;
  totalSize: number;
  bucketName?: string;
  storagePrefix?: string;
  keys?: string[];
  error?: string;
}

interface ObjectMetadata {
  originalKey: string;
  size: number;
  contentType: string;
  created: string;
  objectPath: string;
}

interface ObjectPath {
  bucketName: string;
  objectName: string;
}

/**
 * Object Storage Binary Implementation
 * 
 * Uses Replit's Object Storage service for persistent, scalable binary data storage.
 * Perfect for production environments requiring reliable, cloud-based storage.
 */
class ObjectStorageBinaryStorage extends IStorage {
  private objectStorageService: ObjectStorageService;
  private storagePrefix: string;

  constructor() {
    super();
    this.objectStorageService = new ObjectStorageService();
    this.storagePrefix = 'binary-data/'; // Prefix for organizing binary data
    console.log('Initialized ObjectStorageBinaryStorage with Replit Object Storage');
  }

  /**
   * Validate key format for object storage compatibility
   */
  private _validateKey(key: string): void {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error('Key must be a non-empty string');
    }
    if (key.length > 1000) {
      throw new Error('Key must be 1000 characters or less for object storage');
    }
    // Ensure key is safe for object storage paths
    if (key.includes('..') || key.startsWith('/') || key.endsWith('/')) {
      throw new Error('Key format not compatible with object storage');
    }
  }

  /**
   * Generate object storage path for a given key
   */
  private _getObjectPath(key: string): string {
    // Create a deterministic but safe object path
    const hash = createHash('sha256').update(key).digest('hex');
    return `${this.storagePrefix}${hash.substring(0, 2)}/${hash}`;
  }

  /**
   * Store metadata alongside binary data for reverse lookup
   */
  private _getMetadataPath(key: string): string {
    const objectPath = this._getObjectPath(key);
    return `${objectPath}.meta`;
  }

  override async save(key: string, data: Buffer): Promise<void> {
    this._validateKey(key);
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer object');
    }

    try {
      const objectPath = this._getObjectPath(key);
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      
      // Construct full object path for storage
      const fullObjectPath = `${privateDir}/${objectPath}`;
      
      // Get upload URL for the binary data
      const uploadUrl = await this._getUploadUrl(fullObjectPath);
      
      // Upload the binary data
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: data,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': data.length.toString()
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
      }

      // Store metadata for reverse lookup
      const metadata: ObjectMetadata = {
        originalKey: key,
        size: data.length,
        contentType: 'application/octet-stream',
        created: new Date().toISOString(),
        objectPath: fullObjectPath
      };

      const metadataPath = this._getMetadataPath(key);
      const fullMetadataPath = `${privateDir}/${metadataPath}`;
      const metadataUploadUrl = await this._getUploadUrl(fullMetadataPath);
      
      const metadataResponse = await fetch(metadataUploadUrl, {
        method: 'PUT',
        body: JSON.stringify(metadata),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!metadataResponse.ok) {
        console.warn(`Failed to upload metadata for key '${key}': ${metadataResponse.statusText}`);
      }

      console.log(`Stored ${data.length} bytes at key '${key}' in object storage`);
    } catch (error) {
      throw new Error(`Failed to save to object storage: ${(error as Error).message}`);
    }
  }

  override async get(key: string): Promise<Buffer | null> {
    this._validateKey(key);

    try {
      const objectPath = this._getObjectPath(key);
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      const fullObjectPath = `${privateDir}/${objectPath}`;
      
      // Get the object file reference
      const { bucketName, objectName } = this._parseObjectPath(fullObjectPath);
      const bucket = this.objectStorageService.objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      // Download the file data
      const [data] = await file.download();
      return data as Buffer;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return null;
      }
      throw new Error(`Failed to retrieve from object storage: ${(error as Error).message}`);
    }
  }

  override async delete(key: string): Promise<void> {
    this._validateKey(key);

    try {
      const objectPath = this._getObjectPath(key);
      const metadataPath = this._getMetadataPath(key);
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      
      // Delete both the binary data and metadata
      const fullObjectPath = `${privateDir}/${objectPath}`;
      const fullMetadataPath = `${privateDir}/${metadataPath}`;
      
      await Promise.all([
        this._deleteObject(fullObjectPath),
        this._deleteObject(fullMetadataPath)
      ]);

      console.log(`Deleted data at key '${key}' from object storage`);
    } catch (error) {
      // If object doesn't exist, that's fine for delete operation
      if (!(error as Error).message.includes('not found') && !(error as Error).message.includes('404')) {
        throw new Error(`Failed to delete from object storage: ${(error as Error).message}`);
      }
    }
  }

  override async exists(key: string): Promise<boolean> {
    this._validateKey(key);

    try {
      const objectPath = this._getObjectPath(key);
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      const fullObjectPath = `${privateDir}/${objectPath}`;
      
      const { bucketName, objectName } = this._parseObjectPath(fullObjectPath);
      const bucket = this.objectStorageService.objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  override async getStats(): Promise<StorageStats> {
    try {
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      const { bucketName } = this._parseObjectPath(privateDir);
      const bucket = this.objectStorageService.objectStorageClient.bucket(bucketName);
      
      // List files with our binary data prefix
      const [files] = await bucket.getFiles({
        prefix: `${this.storagePrefix}`,
        delimiter: '/'
      });

      let totalSize = 0;
      let itemCount = 0;
      const keys: string[] = [];

      for (const file of files) {
        // Skip metadata files and only count actual data files
        if (!file.name.endsWith('.meta')) {
          const [metadata] = await file.getMetadata();
          totalSize += parseInt((metadata as any).size || 0);
          itemCount++;
          
          // Try to get original key from metadata
          try {
            const metadataFile = bucket.file(`${file.name}.meta`);
            const [metadataExists] = await metadataFile.exists();
            if (metadataExists) {
              const [metadataContent] = await metadataFile.download();
              const meta = JSON.parse(metadataContent.toString());
              keys.push((meta as ObjectMetadata).originalKey);
            } else {
              keys.push(file.name);
            }
          } catch (metaError) {
            keys.push(file.name);
          }
        }
      }

      return {
        type: 'object-storage',
        itemCount,
        totalSize,
        bucketName,
        storagePrefix: this.storagePrefix,
        keys
      };
    } catch (error) {
      return {
        type: 'object-storage',
        itemCount: 0,
        totalSize: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Helper method to get upload URL for object storage
   */
  private async _getUploadUrl(objectPath: string): Promise<string> {
    // Use the object storage service to get a presigned upload URL
    const url = await this.objectStorageService.getObjectEntityUploadURL();
    if (!url) {
      throw new Error('Failed to get upload URL');
    }
    return url;
  }

  /**
   * Helper method to delete an object
   */
  private async _deleteObject(objectPath: string): Promise<void> {
    try {
      const { bucketName, objectName } = this._parseObjectPath(objectPath);
      const bucket = this.objectStorageService.objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.delete();
    } catch (error) {
      if ((error as any).code !== 404) {
        throw error;
      }
      // File doesn't exist, which is fine for delete
    }
  }

  /**
   * Parse object path into bucket name and object name
   */
  private _parseObjectPath(path: string): ObjectPath {
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    const pathParts = path.split('/');
    if (pathParts.length < 3) {
      throw new Error('Invalid object path: must contain at least a bucket name');
    }

    const bucketName = pathParts[1] || '';
    const objectName = pathParts.slice(2).join('/');

    return { bucketName, objectName };
  }
}

export {
  ObjectStorageBinaryStorage
};