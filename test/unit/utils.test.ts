/**
 * Unit tests for basic utility functions
 *
 * Comprehensive test suite for core utility functions that provide
 * fundamental operations including greeting generation, arithmetic operations,
 * and parity checking. These tests verify correct behavior, input validation,
 * error handling, and type safety across various input scenarios.
 *
 * Functions Tested:
 * - greet: String greeting with type-safe input handling
 * - add: Arithmetic addition with strict type validation
 * - isEven: Parity checking with integer-only enforcement
 *
 * Test Coverage:
 * - Normal operation verification
 * - Edge case handling (empty strings, zero, negative numbers)
 * - Type safety and validation
 * - Error condition testing
 * - Input coercion behavior
 * - Boundary value testing
 */

import { greet, add, isEven } from '../../lib/utils.js';
describe('Utils module', () => {
  describe('greet function', () => {
    test('should return greeting with provided name', () => {
      expect(greet('Alice')).toBe('Hello, Alice!');
      expect(greet('Bob')).toBe('Hello, Bob!');
    });

    test('should handle empty string', () => {
      expect(greet('')).toBe('Hello, !');
    });
    test('should handle special characters', () => {
      expect(greet('María José')).toBe('Hello, María José!');
      expect(greet('123')).toBe('Hello, 123!');
    });
    test('should handle non-string inputs with type conversion', () => {
      expect(greet(123)).toBe('Hello, 123!');
      expect(greet(null)).toBe('Hello, null!');
      expect(greet(undefined)).toBe('Hello, undefined!');
      expect(greet(true)).toBe('Hello, true!');
    });
  });
  describe('add function', () => {
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

    test('should throw error for non-numeric inputs', () => {
      expect(() => add('2' as any, 3)).toThrow(
        'Both parameters must be numbers for arithmetic operations'
      );
      expect(() => add(2, '3' as any)).toThrow(
        'Both parameters must be numbers for arithmetic operations'
      );
      expect(() => add(null as any, 3)).toThrow(
        'Both parameters must be numbers for arithmetic operations'
      );
      expect(() => add(undefined as any, 3)).toThrow(
        'Both parameters must be numbers for arithmetic operations'
      );
    });

    test('should handle infinity', () => {
      expect(add(Infinity, 5)).toBe(Infinity);
      expect(add(-Infinity, 5)).toBe(-Infinity);
      expect(isNaN(add(Infinity, -Infinity))).toBe(true);
    });
  });

  describe('isEven function', () => {
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

    test('should handle integer decimal numbers', () => {
      expect(isEven(2.0)).toBe(true);
      expect(isEven(3.0)).toBe(false);
    });

    test('should throw error for non-integer inputs', () => {
      expect(() => isEven(2.5 as any)).toThrow(
        'Parameter must be an integer for even/odd calculation'
      );
      expect(() => isEven('2' as any)).toThrow(
        'Parameter must be an integer for even/odd calculation'
      );
      expect(() => isEven(null as any)).toThrow(
        'Parameter must be an integer for even/odd calculation'
      );
      expect(() => isEven(undefined as any)).toThrow(
        'Parameter must be an integer for even/odd calculation'
      );
    });
  });
});
