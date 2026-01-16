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

    test('should handle type aliases', () => {
      expect(getMongoType('str')).toBe('String');
      expect(getMongoType('text')).toBe('String');
      expect(getMongoType('num')).toBe('Number');
      expect(getMongoType('int')).toBe('Number');
      expect(getMongoType('integer')).toBe('Number');
      expect(getMongoType('bool')).toBe('Boolean');
      expect(getMongoType('datetime')).toBe('Date');
      expect(getMongoType('timestamp')).toBe('Date');
    });

    test('should handle MongoDB-specific types', () => {
      expect(getMongoType('objectid')).toBe('ObjectId');
      expect(getMongoType('id')).toBe('ObjectId');
      expect(getMongoType('oid')).toBe('ObjectId');
      expect(getMongoType('uuid')).toBe('ObjectId');
      expect(getMongoType('mixed')).toBe('Mixed');
      expect(getMongoType('buffer')).toBe('Buffer');
      expect(getMongoType('decimal')).toBe('Decimal128');
      expect(getMongoType('decimal128')).toBe('Decimal128');
      expect(getMongoType('map')).toBe('Map');
    });

    test('should handle case-insensitive aliases', () => {
      expect(getMongoType('STR')).toBe('String');
      expect(getMongoType('INT')).toBe('Number');
      expect(getMongoType('BOOL')).toBe('Boolean');
      expect(getMongoType('OBJECTID')).toBe('ObjectId');
    });

    test('should return Mixed for unknown types', () => {
      expect(getMongoType('customType')).toBe('Mixed');
      expect(getMongoType('unknownType')).toBe('Mixed');
      expect(getMongoType('invalidType')).toBe('Mixed');
    });

    test('should handle invalid input gracefully', () => {
      expect(getMongoType('')).toBe('Mixed');
      expect(getMongoType('   ')).toBe('Mixed');
      expect(getMongoType(null)).toBe('Mixed');
      expect(getMongoType(undefined)).toBe('Mixed');
    });
  });

  describe('getSupportedTypes', () => {
    test('should return all supported type mappings including aliases', () => {
      const types = getSupportedTypes();
      
      // Core types
      expect(types).toHaveProperty('string', 'String');
      expect(types).toHaveProperty('number', 'Number');
      expect(types).toHaveProperty('boolean', 'Boolean');
      expect(types).toHaveProperty('object', 'Object');
      expect(types).toHaveProperty('array', 'Array');
      expect(types).toHaveProperty('date', 'Date');
      
      // MongoDB-specific types
      expect(types).toHaveProperty('objectid', 'ObjectId');
      expect(types).toHaveProperty('mixed', 'Mixed');
      expect(types).toHaveProperty('buffer', 'Buffer');
      
      // Aliases
      expect(types).toHaveProperty('str', 'String');
      expect(types).toHaveProperty('int', 'Number');
      expect(types).toHaveProperty('bool', 'Boolean');
      expect(types).toHaveProperty('id', 'ObjectId');
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
    test('should return true for core types', () => {
      expect(isSupportedType('string')).toBe(true);
      expect(isSupportedType('number')).toBe(true);
      expect(isSupportedType('boolean')).toBe(true);
      expect(isSupportedType('object')).toBe(true);
      expect(isSupportedType('array')).toBe(true);
      expect(isSupportedType('date')).toBe(true);
    });

    test('should return true for MongoDB-specific types', () => {
      expect(isSupportedType('objectid')).toBe(true);
      expect(isSupportedType('mixed')).toBe(true);
      expect(isSupportedType('buffer')).toBe(true);
      expect(isSupportedType('decimal128')).toBe(true);
      expect(isSupportedType('map')).toBe(true);
    });

    test('should return true for aliases', () => {
      expect(isSupportedType('str')).toBe(true);
      expect(isSupportedType('int')).toBe(true);
      expect(isSupportedType('bool')).toBe(true);
      expect(isSupportedType('id')).toBe(true);
      expect(isSupportedType('oid')).toBe(true);
    });

    test('should be case insensitive', () => {
      expect(isSupportedType('STRING')).toBe(true);
      expect(isSupportedType('Number')).toBe(true);
      expect(isSupportedType('BOOLEAN')).toBe(true);
      expect(isSupportedType('STR')).toBe(true);
      expect(isSupportedType('INT')).toBe(true);
    });

    test('should return false for unsupported types', () => {
      expect(isSupportedType('customType')).toBe(false);
      expect(isSupportedType('unknownType')).toBe(false);
      expect(isSupportedType('invalidType')).toBe(false);
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