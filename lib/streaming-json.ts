import { Buffer } from 'buffer';
// 🚩AI: ENTRY_POINT_FOR_STREAMING_JSON_UTILS
// 🚩AI: MUST_UPDATE_IF_STREAMING_JSON_PROTOCOL_CHANGES

/**
 * Streaming JSON utilities with strong generic typing guarantees.
 *
 * The helpers in this module provide safe JSON parsing/stringifying APIs while
 * enabling streamed processing for large payloads. All streaming helpers accept
 * consumer-provided codecs so callers can optimise for binary buffers, strings,
 * or custom transport layers without sacrificing type inference.
 */

/**
 * Generic decoder used to translate transport chunks into UTF-8 JSON fragments.
 * The decoder abstraction allows callers to inject domain-specific decoding
 * logic (e.g. handling compressed buffers).
 */
export interface JsonStreamDecoder<TChunk> {
  decode(chunk: TChunk): string;
}

/**
 * Generic encoder translating JSON fragments to transport chunks. Keeping this
 * generic lets callers control whether they want string, Buffer, or other chunk
 * representations on output.
 */
export interface JsonStreamEncoder<TChunk> {
  encode(fragment: string): TChunk;
}

/**
 * Options accepted by the streaming parser. The type parameters ensure the
 * parser returns the correct output shape and only consumes the chunk type the
 * caller actually supplies.
 */
export interface JsonStreamParseOptions<TChunk, TResult> {
  decoder?: JsonStreamDecoder<TChunk>;
  reviver?: Parameters<typeof JSON.parse>[1];
  defaultValue?: TResult;
}

/**
 * Options accepted by the streaming stringifier. The chunk type is inferred
 * from the encoder provided by the caller, which keeps downstream pipelines
 * strongly typed.
 */
export interface JsonStreamStringifyOptions<TChunk> {
  encoder?: JsonStreamEncoder<TChunk>;
  indent?: number;
  chunkSize?: number;
}

/**
 * Default UTF-8 decoder handling strings and Node.js buffers. The runtime
 * checks are small but prevent subtle bugs when callers pass mixed chunk types.
 */
export const utf8JsonDecoder: JsonStreamDecoder<string | Buffer> = {
  decode(chunk) {
    if (typeof chunk === 'string') {
      return chunk;
    }
    if (Buffer.isBuffer(chunk)) {
      return chunk.toString('utf8');
    }
    throw new TypeError('Unsupported chunk type for UTF-8 JSON decoder');
  }
};

/**
 * Default UTF-8 encoder that returns string chunks. Keeping the default output
 * as string avoids surprising Buffer allocations while still allowing callers
 * to inject a Buffer-producing encoder when needed.
 */
export const utf8JsonEncoder: JsonStreamEncoder<string> = {
  encode(fragment) {
    return fragment;
  }
};

/**
 * Safely parse a JSON string with an optional default value. The generic return
 * type ensures downstream consumers keep full type inference.
 */
export const safeJsonParse = <T = unknown>(jsonString: string, defaultValue: T | null = null, reviver?: Parameters<typeof JSON.parse>[1]): T | null => {
  try {
    return JSON.parse(jsonString, reviver) as T;
  } catch (error: unknown) {
    return defaultValue;
  }
};

/**
 * Safely stringify a value into JSON with optional indentation. On failure we
 * emit a diagnostic payload that captures the runtime error while avoiding
 * leaking stack traces to callers.
 */
export const safeJsonStringify = <T>(obj: T, indent: number = 0): string => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error)); // Inline normalization avoids leaking unexpected values
    return JSON.stringify({
      error: 'Serialization failed',
      message: err.message,
      type: typeof obj
    });
  }
};

/**
 * Stream-friendly JSON parser capable of handling both synchronous and
 * asynchronous iterables. The function buffers decoded fragments before a
 * single parse call which keeps memory usage predictable while ensuring the
 * output type remains strongly typed through generics.
 */
export const streamJsonParse = async <TChunk, TResult = unknown>(
  source: AsyncIterable<TChunk> | Iterable<TChunk>,
  options: JsonStreamParseOptions<TChunk, TResult> = {}
): Promise<TResult> => {
  const {
    decoder = utf8JsonDecoder as JsonStreamDecoder<TChunk>,
    reviver,
    defaultValue = null as TResult
  } = options;

  let buffer = '';

  const appendChunk = (chunk: TChunk): void => {
    buffer += decoder.decode(chunk);
  };

  if (Symbol.asyncIterator in Object(source)) {
    for await (const chunk of source as AsyncIterable<TChunk>) {
      appendChunk(chunk);
    }
  } else {
    for (const chunk of source as Iterable<TChunk>) {
      appendChunk(chunk);
    }
  }

  const parsed = safeJsonParse<TResult>(buffer, defaultValue, reviver);
  return parsed === null ? defaultValue : parsed;
};

/**
 * Lazily JSON-stringify values in chunks. This generator yields fragments that
 * can be streamed directly to HTTP responses or file writers without material
 * bottlenecks. The encoder allows callers to request Buffer chunks for binary
 * transports while preserving type inference.
 */
export function* streamJsonStringify<TChunk = string>(
  value: unknown,
  options: JsonStreamStringifyOptions<TChunk> = {}
): Generator<TChunk, void, void> {
  const {
    encoder = utf8JsonEncoder as JsonStreamEncoder<TChunk>,
    indent = 0,
    chunkSize = 16 * 1024 // default to 16KB chunks to balance throughput vs memory
  } = options;

  const json = safeJsonStringify(value, indent);
  for (let offset = 0; offset < json.length; offset += chunkSize) {
    const fragment = json.slice(offset, offset + chunkSize);
    yield encoder.encode(fragment);
  }
}

// Re-export native JSON for convenience
export const SafeJSON = JSON;
