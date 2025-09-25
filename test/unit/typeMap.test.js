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

    test('should handle case-insensitive input', () => {
      expect(getMongoType('STRING')).toBe('String');
      expect(getMongoType('Number')).toBe('Number');
      expect(getMongoType('BOOLEAN')).toBe('Boolean');
    });

    test('should handle type aliases', () => {
      expect(getMongoType('str')).toBe('String');
      expect(getMongoType('text')).toBe('String');
      expect(getMongoType('num')).toBe('Number');
      expect(getMongoType('int')).toBe('Number');
      expect(getMongoType('integer')).toBe('Number');
      expect(getMongoType('bool')).toBe('Boolean');
    });

    test('should handle MongoDB-specific types', () => {
      expect(getMongoType('objectid')).toBe('ObjectId');
      expect(getMongoType('id')).toBe('ObjectId');
      expect(getMongoType('mixed')).toBe('Mixed');
      expect(getMongoType('buffer')).toBe('Buffer');
      expect(getMongoType('decimal')).toBe('Decimal128');
      expect(getMongoType('decimal128')).toBe('Decimal128');
      expect(getMongoType('map')).toBe('Map');
    });

    test('should handle unknown types by capitalizing them', () => {
      expect(getMongoType('customType')).toBe('Customtype');
      expect(getMongoType('unknownType')).toBe('Unknowntype');
    });

    test('should handle whitespace', () => {
      expect(getMongoType('  string  ')).toBe('String');
      expect(getMongoType('\tnumber\n')).toBe('Number');
    });

    test('should throw error for invalid input', () => {
      expect(() => getMongoType('')).toThrow('Type must be a non-empty string');
      expect(() => getMongoType('   ')).toThrow('Type must be a non-empty string');
      expect(() => getMongoType(null)).toThrow('Type must be a non-empty string');
      expect(() => getMongoType(undefined)).toThrow('Type must be a non-empty string');
      expect(() => getMongoType(123)).toThrow('Type must be a non-empty string');
    });
  });

  describe('getSupportedTypes', () => {
    test('should return all supported type mappings', () => {
      const types = getSupportedTypes();
      
      expect(types).toHaveProperty('string', 'String');
      expect(types).toHaveProperty('number', 'Number');
      expect(types).toHaveProperty('boolean', 'Boolean');
      expect(types).toHaveProperty('date', 'Date');
      expect(types).toHaveProperty('objectid', 'ObjectId');
      expect(types).toHaveProperty('mixed', 'Mixed');
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
      expect(isSupportedType('str')).toBe(true);
      expect(isSupportedType('objectid')).toBe(true);
    });

    test('should return true for supported types regardless of case', () => {
      expect(isSupportedType('STRING')).toBe(true);
      expect(isSupportedType('Number')).toBe(true);
      expect(isSupportedType('BOOLEAN')).toBe(true);
    });

    test('should return false for unsupported types', () => {
      expect(isSupportedType('customType')).toBe(false);
      expect(isSupportedType('unknownType')).toBe(false);
      expect(isSupportedType('invalidType')).toBe(false);
    });

    test('should handle whitespace correctly', () => {
      expect(isSupportedType('  string  ')).toBe(true);
      expect(isSupportedType('\tnumber\n')).toBe(true);
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