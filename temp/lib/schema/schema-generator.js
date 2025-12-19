/**
 * Schema Generator
 * Generates Mongoose schemas from parameter definitions
 */
import { validateParameter, validateParameters, } from '../validators/parameter-validator.js';
import { generateValidationRules } from '../validators/validation-rules.js';
/**
 * Map parameter to Mongoose type with validation
 * @param {ParameterDefinition} param - Parameter definition
 * @returns {any} Mongoose field descriptor
 */
function mapParameterToMongoType(param) {
    validateParameter(param);
    return generateValidationRules(param);
}
/**
 * Map multiple parameters to schema fields
 * @param {ParameterDefinition[]} params - Array of parameter definitions
 * @returns {Record<string, any>} Schema fields object
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
 * @param {ParameterDefinition[]} params - Array of parameter definitions
 * @param {SchemaOptions} options - Schema options
 * @returns {MongooseSchemaDefinition} Complete schema definition
 */
function generateMongooseSchema(params, options = {}) {
    const { timestamps = true, schemaOptions = {} } = options;
    const schemaFields = mapParametersToSchema(params);
    const finalSchemaOptions = {
        timestamps,
        ...schemaOptions,
    };
    return {
        fields: schemaFields,
        options: finalSchemaOptions,
    };
}
export { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema, };
