/**
 * Field Naming and Collection Utilities
 * Standardized field name normalization and collection name generation
 * 
 * This module provides utilities for consistent field naming conventions and
 * automatic collection name derivation, supporting database schema consistency
 * and API parameter standardization across the application.
 * 
 * Design philosophy:
 * - Consistent naming: Convert between different case conventions automatically
 * - Database compatibility: Generate snake_case names for database storage
 * - Collection naming: Derive pluralized collection names from function names
 * - API standardization: Normalize field names for consistent API responses
 */

/**
 * Convert camelCase/PascalCase to snake_case for storage fields
 * 
 * This function transforms JavaScript naming conventions (camelCase, PascalCase)
 * into database-friendly snake_case format. Essential for consistent field
 * naming when storing data that originates from JavaScript objects.
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
  
  return paramName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Derive a pluralized, snake_case collection name from a function name
 * 
 * This function automatically generates appropriate MongoDB collection names
 * from function names, following common pluralization rules and snake_case
 * conventions. Useful for automatically determining collection names in
 * generic database operations.
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
  
  const snakeCase = functionName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
    
  // Handle pluralization rules
  if (snakeCase.endsWith('y')) {
    return snakeCase.slice(0, -1) + 'ies';
  }
  if (snakeCase.endsWith('s')) {
    return snakeCase;
  }
  return snakeCase + 's';
}

/**
 * Convert snake_case back to camelCase
 * 
 * Utility function for converting database field names back to JavaScript
 * naming conventions when retrieving data from storage.
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
  
  return snakeCaseName.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
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
  normalizeObjectFields,   // normalize entire objects to snake_case
  denormalizeObjectFields  // denormalize entire objects back to camelCase
};