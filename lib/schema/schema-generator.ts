/**
 * Schema Generator Module
 *
 * Purpose: Automatically generates Mongoose schemas from parameter definitions with
 * comprehensive validation and type mapping. This module provides a declarative way
 * to create database schemas while ensuring type safety and validation consistency.
 *
 * Design Philosophy:
 * - Declarative schema definition: Define schemas through simple parameter arrays
 * - Type safety: Compile-time validation of schema definitions
 * - Automatic validation: Generate validation rules based on field types and names
 * - Flexible configuration: Support for timestamps and custom schema options
 * - Error prevention: Parameter validation before schema generation
 *
 * Integration Notes:
 * - Used throughout the system for automatic schema creation
 * - Integrates with validation-rules module for intelligent validation generation
 * - Works with parameter-validator module for input validation
 * - Provides consistent schema patterns across all database models
 *
 * Performance Considerations:
 * - Schema generation is one-time cost at application startup
 * - Parameter validation prevents runtime errors in production
 * - Optimized for batch processing of multiple parameters
 * - Minimal overhead during schema application to Mongoose
 *
 * Error Handling Strategy:
 * - Validates all parameters before schema generation
 * - Provides clear error messages for invalid parameter definitions
 * - Fails early to prevent runtime schema errors
 * - Maintains schema consistency through validation
 *
 * Architecture Decision: Why use declarative schema generation?
 * - Reduces boilerplate code in model definitions
 * - Ensures consistent field types and validation across models
 * - Leverages type system for compile-time error detection
 * - Makes schema modifications easier and more maintainable
 * - Provides centralized control over schema generation patterns
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import { validateParameter, validateParameters } from '../validators/parameter-validator.js';
import { generateValidationRules } from '../validators/validation-rules.js';

/**
 * Parameter definition interface
 *
 * Defines the structure of parameter definitions used to generate database schemas.
 * This interface captures all necessary information for field type mapping and validation.
 *
 * @interface ParameterDefinition
 */
interface ParameterDefinition {
  name: string; // Field name in the database schema
  type: string; // Data type (string, number, boolean, etc.)
  required?: boolean; // Whether the field is required in documents
}

/**
 * Schema generation options interface
 *
 * Defines configuration options for schema generation including
 * automatic timestamp management and custom Mongoose options.
 *
 * @interface SchemaOptions
 */
interface SchemaOptions {
  timestamps?: boolean; // Whether to add createdAt/updatedAt timestamps (default: false)
  schemaOptions?: Record<string, any>; // Additional Mongoose schema options
}

/**
 * Mongoose schema definition interface
 *
 * Represents the structure of a Mongoose schema definition with
 * dynamic field keys mapped to field descriptors.
 *
 * @interface MongooseSchemaDefinition
 */
interface MongooseSchemaDefinition {
  [key: string]: any; // Dynamic field names mapped to field descriptors
}

/**
 * Map parameter to Mongoose type with automatic validation rules
 *
 * This function transforms a parameter definition into a complete Mongoose field
 * descriptor including type mapping, validation rules, and required status.
 *
 * @param param - Parameter definition containing name, type, and required status
 * @returns {any} Complete Mongoose field descriptor with validation rules
 *
 * @example
 * const fieldDescriptor = mapParameterToMongoType({
 *   name: 'email',
 *   type: 'string',
 *   required: true
 * });
 * // Returns: { type: String, required: true, validate: { validator: ..., message: ... } }
 */
function mapParameterToMongoType(param: ParameterDefinition): any {
  validateParameter(param); // Validate parameter before processing to ensure schema integrity
  return generateValidationRules(param); // Generate validation rules based on field name and type
}

/**
 * Map multiple parameters to complete schema fields object
 *
 * This function processes an array of parameter definitions and converts them
 * into a Mongoose schema definition object with all fields properly configured.
 *
 * @param params - Array of parameter definitions to include in the schema
 * @returns {Record<string, any>} Complete schema fields object ready for Mongoose
 *
 * @example
 * const schemaFields = mapParametersToSchema([
 *   { name: 'email', type: 'string', required: true },
 *   { name: 'age', type: 'number', required: false }
 * ]);
 * // Returns: { email: { type: String, required: true, validate: {...} }, age: { type: Number } }
 */
function mapParametersToSchema(params: ParameterDefinition[]): Record<string, any> {
  validateParameters(params); // Validate all parameters to prevent schema generation errors
  const schema: Record<string, any> = {};

  // Process each parameter and map it to a schema field
  for (const param of params) {
    const descriptor = mapParameterToMongoType(param);
    schema[param.name] = descriptor;
  }
  return schema;
}
/**
 * Generate complete Mongoose schema with all options applied
 *
 * This function creates a complete schema definition including field mappings,
 * validation rules, timestamps, and custom Mongoose options. It's the main
 * entry point for schema generation in the application.
 *
 * @param params - Array of parameter definitions for schema fields
 * @param options - Schema configuration options (default: { timestamps: true })
 * @returns {object} Complete schema definition with fields and options
 *
 * @example
 * const userSchema = generateMongooseSchema([
 *   { name: 'email', type: 'string', required: true },
 *   { name: 'name', type: 'string', required: true }
 * ], { timestamps: true });
 *
 * // Returns: {
 * //   fields: { email: { type: String, required: true, validate: {...} }, ... },
 * //   options: { timestamps: true }
 * // }
 */
function generateMongooseSchema(
  params: ParameterDefinition[],
  options: SchemaOptions = {}
): { fields: MongooseSchemaDefinition; options: any } {
  // Extract options with sensible defaults
  const { timestamps = true, schemaOptions = {} } = options;

  // Generate schema fields with validation rules
  const schemaFields = mapParametersToSchema(params);

  // Merge default timestamps with custom schema options
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
