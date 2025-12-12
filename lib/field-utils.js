/**
 * Field Naming and Collection Utilities
 * Standardized field name normalization and collection name generation
 * 
 * This module provides utilities for consistent field naming conventions and
 * automatic collection name derivation, supporting database schema consistency
 * and API parameter standardization across the application.
 * 
 * Uses change-case and pluralize packages for comprehensive case conversion
 * and linguistically-aware pluralization.
 * 
 * Design philosophy:
 * - Consistent naming: Convert between different case conventions automatically
 * - Database compatibility: Generate snake_case names for database storage
 * - Collection naming: Derive pluralized collection names from function names
 * - API standardization: Normalize field names for consistent API responses
 */

const { snakeCase, camelCase, kebabCase, pascalCase } = require('change-case');
const pluralize = require('pluralize');

/**
 * Convert camelCase/PascalCase to snake_case for storage fields
 * 
 * This function transforms JavaScript naming conventions (camelCase, PascalCase)
 * into database-friendly snake_case format using the change-case library
 * for comprehensive case conversion and edge case handling.
 * 
 * @param {string} paramName - Field name in camelCase or PascalCase format
 * @returns {string} Field name converted to snake_case format
 * 
 * @example
 * normalizeFieldName('firstName') // returns 'first_name'
 * normalizeFieldName('userID') // returns 'user_i_d'
 * normalizeFieldName('createDate') // returns 'create_date'
 * normalizeFieldName('isActive') // returns 'is_active'
 */
function normalizeFieldName(paramName) {
  if (typeof paramName !== 'string' || !paramName.trim()) {
    throw new Error('Parameter name must be a non-empty string');
  }
  
  return snakeCase(paramName);
}

/**
 * Derive a pluralized, snake_case collection name from a function name
 * 
 * This function automatically generates appropriate MongoDB collection names
 * from function names using pluralize for linguistically-aware pluralization
 * and change-case for consistent naming conventions.
 * 
 * @param {string} functionName - Function name to derive collection name from
 * @returns {string} Pluralized snake_case collection name
 * 
 * @example
 * getCollectionName('createUser') // returns 'create_users'
 * getCollectionName('findCompany') // returns 'find_companies'
 * getCollectionName('listCategory') // returns 'list_categories'
 * getCollectionName('getAddress') // returns 'get_addresses'
 */
function getCollectionName(functionName) {
  if (typeof functionName !== 'string' || !functionName.trim()) {
    throw new Error('Function name must be a non-empty string');
  }
  
  const snakeCaseName = snakeCase(functionName);
  
  // Extract the main word (last word after splitting by underscore)
  const words = snakeCaseName.split('_');
  const mainWord = words[words.length - 1];
  const pluralMainWord = pluralize(mainWord);
  
  // Replace the last word with its plural form
  words[words.length - 1] = pluralMainWord;
  
  return words.join('_');
}

/**
 * Convert snake_case back to camelCase
 * 
 * Utility function for converting database field names back to JavaScript
 * naming conventions when retrieving data from storage using change-case
 * for consistent and reliable conversion.
 * 
 * @param {string} snakeCaseName - Field name in snake_case format
 * @returns {string} Field name converted to camelCase format
 * 
 * @example
 * denormalizeFieldName('first_name') // returns 'firstName'
 * denormalizeFieldName('user_id') // returns 'userId'
 * denormalizeFieldName('created_at') // returns 'createdAt'
 */
function denormalizeFieldName(snakeCaseName) {
  if (typeof snakeCaseName !== 'string' || !snakeCaseName.trim()) {
    throw new Error('Snake case name must be a non-empty string');
  }
  
  return camelCase(snakeCaseName);
}

/**
 * Convert string to paramCase (kebab-case)
 * 
 * Additional utility for URL-friendly naming conventions
 * using the change-case library for consistent conversion.
 * 
 * @param {string} str - String to convert
 * @returns {string} String in paramCase format
 * 
 * @example
 * toParamCase('firstName') // returns 'first-name'
 * toParamCase('user_id') // returns 'user-id'
 */
function toParamCase(str) {
  if (typeof str !== 'string' || !str.trim()) {
    throw new Error('Input must be a non-empty string');
  }
  
  return kebabCase(str);
}

/**
 * Convert string to PascalCase
 * 
 * Additional utility for class naming conventions
 * using the change-case library for consistent conversion.
 * 
 * @param {string} str - String to convert
 * @returns {string} String in PascalCase format
 * 
 * @example
 * toPascalCase('first_name') // returns 'FirstName'
 * toPascalCase('userName') // returns 'UserName'
 */
function toPascalCase(str) {
  if (typeof str !== 'string' || !str.trim()) {
    throw new Error('Input must be a non-empty string');
  }
  
  return pascalCase(str);
}

/**
 * Pluralize a word using linguistically-aware rules
 * 
 * Uses the pluralize library for comprehensive pluralization
 * including irregular nouns and edge cases.
 * 
 * @param {string} word - Word to pluralize
 * @param {number} count - Optional count for singular/plural selection
 * @returns {string} Pluralized word
 * 
 * @example
 * pluralizeWord('user') // returns 'users'
 * pluralizeWord('company') // returns 'companies'
 * pluralizeWord('person') // returns 'people'
 */
function pluralizeWord(word, count) {
  if (typeof word !== 'string' || !word.trim()) {
    throw new Error('Word must be a non-empty string');
  }
  
  return pluralize(word, count);
}

/**
 * Singularize a word
 * 
 * Uses the pluralize library to convert plural words back to singular form.
 * 
 * @param {string} word - Word to singularize
 * @returns {string} Singularized word
 * 
 * @example
 * singularizeWord('users') // returns 'user'
 * singularizeWord('companies') // returns 'company'
 * singularizeWord('people') // returns 'person'
 */
function singularizeWord(word) {
  if (typeof word !== 'string' || !word.trim()) {
    throw new Error('Word must be a non-empty string');
  }
  
  return pluralize.singular(word);
}

/**
 * Normalize an entire object's field names to snake_case
 * 
 * Recursively processes an object to convert all field names from camelCase
 * to snake_case, useful for preparing JavaScript objects for database storage.
 * 
 * @param {Object} obj - Object with camelCase field names
 * @returns {Object} Object with snake_case field names
 * 
 * @example
 * const input = { firstName: 'John', lastName: 'Doe', userInfo: { isActive: true } };
 * normalizeObjectFields(input);
 * // returns { first_name: 'John', last_name: 'Doe', user_info: { is_active: true } }
 */
function normalizeObjectFields(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const normalized = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalizeFieldName(key);
    normalized[normalizedKey] = typeof value === 'object' && value !== null && !Array.isArray(value)
      ? normalizeObjectFields(value)
      : value;
  }
  
  return normalized;
}

/**
 * Denormalize an entire object's field names back to camelCase
 * 
 * Recursively processes an object to convert all field names from snake_case
 * back to camelCase, useful for converting database records to JavaScript objects.
 * 
 * @param {Object} obj - Object with snake_case field names
 * @returns {Object} Object with camelCase field names
 * 
 * @example
 * const input = { first_name: 'John', last_name: 'Doe', user_info: { is_active: true } };
 * denormalizeObjectFields(input);
 * // returns { firstName: 'John', lastName: 'Doe', userInfo: { isActive: true } }
 */
function denormalizeObjectFields(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }
  
  const denormalized = {};
  for (const [key, value] of Object.entries(obj)) {
    const denormalizedKey = denormalizeFieldName(key);
    denormalized[denormalizedKey] = typeof value === 'object' && value !== null && !Array.isArray(value)
      ? denormalizeObjectFields(value)
      : value;
  }
  
  return denormalized;
}

// Export field utilities using object shorthand for clean module interface
module.exports = {
  normalizeFieldName,      // convert camelCase/PascalCase to snake_case
  getCollectionName,       // derive pluralized snake_case collection names
  denormalizeFieldName,    // convert snake_case back to camelCase
  toParamCase,             // convert to kebab-case (paramCase)
  toPascalCase,            // convert to PascalCase
  pluralizeWord,           // linguistically-aware pluralization
  singularizeWord,         // convert plural to singular
  normalizeObjectFields,   // normalize entire objects to snake_case
  denormalizeObjectFields  // denormalize entire objects back to camelCase
};