/**
 * Fast operations generic coverage tests.
 */

const { FastMath, FastOps, FastString } = require('../../lib/fast-operations.js');

describe('FastMath generic behaviour', () => {
  test('sum should support typed arrays without mutation', () => {
    const data = new Float64Array([1.5, 2.5, 3.5]);
    const clone = new Float64Array(data);

    const result = FastMath.sum(data);
    expect(result).toBeCloseTo(7.5);
    expect(Array.from(data)).toEqual(Array.from(clone)); // ensure no mutation
  });

  test('sumBy should aggregate object collections efficiently', () => {
    const items = [
      { id: 'a', metrics: { load: 10 } },
      { id: 'b', metrics: { load: 15 } },
      { id: 'c', metrics: { load: 5 } }
    ];

    const total = FastMath.sumBy(items, item => item.metrics.load);
    expect(total).toBe(30);
  });

  test('percentile should not mutate input arrays', () => {
    const data = [5, 1, 9, 3, 7];
    const snapshot = [...data];

    const percentile = FastMath.percentile(data, 0.6);
    expect(percentile).toBeGreaterThanOrEqual(5);
    expect(data).toEqual(snapshot);
  });

  test('FastOps should expose sumBy helper', () => {
    const values = [{ value: 2 }, { value: 3 }];
    expect(FastOps.sumBy(values, entry => entry.value)).toBe(5);
  });
});

describe('FastString utilities', () => {
  test('fastConcat should support iterables', () => {
    function* generator() {
      yield 'Hello';
      yield ' ';
      yield 'World';
    }

    expect(FastString.fastConcat(generator())).toBe('Hello World');
  });
});
