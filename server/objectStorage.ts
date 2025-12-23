import { Storage, type StorageOptions } from '@google-cloud/storage';
import { randomUUID } from 'node:crypto';

/**
 * Object storage endpoint used by the Replit sidecar service.
 * Configurable via environment variable for flexibility.
 */
const REPLIT_SIDECAR_ENDPOINT = process.env.REPLIT_SIDECAR_ENDPOINT || 'http://127.0.0.1:1106';

/**
 * Shared Google Cloud Storage client configured for the Replit sidecar.
 * Centralising the client avoids repeated credential parsing.
 * Includes proper error handling for credential configuration.
 */
let objectStorageClient: Storage;

try {
  const externalAccountCredentials = {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account' as const,
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: 'json' as const,
        subject_token_field_name: 'access_token',
      },
    },
    universe_domain: 'googleapis.com',
  };

  // Validate external account credentials before creating client
  if (!externalAccountCredentials.token_url || !externalAccountCredentials.credential_source?.url) {
    throw new Error('Invalid external account credentials: missing required URLs');
  }

  // Properly typed StorageOptions configuration
  const storageOptions: StorageOptions = {
    credentials: externalAccountCredentials,
    projectId: process.env.GCS_PROJECT_ID || 'replit-default',
  };

  objectStorageClient = new Storage(storageOptions);
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage client:', error);
  throw new Error(
    `Google Cloud Storage initialization failed: ${error instanceof Error ? error.message : String(error)}`
  );
}

/**
 * Represents the parsed components of an object storage path.
 */
interface ObjectPath {
  bucketName: string;
  objectName: string;
}

/**
 * Enumerates the HTTP methods supported for signing URLs.
 */
type SignableHttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'HEAD';

/**
 * Defines the input required to sign a storage object URL.
 */
interface SignObjectUrlParams {
  bucketName: string;
  objectName: string;
  method: SignableHttpMethod;
  ttlSec: number;
}

/**
 * Expected payload from the Replit sidecar when requesting a signed URL.
 */
interface SignedUrlResponse {
  signed_url: string;
}

/**
 * Custom error for missing storage objects.
 * We extend Error to preserve stack traces and add a friendly name.
 */
class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = 'ObjectNotFoundError';
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * Service wrapper that encapsulates object storage workflows.
 * Injecting the client enables deterministic testing and easier overrides.
 */
class ObjectStorageService {
  public readonly objectStorageClient: Storage;

  constructor(storageClient: Storage = objectStorageClient) {
    this.objectStorageClient = storageClient;
  }

  /**
   * Retrieves the configured public search paths.
   * @returns string[] Sanitised list of whitelisted public prefixes.
   * @throws Error when PUBLIC_OBJECT_SEARCH_PATHS is missing.
   */
  getPublicObjectSearchPaths(): string[] {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? '';
    const paths = Array.from(
      new Set(
        pathsStr
          .split(',')
          .map(path => path.trim())
          .filter(path => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          'tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths).'
      );
    }
    return paths;
  }

  /**
   * Reads the private object directory from the environment.
   * @returns string The private directory prefix.
   * @throws Error when PRIVATE_OBJECT_DIR is missing.
   */
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR ?? '';
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  /**
   * Generates a signed upload URL for a new object entity.
   * @returns Promise<string> Signed PUT URL ready for upload.
   */
  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: 'PUT',
      ttlSec: 900,
    });
  }
}

/**
 * Parses a storage path into its bucket and object components.
 * @param path string Raw path string, optionally missing the leading slash.
 * @returns ObjectPath Parsed path metadata.
 * @throws Error for malformed paths.
 */
function parseObjectPath(path: string): ObjectPath {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  const pathParts = normalisedPath.split('/');
  if (pathParts.length < 3) {
    throw new Error('Invalid path: must contain at least a bucket name');
  }

  const bucketName = pathParts[1];
  if (!bucketName) {
    throw new Error('Invalid path: bucket segment missing');
  }

  const objectSegments = pathParts.slice(2);
  const objectName = objectSegments.join('/');
  if (!objectName) {
    throw new Error('Invalid path: object segment missing');
  }

  return { bucketName, objectName };
}

/**
 * Requests a signed URL for the provided object parameters.
 * @param params SignObjectUrlParams Bucket/object pair with method and TTL.
 * @returns Promise<string> Signed URL provided by the sidecar service.
 * @throws Error when the sidecar returns an unsuccessful status code.
 */
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: SignObjectUrlParams): Promise<string> {
  const requestPayload = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };

  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }

  const data = (await response.json()) as SignedUrlResponse;
  const signedURL = data.signed_url;
  if (typeof signedURL !== 'string' || signedURL.length === 0) {
    throw new Error('Sidecar response missing signed_url field');
  }

  return signedURL;
}

export {
  ObjectStorageService,
  ObjectNotFoundError,
  objectStorageClient,
  parseObjectPath,
  signObjectURL,
  type SignObjectUrlParams,
  type SignableHttpMethod,
  type ObjectPath,
};
