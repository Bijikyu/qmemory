/**
 * Schema Generation Tests
 * Tests for the comprehensive schema generation functionality
 */

const {
  generateMongoSchema
} = require('../../lib/mongoose-mapper');

describe('Schema Generation Module', () => {
  describe('generateMongoSchema', () => {
    test('should generate schema from single function metadata', () => {
      const functions = [
        {
          name: 'createUser',
          parameters: [
            { name: 'userName', type: 'string', required: true },
            { name: 'userEmail', type: 'string', required: true },
            { name: 'age', type: 'number', required: false }
          ]
        }
      ];
      
      const result = generateMongoSchema(functions);
      
      expect(result).toHaveProperty('create_users');
      expect(result.create_users).toEqual({
        _id: { type: 'ObjectId', auto: true },
        createdAt: { type: 'Date', default: 'Date.now' },
        updatedAt: { type: 'Date', default: 'Date.now' },
        user_name: { type: 'String', required: true },
        user_email: {
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

    test('should generate schemas from multiple function metadata', () => {
      const functions = [
        {
          name: 'createUser',
          parameters: [
            { name: 'userName', type: 'string', required: true },
            { name: 'email', type: 'string', required: true }
          ]
        },
        {
          name: 'createProduct',
          parameters: [
            { name: 'productName', type: 'string', required: true },
            { name: 'price', type: 'number', required: true },
            { name: 'isActive', type: 'boolean', required: false }
          ]
        }
      ];
      
      const result = generateMongoSchema(functions);
      
      expect(result).toHaveProperty('create_users');
      expect(result).toHaveProperty('create_products');
      
      expect(result.create_users.user_name).toEqual({ type: 'String', required: true });
      expect(result.create_products.product_name).toEqual({ type: 'String', required: true });
      expect(result.create_products.price).toEqual({ type: 'Number', required: true });
      expect(result.create_products.is_active).toEqual({ type: 'Boolean', required: false });
    });

    test('should handle duplicate field names across functions', () => {
      const functions = [
        {
          name: 'createUser',
          parameters: [
            { name: 'userName', type: 'string', required: true },
            { name: 'email', type: 'string', required: true }
          ]
        },
        {
          name: 'updateUser',
          parameters: [
            { name: 'userName', type: 'string', required: false },
            { name: 'phone', type: 'string', required: false }
          ]
        }
      ];
      
      const result = generateMongoSchema(functions);
      
      // Both functions should map to the same collection (users)
      expect(Object.keys(result)).toHaveLength(2);
      expect(result).toHaveProperty('create_users');
      expect(result).toHaveProperty('update_users');
      
      // First function should set the field
      expect(result.create_users.user_name).toEqual({ type: 'String', required: true });
      expect(result.update_users.user_name).toEqual({ type: 'String', required: false });
    });

    test('should avoid field overwrites within same collection', () => {
      const functions = [
        {
          name: 'createUser',
          parameters: [
            { name: 'userName', type: 'string', required: true },
            { name: 'userName', type: 'string', required: false } // Duplicate param
          ]
        }
      ];
      
      const result = generateMongoSchema(functions);
      
      // Should only have one user_name field with first definition
      expect(result.create_users.user_name).toEqual({ type: 'String', required: true });
    });

    test('should handle functions with no parameters', () => {
      const functions = [
        {
          name: 'getUsers',
          parameters: []
        }
      ];
      
      const result = generateMongoSchema(functions);
      
      expect(result).toHaveProperty('get_users');
      expect(result.get_users).toEqual({
        _id: { type: 'ObjectId', auto: true },
        createdAt: { type: 'Date', default: 'Date.now' },
        updatedAt: { type: 'Date', default: 'Date.now' }
      });
    });

    test('should handle special field names with validation', () => {
      const functions = [
        {
          name: 'createContact',
          parameters: [
            { name: 'contactEmail', type: 'string', required: true },
            { name: 'websiteUrl', type: 'string', required: false },
            { name: 'profileData', type: 'object', required: true }
          ]
        }
      ];
      
      const result = generateMongoSchema(functions);
      
      expect(result.create_contacts.contact_email.validate).toBeDefined();
      expect(result.create_contacts.website_url.validate).toBeDefined();
      expect(result.create_contacts.profile_data).toEqual({ type: 'Object', required: true });
    });

    test('should throw error for invalid input', () => {
      expect(() => generateMongoSchema(null)).toThrow('Functions must be an array');
      expect(() => generateMongoSchema('not an array')).toThrow('Functions must be an array');
      expect(() => generateMongoSchema([null])).toThrow('Function metadata must be an object');
      expect(() => generateMongoSchema([{}])).toThrow('Function name must be a non-empty string');
      expect(() => generateMongoSchema([{ name: 'test' }])).toThrow('Function parameters must be an array');
    });

    test('should handle empty functions array', () => {
      const result = generateMongoSchema([]);
      expect(result).toEqual({});
    });
  });
});