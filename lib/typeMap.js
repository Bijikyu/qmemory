/**
 * Type Mapping Utilities
 * Maps JavaScript/generic types to MongoDB/Mongoose field types
 * 
 * This module provides type conversion utilities for mapping between different
 * type systems, particularly useful when generating Mongoose schemas from
 * parameter definitions or API specifications.
 */

/**
 * Map parameter types to Mongoose base types for schema rendering
 * 
 * Converts parameter types (including aliases) to their corresponding Mongoose schema type constructors.
 * Supports both basic types and MongoDB-specific types with comprehensive alias mapping.
 * 
 * @param {string} paramType - Parameter type (string, number, boolean, object, array, date, etc.)
 * @returns {string} Mongoose type constructor name
 * 
 * @example
 * getMongoType('string') // returns 'String'
 * getMongoType('str') // returns 'String' (alias)
 * getMongoType('int') // returns 'Number' (alias)
 * getMongoType('objectid') // returns 'ObjectId'
 */
function getMongoType(paramType) {
  if (typeof paramType !== 'string' || !paramType.trim()) {
    return 'Mixed';
  }
  
  // Alias mapping for common type variations
  const aliases = {
    'str': 'string',
    'text': 'string',
    'num': 'number',
    'int': 'number',
    'integer': 'number',
    'float': 'number',
    'double': 'number',
    'bool': 'boolean',
    'datetime': 'date',
    'timestamp': 'date',
    'id': 'objectid',
    'oid': 'objectid',
    'uuid': 'objectid'
  };
  
  // Normalize the input through aliases
  const normalizedType = aliases[paramType.toLowerCase()] || paramType.toLowerCase();
  
  // Handle core types with clean switch statement
  switch (normalizedType) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'object': return 'Object';
    case 'array': return 'Array';
    case 'date': return 'Date';
    
    // MongoDB-specific types
    case 'objectid': return 'ObjectId';
    case 'mixed': return 'Mixed';
    case 'buffer': return 'Buffer';
    case 'decimal': return 'Decimal128';
    case 'decimal128': return 'Decimal128';
    case 'map': return 'Map';
    
    default: return 'Mixed';
  }
}

/**
 * Get all supported type mappings including aliases
 * 
 * Returns an object containing all supported type mappings for reference
 * and validation purposes, including both canonical types and common aliases.
 * 
 * @returns {Object} Object containing canonical types, MongoDB types, and aliases
 */
function getSupportedTypes() {
  return {
    // Core types (your clean switch statement)
    'string': 'String',
    'number': 'Number', 
    'boolean': 'Boolean',
    'object': 'Object',
    'array': 'Array',
    'date': 'Date',
    
    // MongoDB-specific types
    'objectid': 'ObjectId',
    'mixed': 'Mixed',
    'buffer': 'Buffer',
    'decimal': 'Decimal128',
    'decimal128': 'Decimal128',
    'map': 'Map',
    
    // Common aliases
    'str': 'String',
    'text': 'String',
    'num': 'Number',
    'int': 'Number',
    'integer': 'Number', 
    'float': 'Number',
    'double': 'Number',
    'bool': 'Boolean',
    'datetime': 'Date',
    'timestamp': 'Date',
    'id': 'ObjectId',
    'oid': 'ObjectId',
    'uuid': 'ObjectId'
  };
}

/**
 * Check if a type is supported (including aliases)
 * 
 * Validates whether a given type name has a corresponding Mongoose type mapping,
 * including support for common aliases and case-insensitive matching.
 * 
 * @param {string} type - Type name to check
 * @returns {boolean} True if type is supported, false otherwise
 */
function isSupportedType(type) {
  if (typeof type !== 'string' || !type.trim()) {
    return false;
  }
  
  const supportedTypes = getSupportedTypes();
  return Object.prototype.hasOwnProperty.call(supportedTypes, type.toLowerCase());
}

module.exports = {
  getMongoType,
  getSupportedTypes,
  isSupportedType
};