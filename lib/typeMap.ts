/**
 * MongoDB Type Mapping Utilities
 *
 * Purpose: Provides type mapping between common type names and MongoDB
 * field types. This utility normalizes type definitions across the application
 * to ensure consistent MongoDB schema generation and prevent type-related errors.
 *
 * Design Philosophy:
 * - Consistent normalization: Standardizes type names across all schemas
 * - Alias support: Handles common type variations and abbreviations
 * - MongoDB compatibility: Maps to valid MongoDB field types
 * - Fallback safety: Returns 'Mixed' for unknown or invalid types
 * - Type safety: Prevents runtime type errors in schema generation
 *
 * Integration Notes:
 * - Used throughout application for schema generation and validation
 * - Integrates with validation-rules module for type mapping
 * - Works with mongoose-mapper for consistent field typing
 * - Provides foundation for automated schema creation
 * - Supports both manual and programmatic type definitions
 *
 * Performance Considerations:
 * - O(1) lookup complexity for type mapping
 * - Minimal memory overhead with simple object mapping
 * - Fast string operations for type normalization
 * - Cache-friendly: No expensive operations or recursions
 * - Type aliases reduce string comparison overhead
 *
 * Error Handling Strategy:
 * - Graceful fallback to 'Mixed' type for unknown inputs
 * - Input validation to prevent runtime errors
 * - Case-insensitive matching for flexible usage
 * - Comprehensive alias coverage for common type names
 * - Safe defaults prevent invalid schema generation
 *
 * Architecture Decision: Why provide both getMongoType and getSupportedTypes?
 * - getMongoType provides active type mapping for schema generation
 * - getSupportedTypes provides list of all supported types for validation
 * - Separation allows for type validation before schema creation
 * - Enables input validation and error reporting capabilities
 * - Supports both dynamic and static type checking scenarios
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

/**
 * Maps parameter type to MongoDB field type
 *
 * This function provides intelligent type mapping with comprehensive alias support
 * and input validation. It handles common type variations and provides
 * graceful fallback for unknown types.
 *
 * @param paramType - The type string to normalize and map to MongoDB type
 * @returns {string} The corresponding MongoDB field type
 *
 * @example
 * getMongoType('string'); // Returns 'String'
 * getMongoType('num'); // Returns 'Number' (alias support)
 * getMongoType('unknown'); // Returns 'Mixed' (fallback)
 *
 * Supported Aliases:
 * - str, text → String
 * - num, int, integer, float, double → Number
 * - bool → Boolean
 * - datetime, timestamp → Date
 * - id, oid, uuid → ObjectId
 * - decimal, decimal128 → Decimal128
 */
const getMongoType = paramType => {
  // Input validation to prevent runtime errors
  if (typeof paramType !== 'string' || !paramType.trim()) return 'Mixed'; // Graceful fallback for invalid input types

  // Comprehensive alias mapping for common type variations
  // This enables flexible API while maintaining consistent MongoDB types
  const aliases = {
    str: 'string',
    text: 'string', // Text type variations
    num: 'number',
    int: 'number',
    integer: 'number', // Numeric type variations
    float: 'number',
    double: 'number', // Decimal number variations
    bool: 'boolean', // Boolean type abbreviation
    datetime: 'date',
    timestamp: 'date', // Date/time type variations
    id: 'objectid',
    oid: 'objectid',
    uuid: 'objectid', // ID type variations
  };

  // Normalize type name for case-insensitive matching
  const normalizedType = aliases[paramType.toLowerCase()] || paramType.toLowerCase();

  // Map to MongoDB field types with comprehensive coverage
  switch (normalizedType) {
    case 'string':
      return 'String';
    case 'number':
      return 'Number';
    case 'boolean':
      return 'Boolean';
    case 'object':
      return 'Object';
    case 'array':
      return 'Array';
    case 'date':
      return 'Date';
    case 'objectid':
      return 'ObjectId';
    case 'mixed':
      return 'Mixed';
    case 'buffer':
      return 'Buffer';
    case 'decimal':
    case 'decimal128':
      return 'Decimal128';
    case 'map':
      return 'Map';
    default:
      return 'Mixed'; // Safe fallback for unknown types
  }
};

/**
 * Get all supported MongoDB types
 *
 * This function returns a comprehensive mapping of all supported types
 * for validation, documentation, and UI generation purposes.
 *
 * @returns {object} Object mapping all supported type aliases to MongoDB types
 *
 * @example
 * const types = getSupportedTypes();
 * console.log(types.string); // 'String'
 * console.log(types.bool); // 'Boolean'
 * console.log(types.oid); // 'ObjectId'
 */
const getSupportedTypes = () => ({
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  object: 'Object',
  array: 'Array',
  date: 'Date',
  objectid: 'ObjectId',
  mixed: 'Mixed',
  buffer: 'Buffer',
  decimal: 'Decimal128',
  decimal128: 'Decimal128',
  map: 'Map',
  str: 'String',
  text: 'String',
  num: 'Number',
  int: 'Number',
  integer: 'Number',
  float: 'Number',
  double: 'Number',
  bool: 'Boolean',
  datetime: 'Date',
  timestamp: 'Date',
  id: 'ObjectId',
  oid: 'ObjectId',
  uuid: 'ObjectId',
});

export { getMongoType, getSupportedTypes };
