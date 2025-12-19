/**
 * Streaming JSON utilities tests covering async parsing and chunked stringification.
 */

const {
  safeJsonParse,
  safeJsonStringify,
  streamJsonParse,
  streamJsonStringify,
  utf8JsonDecoder,
  utf8JsonEncoder
} = require('../../lib/streaming-json.js');

describe('streaming-json utilities', () => {
  test('streamJsonParse should assemble async iterable chunks using custom decoder and reviver', async () => {
    const payload = JSON.stringify({ createdAt: '2024-01-01T12:34:56.000Z', count: 42 });
    const buffers = [Buffer.from(payload.slice(0, 10), 'utf8'), Buffer.from(payload.slice(10), 'utf8')];

    const decoder = {
      decode: jest.fn(chunk => chunk.toString('utf8'))
    };

    const result = await streamJsonParse(async function* () {
      for (const chunk of buffers) {
        yield chunk;
      }
    }(), {
      decoder,
      reviver: (key, value) => (key === 'createdAt' ? new Date(value) : value)
    });

    expect(decoder.decode).toHaveBeenCalledTimes(buffers.length);
    expect(result.count).toBe(42);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  test('streamJsonStringify should yield chunked buffers when encoder provided', () => {
    const value = { id: 'abc', items: [1, 2, 3] };
    const encoder = {
      encode: jest.fn(fragment => Buffer.from(fragment, 'utf8'))
    };

    const chunks = Array.from(streamJsonStringify(value, { encoder, chunkSize: 5 }));
    const reconstructed = Buffer.concat(chunks).toString('utf8');

    expect(encoder.encode).toHaveBeenCalled();
    expect(reconstructed).toBe(JSON.stringify(value));
    expect(chunks.every(chunk => Buffer.isBuffer(chunk))).toBe(true);
  });

  test('safe helpers should fall back gracefully on malformed input', () => {
    expect(safeJsonParse('{ invalid json', { fallback: true })).toEqual({ fallback: true });
    const serialized = safeJsonStringify(() => ({}));
    expect(serialized).toContain('Serialization failed');
  });

  test('default utf8 codecs should round-trip strings without mutation', () => {
    const fragments = ['{', '"value"', ':', '"測試"', '}'];
    const encoded = fragments.map(fragment => utf8JsonEncoder.encode(fragment));
    const decoded = encoded.map(fragment => utf8JsonDecoder.decode(fragment));

    expect(decoded.join('')).toBe(fragments.join(''));
  });

  test('streamJsonStringify respects indenting', () => {
    const value = { nested: { a: 1 } };
    const output = Array.from(streamJsonStringify(value, { indent: 2 })).join('');
    expect(output).toBe(JSON.stringify(value, null, 2));
  });
});
