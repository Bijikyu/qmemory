
/**
 * Unit tests for basic utility functions
 * Tests the fundamental utility functions to ensure they work correctly
 * in isolation and handle edge cases appropriately.
 */

const { greet, add, isEven } = require('../../lib/utils');

describe('Utils Module', () => {
  describe('greet function', () => {
    test('should return greeting with provided name', () => {
      expect(greet('Alice')).toBe('Hello, Alice!');
    });

    test('should handle empty string', () => {
      expect(greet('')).toBe('Hello, !');
    });

    test('should handle special characters in name', () => {
      expect(greet('José-María')).toBe('Hello, José-María!');
    });

    test('should handle numbers as strings', () => {
      expect(greet('123')).toBe('Hello, 123!');
    });
  });

  describe('add function', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    test('should add negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });

    test('should add positive and negative numbers', () => {
      expect(add(5, -3)).toBe(2);
    });

    test('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });

    test('should handle decimal numbers', () => {
      expect(add(1.5, 2.3)).toBeCloseTo(3.8);
    });

    test('should handle large numbers', () => {
      expect(add(1000000, 2000000)).toBe(3000000);
    });
  });

  describe('isEven function', () => {
    test('should return true for even numbers', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(0)).toBe(true);
      expect(isEven(100)).toBe(true);
      expect(isEven(-4)).toBe(true);
    });

    test('should return false for odd numbers', () => {
      expect(isEven(1)).toBe(false);
      expect(isEven(3)).toBe(false);
      expect(isEven(99)).toBe(false);
      expect(isEven(-3)).toBe(false);
    });

    test('should handle large numbers', () => {
      expect(isEven(1000000)).toBe(true);
      expect(isEven(1000001)).toBe(false);
    });
  });
});
