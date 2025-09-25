/**
 * Field Utilities Tests
 * Tests for field name normalization and collection name generation
 */

const {
  normalizeFieldName,
  getCollectionName,
  denormalizeFieldName,
  normalizeObjectFields,
  denormalizeObjectFields
} = require('../../lib/field-utils');

describe('Field Utils Module', () => {
  describe('normalizeFieldName', () => {
    test('should convert camelCase to snake_case', () => {
      expect(normalizeFieldName('firstName')).toBe('first_name');
      expect(normalizeFieldName('lastName')).toBe('last_name');
      expect(normalizeFieldName('userID')).toBe('user_i_d');
      expect(normalizeFieldName('createDate')).toBe('create_date');
      expect(normalizeFieldName('isActive')).toBe('is_active');
    });

    test('should convert PascalCase to snake_case', () => {
      expect(normalizeFieldName('FirstName')).toBe('first_name');
      expect(normalizeFieldName('UserAccount')).toBe('user_account');
      expect(normalizeFieldName('DatabaseConnection')).toBe('database_connection');
    });

    test('should handle single words', () => {
      expect(normalizeFieldName('name')).toBe('name');
      expect(normalizeFieldName('id')).toBe('id');
      expect(normalizeFieldName('user')).toBe('user');
    });

    test('should handle consecutive capitals', () => {
      expect(normalizeFieldName('userID')).toBe('user_i_d');
      expect(normalizeFieldName('XMLParser')).toBe('x_m_l_parser');
      expect(normalizeFieldName('HTTPRequest')).toBe('h_t_t_p_request');
    });

    test('should throw error for invalid input', () => {
      expect(() => normalizeFieldName('')).toThrow('Parameter name must be a non-empty string');
      expect(() => normalizeFieldName('   ')).toThrow('Parameter name must be a non-empty string');
      expect(() => normalizeFieldName(null)).toThrow('Parameter name must be a non-empty string');
      expect(() => normalizeFieldName(undefined)).toThrow('Parameter name must be a non-empty string');
    });
  });

  describe('getCollectionName', () => {
    test('should pluralize regular words', () => {
      expect(getCollectionName('createUser')).toBe('create_users');
      expect(getCollectionName('findProduct')).toBe('find_products');
      expect(getCollectionName('getOrder')).toBe('get_orders');
      expect(getCollectionName('deleteItem')).toBe('delete_items');
    });

    test('should handle words ending in y', () => {
      expect(getCollectionName('findCompany')).toBe('find_companies');
      expect(getCollectionName('listCategory')).toBe('list_categories');
      expect(getCollectionName('createCountry')).toBe('create_countries');
    });

    test('should handle words already ending in s', () => {
      expect(getCollectionName('getAddress')).toBe('get_address');
      expect(getCollectionName('findClass')).toBe('find_class');
      expect(getCollectionName('listNews')).toBe('list_news');
    });

    test('should convert camelCase function names', () => {
      expect(getCollectionName('getUserProfile')).toBe('get_user_profiles');
      expect(getCollectionName('createUserAccount')).toBe('create_user_accounts');
      expect(getCollectionName('findDatabaseEntry')).toBe('find_database_entries');
    });

    test('should throw error for invalid input', () => {
      expect(() => getCollectionName('')).toThrow('Function name must be a non-empty string');
      expect(() => getCollectionName('   ')).toThrow('Function name must be a non-empty string');
      expect(() => getCollectionName(null)).toThrow('Function name must be a non-empty string');
      expect(() => getCollectionName(undefined)).toThrow('Function name must be a non-empty string');
    });
  });

  describe('denormalizeFieldName', () => {
    test('should convert snake_case to camelCase', () => {
      expect(denormalizeFieldName('first_name')).toBe('firstName');
      expect(denormalizeFieldName('last_name')).toBe('lastName');
      expect(denormalizeFieldName('user_id')).toBe('userId');
      expect(denormalizeFieldName('created_at')).toBe('createdAt');
      expect(denormalizeFieldName('is_active')).toBe('isActive');
    });

    test('should handle single words', () => {
      expect(denormalizeFieldName('name')).toBe('name');
      expect(denormalizeFieldName('id')).toBe('id');
      expect(denormalizeFieldName('user')).toBe('user');
    });

    test('should throw error for invalid input', () => {
      expect(() => denormalizeFieldName('')).toThrow('Snake case name must be a non-empty string');
      expect(() => denormalizeFieldName('   ')).toThrow('Snake case name must be a non-empty string');
      expect(() => denormalizeFieldName(null)).toThrow('Snake case name must be a non-empty string');
      expect(() => denormalizeFieldName(undefined)).toThrow('Snake case name must be a non-empty string');
    });
  });

  describe('normalizeObjectFields', () => {
    test('should normalize simple object fields', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        userID: 123,
        isActive: true
      };
      
      const expected = {
        first_name: 'John',
        last_name: 'Doe',
        user_i_d: 123,
        is_active: true
      };
      
      expect(normalizeObjectFields(input)).toEqual(expected);
    });

    test('should handle nested objects', () => {
      const input = {
        firstName: 'John',
        userInfo: {
          isActive: true,
          lastLogin: '2023-01-01',
          accountType: 'premium'
        }
      };
      
      const expected = {
        first_name: 'John',
        user_info: {
          is_active: true,
          last_login: '2023-01-01',
          account_type: 'premium'
        }
      };
      
      expect(normalizeObjectFields(input)).toEqual(expected);
    });

    test('should handle arrays and primitive values', () => {
      expect(normalizeObjectFields('string')).toBe('string');
      expect(normalizeObjectFields(123)).toBe(123);
      expect(normalizeObjectFields([1, 2, 3])).toEqual([1, 2, 3]);
      expect(normalizeObjectFields(null)).toBe(null);
      expect(normalizeObjectFields(undefined)).toBe(undefined);
    });
  });

  describe('denormalizeObjectFields', () => {
    test('should denormalize simple object fields', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        user_id: 123,
        is_active: true
      };
      
      const expected = {
        firstName: 'John',
        lastName: 'Doe',
        userId: 123,
        isActive: true
      };
      
      expect(denormalizeObjectFields(input)).toEqual(expected);
    });

    test('should handle nested objects', () => {
      const input = {
        first_name: 'John',
        user_info: {
          is_active: true,
          last_login: '2023-01-01',
          account_type: 'premium'
        }
      };
      
      const expected = {
        firstName: 'John',
        userInfo: {
          isActive: true,
          lastLogin: '2023-01-01',
          accountType: 'premium'
        }
      };
      
      expect(denormalizeObjectFields(input)).toEqual(expected);
    });

    test('should handle arrays and primitive values', () => {
      expect(denormalizeObjectFields('string')).toBe('string');
      expect(denormalizeObjectFields(123)).toBe(123);
      expect(denormalizeObjectFields([1, 2, 3])).toEqual([1, 2, 3]);
      expect(denormalizeObjectFields(null)).toBe(null);
      expect(denormalizeObjectFields(undefined)).toBe(undefined);
    });
  });
});