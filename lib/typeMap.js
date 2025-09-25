/**
 * Type Mapping Utilities
 * Maps JavaScript/generic types to MongoDB/Mongoose field types
 * 
 * This module provides type conversion utilities for mapping between different
 * type systems, particularly useful when generating Mongoose schemas from
 * parameter definitions or API specifications.
 */

/**
 * Maps generic type names to Mongoose/MongoDB field types
 * 
 * Converts common type names (string, number, boolean, etc.) to their
 * corresponding Mongoose schema type constructors for automatic schema generation.
 * 
 * @param {string} type - Generic type name (e.g., 'string', 'number', 'boolean')
 * @returns {string} Mongoose type constructor name
 * 
 * @example
 * getMongoType('string') // returns 'String'
 * getMongoType('number') // returns 'Number'
 * getMongoType('boolean') // returns 'Boolean'
 * getMongoType('date') // returns 'Date'
 */
function getMongoType(type) {
  if (typeof type !== 'string' || !type.trim()) {
    throw new Error('Type must be a non-empty string');
  }
  
  const normalizedType = type.toLowerCase().trim();
  
  // Map common types to Mongoose constructors
  const typeMap = {
    'string': 'String',
    'str': 'String',
    'text': 'String',
    'number': 'Number',
    'num': 'Number',
    'integer': 'Number',
    'int': 'Number',
    'float': 'Number',
    'double': 'Number',
    'boolean': 'Boolean',
    'bool': 'Boolean',
    'date': 'Date',
    'datetime': 'Date',
    'timestamp': 'Date',
    'array': 'Array',
    'object': 'Object',
    'objectid': 'ObjectId',
    'id': 'ObjectId',
    'mixed': 'Mixed',
    'buffer': 'Buffer',
    'decimal': 'Decimal128',
    'decimal128': 'Decimal128',
    'map': 'Map'
  };
  
  const mongoType = typeMap[normalizedType];
  if (!mongoType) {
    // If type is not found, return it capitalized (assumes it's a valid Mongoose type)
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
  
  return mongoType;
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
    'str': 'String', 
    'text': 'String',
    'number': 'Number',
    'num': 'Number',
    'integer': 'Number',
    'int': 'Number',
    'float': 'Number',
    'double': 'Number',
    'boolean': 'Boolean',
    'bool': 'Boolean',
    'date': 'Date',
    'datetime': 'Date',
    'timestamp': 'Date',
    'array': 'Array',
    'object': 'Object',
    'objectid': 'ObjectId',
    'id': 'ObjectId',
    'mixed': 'Mixed',
    'buffer': 'Buffer',
    'decimal': 'Decimal128',
    'decimal128': 'Decimal128',
    'map': 'Map'
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
  return Object.prototype.hasOwnProperty.call(supportedTypes, type.toLowerCase().trim());
}

module.exports = {
  getMongoType,
  getSupportedTypes,
  isSupportedType
};