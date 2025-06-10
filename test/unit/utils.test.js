/**
 * Unit tests for basic utility functions
 * Tests the fundamental utility functions to ensure they work correctly
 * in isolation and handle edge cases appropriately.
 */

// Import functions under test from utilities module
const { greet, add, isEven } = require('../../lib/utils'); // load utilities under test

describe('Utils module', () => { // Tests simple helper functions
  describe('greet function', () => { // String formatting utility
    test('should return greeting with provided name', () => {
      expect(greet('Alice')).toBe('Hello, Alice!');
      expect(greet('Bob')).toBe('Hello, Bob!');
      expect(console.log).toHaveBeenCalledWith('greet is running with Alice'); // start log first call
      expect(console.log).toHaveBeenCalledWith('greet is returning Hello, Alice!'); // return log first call
    }); // Verifies basic string interpolation logic

    test('should handle empty string', () => {
      expect(greet('')).toBe('Hello, !');
    });

    test('should handle special characters', () => {
      expect(greet('María José')).toBe('Hello, María José!');
      expect(greet('123')).toBe('Hello, 123!');
    });
  });

  describe('add function', () => { // Arithmetic addition helper
    test('should add positive numbers correctly', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(10, 15)).toBe(25);
    });

    test('should add negative numbers correctly', () => {
      expect(add(-2, -3)).toBe(-5);
      expect(add(-10, 5)).toBe(-5);
    });

    test('should handle zero', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });

    test('should handle decimal numbers', () => {
      expect(add(2.5, 3.7)).toBeCloseTo(6.2);
      expect(add(1.1, 2.2)).toBeCloseTo(3.3);
    });

    test('should handle infinity', () => {
      expect(add(Infinity, 5)).toBe(Infinity);
      expect(add(-Infinity, 5)).toBe(-Infinity);
      expect(isNaN(add(Infinity, -Infinity))).toBe(true);
    });
  });

  describe('isEven function', () => { // Checks even/odd calculation
    test('should return true for even numbers', () => {
      expect(isEven(0)).toBe(true);
      expect(isEven(2)).toBe(true);
      expect(isEven(4)).toBe(true);
      expect(isEven(100)).toBe(true);
    });

    test('should return false for odd numbers', () => {
      expect(isEven(1)).toBe(false);
      expect(isEven(3)).toBe(false);
      expect(isEven(5)).toBe(false);
      expect(isEven(99)).toBe(false);
    });

    test('should handle negative numbers', () => {
      expect(isEven(-2)).toBe(true);
      expect(isEven(-1)).toBe(false);
      expect(isEven(-4)).toBe(true);
      expect(isEven(-3)).toBe(false);
    });

    test('should handle decimal numbers', () => {
      expect(isEven(2.0)).toBe(true);
      expect(isEven(3.0)).toBe(false);
      expect(isEven(2.5)).toBe(false);
    });
  });
});
