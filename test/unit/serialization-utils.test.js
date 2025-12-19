/**
 * Serialization utils tests focusing on generic return types.
 */

const {
  mapAndSerialize,
  safeMapAndSerialize,
  safeSerializeDocument,
  serializeDocument,
  serializeFields,
  serializeWithoutFields
} = require('../../lib/serialization-utils.js');

describe('serialization-utils', () => {
  test('serializeDocument should respect toObject implementations', () => {
    const doc = {
      id: '123',
      toObject: jest.fn(() => ({ id: '123', exposed: true }))
    };

    const serialized = serializeDocument(doc);
    expect(serialized).toEqual({ id: '123', exposed: true });
    expect(doc.toObject).toHaveBeenCalled();
  });

  test('mapAndSerialize should preserve array typing', () => {
    const docs = [
      { toJSON: () => ({ id: 1 }) },
      { toJSON: () => ({ id: 2 }) }
    ];

    const results = mapAndSerialize(docs);
    expect(results).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('safeSerializeDocument should fall back to default value', () => {
    const fallback = { message: 'none' };
    expect(safeSerializeDocument(null, fallback)).toBe(fallback);
  });

  test('serializeFields should emit partial object', () => {
    const doc = { id: 'a', secret: 'hidden', count: 10 };
    const serialized = serializeFields(doc, ['id', 'count']);
    expect(serialized).toEqual({ id: 'a', count: 10 });
  });

  test('serializeWithoutFields should remove specified properties', () => {
    const doc = { id: 'a', secret: 'hidden', count: 10 };
    const serialized = serializeWithoutFields(doc, ['secret']);
    expect(serialized).toEqual({ id: 'a', count: 10 });
  });

  test('safeMapAndSerialize should tolerate invalid inputs', () => {
    expect(safeMapAndSerialize(null)).toEqual([]);
  });
});
