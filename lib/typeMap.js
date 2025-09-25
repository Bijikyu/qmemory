/**
 * Type Mapping Utilities
 * Maps JavaScript/generic types to MongoDB/Mongoose field types
 * 
 * This module provides type conversion utilities for mapping between different
 * type systems, particularly useful when generating Mongoose schemas from
 * parameter definitions or API specifications.
 */

/**
 * Map our simplified param types to Mongoose base types for schema rendering
 * 
 * Converts basic parameter types to their corresponding Mongoose schema type constructors.
 * 
 * @param {string} paramType - Parameter type (string, number, boolean, object, array, date)
 * @returns {string} Mongoose type constructor name
 * 
 * @example
 * getMongoType('string') // returns 'String'
 * getMongoType('number') // returns 'Number'
 * getMongoType('boolean') // returns 'Boolean'
 * getMongoType('date') // returns 'Date'
 */
function getMongoType(paramType) {
  switch (paramType) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'object': return 'Object';
    case 'array': return 'Array';
    case 'date': return 'Date';
    default: return 'Mixed';
  }
}

/**
 * Get all supported type mappings
 * 
 * Returns an object containing all supported type mappings for reference
 * and validation purposes.
 * 
 * @returns {Object} Object mapping generic types to Mongoose types
 */
function getSupportedTypes() {
  return {
    'string': 'String',
    'number': 'Number',
    'boolean': 'Boolean',
    'object': 'Object',
    'array': 'Array',
    'date': 'Date'
  };
}

/**
 * Check if a type is supported
 * 
 * Validates whether a given type name has a corresponding Mongoose type mapping.
 * 
 * @param {string} type - Type name to check
 * @returns {boolean} True if type is supported, false otherwise
 */
function isSupportedType(type) {
  if (typeof type !== 'string' || !type.trim()) {
    return false;
  }
  
  const supportedTypes = getSupportedTypes();
  return Object.prototype.hasOwnProperty.call(supportedTypes, type);
}

module.exports = {
  getMongoType,
  getSupportedTypes,
  isSupportedType
};