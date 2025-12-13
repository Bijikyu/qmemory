/**
 * Schema Generator
 * Generates Mongoose schemas from parameter definitions
 */

const { validateParameter, validateParameters } = require('../validators/parameter-validator');
const { generateValidationRules } = require('../validators/validation-rules');

/**
 * Map parameter to Mongoose type with validation
 * @param {Object} param - Parameter definition
 * @returns {Object} Mongoose field descriptor
 */
function mapParameterToMongoType(param) {
  validateParameter(param);
  return generateValidationRules(param);
}

/**
 * Map multiple parameters to schema fields
 * @param {Array} params - Array of parameter definitions
 * @returns {Object} Schema fields object
 */
function mapParametersToSchema(params) {
  validateParameters(params);
  
  const schema = {};
  
  for (const param of params) {
    const descriptor = mapParameterToMongoType(param);
    schema[param.name] = descriptor;
  }
  
  return schema;
}

/**
 * Generate complete Mongoose schema with options
 * @param {Array} params - Array of parameter definitions
 * @param {Object} options - Schema options
 * @returns {Object} Complete schema definition
 */
function generateMongooseSchema(params, options = {}) {
  const { timestamps = true, schemaOptions = {} } = options;
  
  const schemaFields = mapParametersToSchema(params);
  
  const finalSchemaOptions = {
    timestamps,
    ...schemaOptions
  };
  
  return {
    fields: schemaFields,
    options: finalSchemaOptions
  };
}

module.exports = {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema
};