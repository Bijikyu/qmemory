/**
 * Scalable Streaming Utilities
 *
 * Provides memory-efficient streaming operations for large data processing
 * with backpressure management, chunking, and memory bounds.
 */

import { Transform, TransformCallback, TransformOptions } from 'stream';
import * as fs from 'fs';

export interface ChunkedStreamOptions extends TransformOptions {
  chunkSize?: number;
  maxChunks?: number;
  memoryBound?: number;
}

export interface ChunkResult<T> {
  data: T[];
  chunkId: number;
  timestamp: number;
}

export class ChunkedStreamProcessor<T = unknown> extends Transform {
  private readonly chunkSize: number;
  private readonly maxChunks: number;
  private readonly memoryBound: number;
  private currentChunk: T[] = [];
  private chunkCount = 0;

  constructor(options: ChunkedStreamOptions = {}) {
    super({ objectMode: true, ...options });
    this.chunkSize = options.chunkSize ?? 1000;
    this.maxChunks = options.maxChunks ?? 100;
    this.memoryBound = options.memoryBound ?? 10000;
  }

  _transform(data: T, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.currentChunk.push(data);

    if (this.currentChunk.length >= this.chunkSize) {
      this.processChunk();
    }

    if (this.chunkCount >= this.maxChunks || this.currentChunk.length > this.memoryBound) {
      return callback(new Error('Memory limit exceeded in stream processor'));
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this.currentChunk.length > 0) {
      this.processChunk();
    }
    callback();
  }

  private processChunk(): void {
    if (this.currentChunk.length === 0) return;

    const chunk = this.currentChunk.splice(0, this.currentChunk.length);
    this.chunkCount++;

    const result: ChunkResult<T> = {
      data: chunk,
      chunkId: this.chunkCount,
      timestamp: Date.now(),
    };

    this.push(result);
  }

  getChunkCount(): number {
    return this.chunkCount;
  }

  getCurrentChunkSize(): number {
    return this.currentChunk.length;
  }
}

export interface JSONStreamOptions extends TransformOptions {
  maxObjectSize?: number;
  maxObjects?: number;
}

export class JSONStreamProcessor extends Transform {
  private readonly maxObjectSize: number;
  private readonly maxObjects: number;
  private buffer = '';
  private objectCount = 0;

  constructor(options: JSONStreamOptions = {}) {
    super({ objectMode: true, ...options });
    this.maxObjectSize = options.maxObjectSize ?? 1024 * 1024;
    this.maxObjects = options.maxObjects ?? 10000;
  }

  _transform(chunk: Buffer | string, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.buffer += chunk.toString();

    while (this.buffer.length > 0) {
      const objEnd = this.findObjectEnd();

      if (objEnd === -1) break;

      const jsonString = this.buffer.substring(0, objEnd + 1);
      this.buffer = this.buffer.substring(objEnd + 1);

      if (jsonString.length > this.maxObjectSize) {
        return callback(new Error('JSON object too large'));
      }

      try {
        const parsed = JSON.parse(jsonString);
        this.push(parsed);
        this.objectCount++;

        if (this.objectCount >= this.maxObjects) {
          return callback(new Error('Too many JSON objects'));
        }
      } catch (error) {
        return callback(new Error(`Invalid JSON: ${(error as Error).message}`));
      }
    }

    callback();
  }

  private findObjectEnd(): number {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"' && !escaped) {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  getObjectCount(): number {
    return this.objectCount;
  }

  getBufferSize(): number {
    return this.buffer.length;
  }
}

export interface ScalableFileReaderOptions {
  chunkSize?: number;
  maxMemoryUsage?: number;
}

export class ScalableFileReader {
  private readonly filePath: string;
  private readonly chunkSize: number;
  private readonly maxMemoryUsage: number;
  private currentMemoryUsage = 0;

  constructor(filePath: string, options: ScalableFileReaderOptions = {}) {
    this.filePath = filePath;
    this.chunkSize = options.chunkSize ?? 64 * 1024;
    this.maxMemoryUsage = options.maxMemoryUsage ?? 10 * 1024 * 1024;
  }

  async *readChunks(): AsyncGenerator<Buffer, void, unknown> {
    let fd: fs.promises.FileHandle | null = null;

    try {
      fd = await fs.promises.open(this.filePath, 'r');
      let position = 0;

      while (true) {
        if (this.currentMemoryUsage > this.maxMemoryUsage) {
          throw new Error('Memory usage limit exceeded');
        }

        const buffer = Buffer.allocUnsafe(this.chunkSize);
        const { bytesRead } = await fd.read(buffer, 0, this.chunkSize, position);

        if (bytesRead === 0) break;

        const chunk = buffer.subarray(0, bytesRead);
        this.currentMemoryUsage += bytesRead;
        position += bytesRead;

        yield chunk;

        this.currentMemoryUsage -= bytesRead;
      }
    } finally {
      if (fd) {
        await fd.close();
      }
    }
  }

  createReadStream(options?: { encoding?: BufferEncoding; start?: number; end?: number }): fs.ReadStream {
    return fs.createReadStream(this.filePath, {
      highWaterMark: this.chunkSize,
      ...(options ?? {}),
    });
  }

  getFilePath(): string {
    return this.filePath;
  }

  getChunkSize(): number {
    return this.chunkSize;
  }

  getMaxMemoryUsage(): number {
    return this.maxMemoryUsage;
  }
}

export interface LineReaderOptions {
  encoding?: BufferEncoding;
  maxLineLength?: number;
}

export class LineStreamProcessor extends Transform {
  private readonly maxLineLength: number;
  private buffer = '';

  constructor(options: LineReaderOptions = {}) {
    super({ objectMode: true });
    this.maxLineLength = options.maxLineLength ?? 1024 * 1024;
  }

  _transform(chunk: Buffer | string, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.buffer += chunk.toString();

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.length > this.maxLineLength) {
        return callback(new Error('Line exceeds maximum length'));
      }
      this.push(line);
    }

    callback();
  }

  _flush(callback: TransformCallback): void {
    if (this.buffer.length > 0) {
      if (this.buffer.length > this.maxLineLength) {
        return callback(new Error('Final line exceeds maximum length'));
      }
      this.push(this.buffer);
    }
    callback();
  }
}

export function createChunkedProcessor<T>(options?: ChunkedStreamOptions): ChunkedStreamProcessor<T> {
  return new ChunkedStreamProcessor<T>(options);
}

export function createJSONStreamProcessor(options?: JSONStreamOptions): JSONStreamProcessor {
  return new JSONStreamProcessor(options);
}

export function createLineStreamProcessor(options?: LineReaderOptions): LineStreamProcessor {
  return new LineStreamProcessor(options);
}

export function createScalableFileReader(
  filePath: string,
  options?: ScalableFileReaderOptions
): ScalableFileReader {
  return new ScalableFileReader(filePath, options);
}
