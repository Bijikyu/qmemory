/**
 * Schema Generator
 * Generates Mongoose schemas from parameter definitions
 */
import { validateParameter, validateParameters } from '../validators/parameter-validator.js';
import { generateValidationRules } from '../validators/validation-rules.js';

// Type definitions
interface ParameterDefinition {
  name: string;
  type: string;
  required?: boolean;
}

interface SchemaOptions {
  timestamps?: boolean;
  schemaOptions?: Record<string, any>;
}

interface MongooseSchemaDefinition {
  [key: string]: any;
}

/**
 * Map parameter to Mongoose type with validation
 * @param param - Parameter definition
 * @returns Mongoose field descriptor
 */
function mapParameterToMongoType(param: ParameterDefinition): any {
  validateParameter(param);
  return generateValidationRules(param);
}

/**
 * Map multiple parameters to schema fields
 * @param params - Array of parameter definitions
 * @returns Schema fields object
 */
function mapParametersToSchema(params: ParameterDefinition[]): Record<string, any> {
  validateParameters(params);
  const schema: Record<string, any> = {};
  for (const param of params) {
    const descriptor = mapParameterToMongoType(param);
    schema[param.name] = descriptor;
  }
  return schema;
}
/**
 * Generate complete Mongoose schema with options
 * @param params - Array of parameter definitions
 * @param options - Schema options
 * @returns Complete schema definition
 */
function generateMongooseSchema(
  params: ParameterDefinition[],
  options: SchemaOptions = {}
): { fields: MongooseSchemaDefinition; options: any } {
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
export { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema };
