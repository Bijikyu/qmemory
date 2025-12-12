/**
 * Streaming JSON Serializer
 * Memory-efficient JSON handling for large payloads
 * 
 * Features:
 * - Chunked serialization to prevent large memory allocations
 * - Size estimation before serialization
 * - Safe stringify with automatic truncation
 * - Streaming parser with buffer overflow protection
 * 
 * Use cases:
 * - Large JSON API responses
 * - File processing with JSON data
 * - Data streaming applications
 * - Logging large objects safely
 */

const DEFAULT_MAX_CHUNK_SIZE = 4096;
const DEFAULT_MAX_SIZE = 500000;
const DEFAULT_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

/**
 * Estimates JSON string size before serialization
 * 
 * @param {*} obj - Object to estimate size for
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {number} Estimated size in bytes
 */
function estimateJsonSize(obj, depth = 0, maxDepth = 100) {
  if (depth > maxDepth) {
    return 50;
  }

  if (obj === null) return 4;
  if (obj === undefined) return 0;

  const type = typeof obj;

  if (type === 'string') return obj.length + 2;
  if (type === 'number') return String(obj).length;
  if (type === 'boolean') return obj ? 4 : 5;

  if (Array.isArray(obj)) {
    let size = 2; // []
    for (let i = 0; i < obj.length; i++) {
      size += estimateJsonSize(obj[i], depth + 1, maxDepth);
      if (i < obj.length - 1) size += 1; // comma
    }
    return size;
  }

  if (type === 'object') {
    const keys = Object.keys(obj);
    let size = 2; // {}
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = obj[key];
      if (value === undefined) continue;
      size += key.length + 3; // "key":
      size += estimateJsonSize(value, depth + 1, maxDepth);
      if (i < keys.length - 1) size += 1; // comma
    }
    return size;
  }

  if (type === 'function') return 0;
  if (type === 'symbol') return 0;
  if (type === 'bigint') return String(obj).length;

  return 50;
}

/**
 * Generator that streams JSON serialization in chunks
 * 
 * @param {*} obj - Object to serialize
 * @param {Object} options - Serialization options
 * @param {number} options.maxChunkSize - Maximum chunk size (default: 4096)
 * @param {number} options.indent - Indentation spaces (default: 0)
 * @param {number} options.sizeLimit - Maximum object size limit (default: 10MB)
 * @yields {string} JSON chunks
 */
function* streamJsonStringify(obj, options = {}) {
  const {
    maxChunkSize = DEFAULT_MAX_CHUNK_SIZE,
    indent = 0,
    sizeLimit = DEFAULT_SIZE_LIMIT
  } = options;

  const estimatedSize = estimateJsonSize(obj);
  if (estimatedSize > sizeLimit) {
    throw new Error(
      `Object too large for streaming serialization (${Math.round(estimatedSize / (1024 * 1024))}MB exceeds ${Math.round(sizeLimit / (1024 * 1024))}MB limit)`
    );
  }

  const jsonString = JSON.stringify(obj, null, indent);

  if (jsonString.length <= maxChunkSize) {
    yield jsonString;
    return;
  }

  let pos = 0;
  while (pos < jsonString.length) {
    const end = Math.min(pos + maxChunkSize, jsonString.length);
    yield jsonString.substring(pos, end);
    pos = end;
  }
}

/**
 * Async generator for streaming JSON with backpressure support
 * 
 * @param {*} obj - Object to serialize
 * @param {Object} options - Serialization options
 * @param {number} options.maxChunkSize - Maximum chunk size
 * @param {number} options.delayMs - Delay between chunks for backpressure
 * @yields {string} JSON chunks
 */
async function* streamJsonStringifyAsync(obj, options = {}) {
  const { delayMs = 0 } = options;

  for (const chunk of streamJsonStringify(obj, options)) {
    yield chunk;
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Truncates object for logging to prevent large allocations
 * 
 * @param {*} obj - Object to truncate
 * @param {number} maxSize - Maximum target size
 * @param {number} depth - Current recursion depth
 * @returns {*} Truncated object
 */
function truncateObjectForLogging(obj, maxSize = DEFAULT_MAX_SIZE, depth = 0) {
  if (depth > 50) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;

  const type = typeof obj;

  if (type === 'string') {
    const truncateLength = Math.max(0, maxSize - 15);
    if (obj.length <= truncateLength) return obj;
    return obj.substring(0, truncateLength) + '...[TRUNCATED]';
  }

  if (type !== 'object') return obj;

  if (Array.isArray(obj)) {
    const truncatedArray = [];
    let currentSize = 2;

    for (let i = 0; i < obj.length && currentSize < maxSize - 30; i++) {
      const itemSize = estimateJsonSize(obj[i]);
      if (currentSize + itemSize + 1 > maxSize - 30) {
        truncatedArray.push(`...[${obj.length - i} more items]`);
        break;
      }
      truncatedArray.push(
        truncateObjectForLogging(obj[i], maxSize - currentSize - 1, depth + 1)
      );
      currentSize += itemSize + 1;
    }

    if (truncatedArray.length === 0 && obj.length > 0) {
      truncatedArray.push(`...[${obj.length} items truncated]`);
    }

    return truncatedArray;
  }

  const truncatedObj = {};
  let currentSize = 2;
  const entries = Object.entries(obj);

  for (let i = 0; i < entries.length && currentSize < maxSize - 30; i++) {
    const [key, value] = entries[i];
    if (value === undefined) continue;

    const keySize = key.length + 3;
    const valueSize = estimateJsonSize(value);

    if (currentSize + keySize + valueSize > maxSize - 30) {
      truncatedObj['...[TRUNCATED]'] = `${entries.length - i} more properties`;
      break;
    }

    truncatedObj[key] = truncateObjectForLogging(
      value,
      maxSize - currentSize - keySize,
      depth + 1
    );
    currentSize += keySize + valueSize;
  }

  return truncatedObj;
}

/**
 * Safe JSON stringify with size limits and automatic truncation
 * 
 * @param {*} obj - Object to serialize
 * @param {number} maxSize - Maximum size before truncation
 * @param {number} indent - Indentation spaces
 * @returns {string} JSON string (truncated if necessary)
 */
function safeJsonStringify(obj, maxSize = DEFAULT_MAX_SIZE, indent = 0) {
  try {
    const estimatedSize = estimateJsonSize(obj);
    if (estimatedSize <= maxSize) {
      return JSON.stringify(obj, null, indent);
    }
    return JSON.stringify(truncateObjectForLogging(obj, maxSize), null, indent);
  } catch (error) {
    return JSON.stringify({
      error: 'Serialization failed',
      message: error.message,
      type: typeof obj
    });
  }
}

/**
 * Safe JSON parse with error handling
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value on parse failure
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Memory-efficient JSON parser for large payloads
 * Accumulates chunks and parses when complete
 */
class StreamingJsonParser {
  constructor(options = {}) {
    const { maxBufferSize = 1024 * 1024 } = options;
    this.maxBufferSize = maxBufferSize;
    this.buffer = '';
  }

  /**
   * Add chunk and attempt to parse
   * 
   * @param {string} chunk - JSON chunk to add
   * @returns {*} Parsed object or null if incomplete
   */
  parse(chunk) {
    this.buffer += chunk;

    if (this.buffer.length > this.maxBufferSize) {
      const error = new Error(
        `JSON buffer exceeded maximum size of ${this.maxBufferSize} bytes`
      );
      error.code = 'BUFFER_OVERFLOW';
      this.reset();
      throw error;
    }

    try {
      const result = JSON.parse(this.buffer);
      this.reset();
      return result;
    } catch (error) {
      if (
        error instanceof SyntaxError &&
        (error.message.includes('Unexpected end of JSON input') ||
          error.message.includes('Unexpected end of JSON'))
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Try to parse without throwing on incomplete JSON
   * 
   * @returns {{ complete: boolean, value: * }} Parse result
   */
  tryParse() {
    try {
      const result = JSON.parse(this.buffer);
      this.reset();
      return { complete: true, value: result };
    } catch (error) {
      return { complete: false, value: null };
    }
  }

  /**
   * Get current buffer size
   * 
   * @returns {number} Buffer size in bytes
   */
  getBufferSize() {
    return this.buffer.length;
  }

  /**
   * Check if buffer is empty
   * 
   * @returns {boolean} True if empty
   */
  isEmpty() {
    return this.buffer.length === 0;
  }

  /**
   * Reset parser buffer
   */
  reset() {
    this.buffer = '';
  }
}

/**
 * Create a transform stream for JSON serialization
 * 
 * @param {Object} options - Stream options
 * @returns {Object} Object with write and read methods
 */
function createJsonStream(options = {}) {
  const chunks = [];
  let generator = null;

  return {
    write(obj) {
      generator = streamJsonStringify(obj, options);
      for (const chunk of generator) {
        chunks.push(chunk);
      }
    },

    read() {
      return chunks.shift() || null;
    },

    readAll() {
      const result = chunks.join('');
      chunks.length = 0;
      return result;
    },

    hasData() {
      return chunks.length > 0;
    }
  };
}

/**
 * Serialize object to chunks array
 * 
 * @param {*} obj - Object to serialize
 * @param {Object} options - Serialization options
 * @returns {string[]} Array of JSON chunks
 */
function serializeToChunks(obj, options = {}) {
  return [...streamJsonStringify(obj, options)];
}

/**
 * Calculate memory-safe batch size for array serialization
 * 
 * @param {Array} arr - Array to process
 * @param {number} maxBatchSize - Maximum batch size in bytes
 * @returns {number} Recommended items per batch
 */
function calculateBatchSize(arr, maxBatchSize = 1024 * 1024) {
  if (!Array.isArray(arr) || arr.length === 0) return 1;

  const sampleSize = Math.min(10, arr.length);
  let totalSize = 0;

  for (let i = 0; i < sampleSize; i++) {
    totalSize += estimateJsonSize(arr[i]);
  }

  const avgItemSize = totalSize / sampleSize;
  const recommendedBatch = Math.floor(maxBatchSize / avgItemSize);

  return Math.max(1, Math.min(recommendedBatch, arr.length));
}

module.exports = {
  estimateJsonSize,
  streamJsonStringify,
  streamJsonStringifyAsync,
  truncateObjectForLogging,
  safeJsonStringify,
  safeJsonParse,
  StreamingJsonParser,
  createJsonStream,
  serializeToChunks,
  calculateBatchSize,
  DEFAULT_MAX_CHUNK_SIZE,
  DEFAULT_MAX_SIZE,
  DEFAULT_SIZE_LIMIT
};
