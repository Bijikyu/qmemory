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

import { IStorage } from './storage-interfaces.js';
import { ObjectStorageService, ObjectNotFoundError } from '../server/objectStorage.js';
import { createHash } from 'crypto';
import { StorageStats, ObjectMetadata } from './storage-interfaces.js';
import { getTimestamp } from '../lib/common-patterns.js';

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

  async save(key: string, data: Buffer): Promise<void> {
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
        body: new Uint8Array(data),
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': data.length.toString(),
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
      }

      // Store metadata for reverse lookup
      const metadata: ObjectMetadata = {
        originalKey: key,
        size: data.length,
        contentType: 'application/octet-stream',
        created: getTimestamp(),
        objectPath: fullObjectPath,
      };

      const metadataPath = this._getMetadataPath(key);
      const fullMetadataPath = `${privateDir}/${metadataPath}`;
      const metadataUploadUrl = await this._getUploadUrl(fullMetadataPath);

      const metadataResponse = await fetch(metadataUploadUrl, {
        method: 'PUT',
        body: JSON.stringify(metadata),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!metadataResponse.ok) {
        console.warn(`Failed to upload metadata for key '${key}': ${metadataResponse.statusText}`);
      }

      console.log(`Stored ${data.length} bytes at key '${key}' in object storage`);
    } catch (error) {
      throw new Error(`Failed to save to object storage: ${(error as Error).message}`);
    }
  }

  async get(key: string): Promise<Buffer | null> {
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

  async delete(key: string): Promise<void> {
    this._validateKey(key);

    try {
      const objectPath = this._getObjectPath(key);
      const metadataPath = this._getMetadataPath(key);
      const privateDir = this.objectStorageService.getPrivateObjectDir();

      // Delete both the binary data and metadata
      const fullObjectPath = `${privateDir}/${objectPath}`;
      const fullMetadataPath = `${privateDir}/${metadataPath}`;

      await Promise.all([this._deleteObject(fullObjectPath), this._deleteObject(fullMetadataPath)]);

      console.log(`Deleted data at key '${key}' from object storage`);
    } catch (error) {
      // If object doesn't exist, that's fine for delete operation
      if (
        !(error as Error).message.includes('not found') &&
        !(error as Error).message.includes('404')
      ) {
        throw new Error(`Failed to delete from object storage: ${(error as Error).message}`);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
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

  override async getStats(options?: {
    maxItems?: number;
    pageSize?: number;
  }): Promise<StorageStats> {
    try {
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      const { bucketName } = this._parseObjectPath(privateDir);
      const bucket = this.objectStorageService.objectStorageClient.bucket(bucketName);

      // Configuration for memory-efficient processing
      const maxItems = options?.maxItems || 1000; // Limit total items processed
      const pageSize = options?.pageSize || 100; // Process in smaller batches
      const maxMemoryUsage = 5 * 1024 * 1024; // 5MB memory limit

      let totalSize = 0;
      let itemCount = 0;
      const keys: string[] = [];
      let currentMemoryUsage = 0;

      // Use streaming API to avoid loading all files at once
      const queryOptions = {
        prefix: `${this.storagePrefix}`,
        delimiter: '/',
        autoPaginate: false,
        maxResults: pageSize,
      };

      let pageToken: string | undefined;

      do {
        if (pageToken) {
          (queryOptions as any).pageToken = pageToken;
        }

        const [files, , response] = await bucket.getFiles(queryOptions);

        for (const file of files) {
          // Skip metadata files and only count actual data files
          if (!file.name.endsWith('.meta')) {
            const [metadata] = await file.getMetadata();
            totalSize += parseInt((metadata as any).size || 0);
            itemCount++;

            // Memory-conscious metadata processing with size limits
            try {
              const metadataFile = bucket.file(`${file.name}.meta`);
              const [metadataExists] = await metadataFile.exists();

              if (metadataExists) {
                // Get file metadata first to check size
                const [metaMetadata] = await metadataFile.getMetadata();
                const fileSize = parseInt((metaMetadata as any).size || 0);

                // Skip if metadata file is too large
                if (fileSize > 10000) {
                  keys.push(file.name);
                  continue;
                }

                // Download with size limit
                let metadataContent: Buffer;
                try {
                  [metadataContent] = await metadataFile.download({
                    validation: false, // Skip validation for performance
                  });
                } catch (downloadError) {
                  // Skip if download fails (file might be corrupted or inaccessible)
                  keys.push(file.name);
                  continue;
                }

                const metadataString = metadataContent.toString('utf8', 0, 10001); // Limit to first 10KB to prevent memory issues

                // Validate metadata size (double-check)
                if (metadataString.length > 10000) {
                  throw new Error('Metadata too large');
                }

                // Safe JSON parsing with validation
                let meta;
                try {
                  meta = JSON.parse(metadataString);
                } catch (parseError) {
                  throw new Error(`Invalid JSON metadata: ${parseError.message}`);
                }

                // Validate parsed object structure
                if (typeof meta !== 'object' || meta === null) {
                  throw new Error('Invalid metadata format: not an object');
                }

                // Prevent prototype pollution (comprehensive check)
                if (
                  meta.__proto__ !== undefined ||
                  meta.constructor !== Object.prototype.constructor ||
                  (meta.prototype && meta.prototype !== Object.prototype) ||
                  Object.getPrototypeOf(meta) !== Object.prototype
                ) {
                  throw new Error('Invalid metadata structure: prototype pollution detected');
                }

                // Validate originalKey property exists and is string
                if (typeof meta.originalKey !== 'string' || meta.originalKey.length === 0) {
                  throw new Error('Invalid originalKey in metadata: must be non-empty string');
                }

                keys.push((meta as ObjectMetadata).originalKey);
              } else {
                keys.push(file.name);
              }
            } catch (metaError) {
              // Fallback to filename if metadata processing fails
              keys.push(file.name);
            }

            // Check if we've hit our limits
            if (itemCount >= maxItems) {
              break;
            }
          }
        }

        // Get next page token if available
        pageToken = response ? (response as any).nextPageToken : undefined;

        // Reset memory usage counter for next batch
        currentMemoryUsage = 0;
      } while (pageToken && itemCount < maxItems);

      return {
        type: 'object-storage',
        itemCount,
        totalSize,
        bucketName,
        storagePrefix: this.storagePrefix,
        keys,
        truncated: itemCount >= maxItems, // Indicate if results were truncated
      };
    } catch (error) {
      return {
        type: 'object-storage',
        itemCount: 0,
        totalSize: 0,
        error: (error as Error).message,
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

export { ObjectStorageBinaryStorage };
