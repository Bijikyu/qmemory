/**
 * Mongoose Schema Mapping Utilities
 * Parameter to Mongoose field descriptor conversion with validation
 * 
 * This module provides utilities for automatically generating Mongoose schema
 * field descriptors from parameter definitions, including intelligent validation
 * based on field names and types.
 */

const { getMongoType } = require('./typeMap');
const { normalizeFieldName, getCollectionName } = require('./field-utils');

/**
 * Map internal parameter shape to a conceptual Mongoose field descriptor for docs/tooling
 * 
 * Converts parameter definitions to Mongoose schema field descriptors with
 * automatic validation detection based on field names. Supports email and URL
 * validation out of the box.
 * 
 * @param {Object} param - Parameter definition object
 * @param {string} param.name - Field name
 * @param {string} param.type - Field type (will be mapped to Mongoose type)
 * @param {boolean} param.required - Whether field is required
 * @returns {Object} Mongoose field descriptor with type, required, and validation
 * 
 * @example
 * mapParameterToMongoType({
 *   name: 'userEmail',
 *   type: 'string',
 *   required: true
 * })
 * // returns {
 * //   type: 'String',
 * //   required: true,
 * //   validate: {
 * //     validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
 * //     message: 'Invalid email format'
 * //   }
 * // }
 */
function mapParameterToMongoType(param) {
  // Validate input parameter
  if (!param || typeof param !== 'object') {
    throw new Error('Parameter must be an object');
  }
  
  if (typeof param.name !== 'string' || !param.name.trim()) {
    throw new Error('Parameter name must be a non-empty string');
  }
  
  if (typeof param.type !== 'string' || !param.type.trim()) {
    throw new Error('Parameter type must be a non-empty string');
  }
  
  if (typeof param.required !== 'boolean') {
    throw new Error('Parameter required must be a boolean');
  }
  
  const baseType = { 
    type: getMongoType(param.type), 
    required: param.required 
  };
  
  const lower = param.name.toLowerCase();
  
  // Email validation for fields containing 'email'
  if (lower.includes('email')) {
    return {
      ...baseType,
      validate: {
        validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
        message: 'Invalid email format',
      },
    };
  }
  
  // URL validation for fields containing 'url'
  if (lower.includes('url')) {
    return {
      ...baseType,
      validate: {
        validator: 'function(v) { try { new URL(v); return true; } catch { return false; } }',
        message: 'Invalid URL format',
      },
    };
  }
  
  return baseType;
}

/**
 * Map multiple parameters to Mongoose field descriptors
 * 
 * Processes an array of parameter definitions and returns an object
 * with field names as keys and Mongoose descriptors as values.
 * 
 * @param {Array} params - Array of parameter definition objects
 * @returns {Object} Object with field names as keys and Mongoose descriptors as values
 * 
 * @example
 * mapParametersToSchema([
 *   { name: 'userName', type: 'string', required: true },
 *   { name: 'userEmail', type: 'string', required: true },
 *   { name: 'age', type: 'number', required: false }
 * ])
 * // returns {
 * //   userName: { type: 'String', required: true },
 * //   userEmail: { type: 'String', required: true, validate: {...} },
 * //   age: { type: 'Number', required: false }
 * // }
 */
function mapParametersToSchema(params) {
  if (!Array.isArray(params)) {
    throw new Error('Parameters must be an array');
  }
  
  const schema = {};
  
  for (const param of params) {
    const descriptor = mapParameterToMongoType(param);
    schema[param.name] = descriptor;
  }
  
  return schema;
}

/**
 * Generate Mongoose schema object from parameter definitions
 * 
 * Creates a complete Mongoose schema definition object that can be used
 * with new mongoose.Schema(). Includes timestamps and other common options.
 * 
 * @param {Array} params - Array of parameter definition objects
 * @param {Object} options - Additional schema options
 * @param {boolean} options.timestamps - Add createdAt/updatedAt timestamps (default: true)
 * @param {Object} options.schemaOptions - Additional Mongoose schema options
 * @returns {Object} Complete Mongoose schema definition
 * 
 * @example
 * generateMongooseSchema([
 *   { name: 'title', type: 'string', required: true },
 *   { name: 'email', type: 'string', required: true }
 * ], { timestamps: true })
 */
function generateMongooseSchema(params, options = {}) {
  const { timestamps = true, schemaOptions = {} } = options;
  
  const fields = mapParametersToSchema(params);
  
  const schema = {
    ...fields
  };
  
  // Add schema options
  const finalSchemaOptions = {
    timestamps,
    ...schemaOptions
  };
  
  return {
    fields: schema,
    options: finalSchemaOptions
  };
}

/**
 * Create a conceptual Mongo collection schema per function to support admin views / tooling
 * 
 * Takes an array of function metadata and generates comprehensive collection schemas
 * with automatic fields and parameter mapping. Each function becomes a collection
 * with standardized MongoDB fields and parameter-derived fields.
 * 
 * @param {Array} functions - Array of function metadata objects
 * @param {string} functions[].name - Function name (used for collection naming)
 * @param {Array} functions[].parameters - Array of parameter objects
 * @returns {Object} Object with collection names as keys and schema definitions as values
 * 
 * @example
 * generateMongoSchema([
 *   {
 *     name: 'createUser',
 *     parameters: [
 *       { name: 'userName', type: 'string', required: true },
 *       { name: 'userEmail', type: 'string', required: true }
 *     ]
 *   }
 * ])
 * // returns {
 * //   create_users: {
 * //     _id: { type: 'ObjectId', auto: true },
 * //     createdAt: { type: 'Date', default: 'Date.now' },
 * //     updatedAt: { type: 'Date', default: 'Date.now' },
 * //     user_name: { type: 'String', required: true },
 * //     user_email: { type: 'String', required: true, validate: {...} }
 * //   }
 * // }
 */
function generateMongoSchema(functions) {
  if (!Array.isArray(functions)) {
    throw new Error('Functions must be an array');
  }
  
  const schema = {};
  
  for (const func of functions) {
    // Validate function metadata
    if (!func || typeof func !== 'object') {
      throw new Error('Function metadata must be an object');
    }
    
    if (typeof func.name !== 'string' || !func.name.trim()) {
      throw new Error('Function name must be a non-empty string');
    }
    
    if (!Array.isArray(func.parameters)) {
      throw new Error('Function parameters must be an array');
    }
    
    const collectionName = getCollectionName(func.name);
    
    // Initialize collection schema with standard MongoDB fields
    const collection = schema[collectionName] ?? (schema[collectionName] = {
      _id: { type: 'ObjectId', auto: true },
      createdAt: { type: 'Date', default: 'Date.now' },
      updatedAt: { type: 'Date', default: 'Date.now' },
    });
    
    // Track fields we have already assigned to avoid redundant overwrites
    const seen = new Set(Object.keys(collection));
    
    for (const param of func.parameters) {
      const fieldName = normalizeFieldName(param.name);
      if (!seen.has(fieldName)) {
        collection[fieldName] = mapParameterToMongoType(param);
        seen.add(fieldName);
      }
    }
  }
  
  return schema;
}

module.exports = {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema,
  generateMongoSchema  // New function for multi-function schema generation
};