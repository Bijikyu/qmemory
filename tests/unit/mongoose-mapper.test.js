/**
 * Mongoose Mapper Tests
 * Tests for parameter to Mongoose field descriptor mapping
 */

const {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema
} = require('../../lib/mongoose-mapper');

describe('Mongoose Mapper Module', () => {
  describe('mapParameterToMongoType', () => {
    test('should map basic parameter to Mongoose descriptor', () => {
      const param = {
        name: 'userName',
        type: 'string',
        required: true
      };
      
      const result = mapParameterToMongoType(param);
      
      expect(result).toEqual({
        type: 'String',
        required: true
      });
    });

    test('should add email validation for email fields', () => {
      const param = {
        name: 'userEmail',
        type: 'string',
        required: true
      };
      
      const result = mapParameterToMongoType(param);
      
      expect(result).toEqual({
        type: 'String',
        required: true,
        validate: {
          validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
          message: 'Invalid email format'
        }
      });
    });

    test('should add URL validation for URL fields', () => {
      const param = {
        name: 'profileUrl',
        type: 'string',
        required: false
      };
      
      const result = mapParameterToMongoType(param);
      
      expect(result).toEqual({
        type: 'String',
        required: false,
        validate: {
          validator: 'function(v) { try { new URL(v); return true; } catch { return false; } }',
          message: 'Invalid URL format'
        }
      });
    });

    test('should handle different field types', () => {
      const numberParam = {
        name: 'age',
        type: 'number',
        required: false
      };
      
      const booleanParam = {
        name: 'isActive',
        type: 'boolean',
        required: true
      };
      
      const dateParam = {
        name: 'createdAt',
        type: 'date',
        required: true
      };
      
      expect(mapParameterToMongoType(numberParam)).toEqual({
        type: 'Number',
        required: false
      });
      
      expect(mapParameterToMongoType(booleanParam)).toEqual({
        type: 'Boolean',
        required: true
      });
      
      expect(mapParameterToMongoType(dateParam)).toEqual({
        type: 'Date',
        required: true
      });
    });

    test('should detect email validation case-insensitively', () => {
      const params = [
        { name: 'EMAIL', type: 'string', required: true },
        { name: 'contactEmail', type: 'string', required: true },
        { name: 'email_address', type: 'string', required: true }
      ];
      
      params.forEach(param => {
        const result = mapParameterToMongoType(param);
        expect(result.validate).toBeDefined();
        expect(result.validate.message).toBe('Invalid email format');
      });
    });

    test('should detect URL validation case-insensitively', () => {
      const params = [
        { name: 'URL', type: 'string', required: true },
        { name: 'websiteUrl', type: 'string', required: true },
        { name: 'profile_url', type: 'string', required: true }
      ];
      
      params.forEach(param => {
        const result = mapParameterToMongoType(param);
        expect(result.validate).toBeDefined();
        expect(result.validate.message).toBe('Invalid URL format');
      });
    });

    test('should throw error for invalid input', () => {
      expect(() => mapParameterToMongoType(null)).toThrow('Parameter must be an object');
      expect(() => mapParameterToMongoType({})).toThrow('Parameter name must be a non-empty string');
      expect(() => mapParameterToMongoType({ name: 'test' })).toThrow('Parameter type must be a non-empty string');
      expect(() => mapParameterToMongoType({ name: 'test', type: 'string' })).toThrow('Parameter required must be a boolean');
    });
  });

  describe('mapParametersToSchema', () => {
    test('should map multiple parameters to schema object', () => {
      const params = [
        { name: 'userName', type: 'string', required: true },
        { name: 'userEmail', type: 'string', required: true },
        { name: 'age', type: 'number', required: false }
      ];
      
      const result = mapParametersToSchema(params);
      
      expect(result).toEqual({
        userName: { type: 'String', required: true },
        userEmail: {
          type: 'String',
          required: true,
          validate: {
            validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
            message: 'Invalid email format'
          }
        },
        age: { type: 'Number', required: false }
      });
    });

    test('should handle empty array', () => {
      const result = mapParametersToSchema([]);
      expect(result).toEqual({});
    });

    test('should throw error for invalid input', () => {
      expect(() => mapParametersToSchema(null)).toThrow('Parameters must be an array');
      expect(() => mapParametersToSchema('not an array')).toThrow('Parameters must be an array');
    });
  });

  describe('generateMongooseSchema', () => {
    test('should generate complete Mongoose schema with timestamps', () => {
      const params = [
        { name: 'title', type: 'string', required: true },
        { name: 'email', type: 'string', required: true }
      ];
      
      const result = generateMongooseSchema(params);
      
      expect(result.fields).toEqual({
        title: { type: 'String', required: true },
        email: {
          type: 'String',
          required: true,
          validate: {
            validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
            message: 'Invalid email format'
          }
        }
      });
      
      expect(result.options).toEqual({
        timestamps: true
      });
    });

    test('should allow custom schema options', () => {
      const params = [
        { name: 'name', type: 'string', required: true }
      ];
      
      const result = generateMongooseSchema(params, {
        timestamps: false,
        schemaOptions: { collection: 'custom_collection' }
      });
      
      expect(result.options).toEqual({
        timestamps: false,
        collection: 'custom_collection'
      });
    });
  });
});