/**
 * Type Map Tests
 * Tests for JavaScript to Mongoose type mapping
 */

const {
  getMongoType,
  getSupportedTypes,
  isSupportedType
} = require('../../lib/typeMap');

describe('Type Map Module', () => {
  describe('getMongoType', () => {
    test('should map basic types correctly', () => {
      expect(getMongoType('string')).toBe('String');
      expect(getMongoType('number')).toBe('Number');
      expect(getMongoType('boolean')).toBe('Boolean');
      expect(getMongoType('date')).toBe('Date');
      expect(getMongoType('array')).toBe('Array');
      expect(getMongoType('object')).toBe('Object');
    });

    test('should return Mixed for unknown types', () => {
      expect(getMongoType('customType')).toBe('Mixed');
      expect(getMongoType('unknownType')).toBe('Mixed');
      expect(getMongoType('invalidType')).toBe('Mixed');
      expect(getMongoType('str')).toBe('Mixed');
      expect(getMongoType('int')).toBe('Mixed');
    });

    test('should be case sensitive', () => {
      expect(getMongoType('STRING')).toBe('Mixed');
      expect(getMongoType('Number')).toBe('Mixed');
      expect(getMongoType('BOOLEAN')).toBe('Mixed');
    });
  });

  describe('getSupportedTypes', () => {
    test('should return all supported type mappings', () => {
      const types = getSupportedTypes();
      
      expect(types).toHaveProperty('string', 'String');
      expect(types).toHaveProperty('number', 'Number');
      expect(types).toHaveProperty('boolean', 'Boolean');
      expect(types).toHaveProperty('object', 'Object');
      expect(types).toHaveProperty('array', 'Array');
      expect(types).toHaveProperty('date', 'Date');
    });

    test('should return object with correct structure', () => {
      const types = getSupportedTypes();
      
      expect(typeof types).toBe('object');
      expect(Array.isArray(types)).toBe(false);
      
      // Check that all values are strings
      Object.values(types).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('isSupportedType', () => {
    test('should return true for supported types', () => {
      expect(isSupportedType('string')).toBe(true);
      expect(isSupportedType('number')).toBe(true);
      expect(isSupportedType('boolean')).toBe(true);
      expect(isSupportedType('object')).toBe(true);
      expect(isSupportedType('array')).toBe(true);
      expect(isSupportedType('date')).toBe(true);
    });

    test('should be case sensitive', () => {
      expect(isSupportedType('STRING')).toBe(false);
      expect(isSupportedType('Number')).toBe(false);
      expect(isSupportedType('BOOLEAN')).toBe(false);
    });

    test('should return false for unsupported types', () => {
      expect(isSupportedType('customType')).toBe(false);
      expect(isSupportedType('unknownType')).toBe(false);
      expect(isSupportedType('invalidType')).toBe(false);
      expect(isSupportedType('str')).toBe(false);
      expect(isSupportedType('int')).toBe(false);
    });

    test('should return false for invalid input', () => {
      expect(isSupportedType('')).toBe(false);
      expect(isSupportedType('   ')).toBe(false);
      expect(isSupportedType(null)).toBe(false);
      expect(isSupportedType(undefined)).toBe(false);
      expect(isSupportedType(123)).toBe(false);
    });
  });
});