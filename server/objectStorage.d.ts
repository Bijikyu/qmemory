import { Storage } from '@google-cloud/storage';
/**
 * Shared Google Cloud Storage client configured for the Replit sidecar.
 * Centralising the client avoids repeated credential parsing.
 * Includes proper error handling for credential configuration.
 */
declare let objectStorageClient: Storage;
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
 * Custom error for missing storage objects.
 * We extend Error to preserve stack traces and add a friendly name.
 */
declare class ObjectNotFoundError extends Error {
    constructor();
}
/**
 * Service wrapper that encapsulates object storage workflows.
 * Injecting the client enables deterministic testing and easier overrides.
 */
declare class ObjectStorageService {
    readonly objectStorageClient: Storage;
    constructor(storageClient?: Storage);
    /**
     * Retrieves the configured public search paths.
     * @returns string[] Sanitised list of whitelisted public prefixes.
     * @throws Error when PUBLIC_OBJECT_SEARCH_PATHS is missing.
     */
    getPublicObjectSearchPaths(): string[];
    /**
     * Reads the private object directory from the environment.
     * @returns string The private directory prefix.
     * @throws Error when PRIVATE_OBJECT_DIR is missing.
     */
    getPrivateObjectDir(): string;
    /**
     * Generates a signed upload URL for a new object entity.
     * @returns Promise<string> Signed PUT URL ready for upload.
     */
    getObjectEntityUploadURL(): Promise<string>;
}
/**
 * Parses a storage path into its bucket and object components.
 * @param path string Raw path string, optionally missing the leading slash.
 * @returns ObjectPath Parsed path metadata.
 * @throws Error for malformed paths.
 */
declare function parseObjectPath(path: string): ObjectPath;
/**
 * Requests a signed URL for the provided object parameters.
 * @param params SignObjectUrlParams Bucket/object pair with method and TTL.
 * @returns Promise<string> Signed URL provided by the sidecar service.
 * @throws Error when the sidecar returns an unsuccessful status code.
 */
declare function signObjectURL({ bucketName, objectName, method, ttlSec, }: SignObjectUrlParams): Promise<string>;
export { ObjectStorageService, ObjectNotFoundError, objectStorageClient, parseObjectPath, signObjectURL, type SignObjectUrlParams, type SignableHttpMethod, type ObjectPath, };
//# sourceMappingURL=objectStorage.d.ts.map