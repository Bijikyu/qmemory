/**
 * Mongoose Schema Mapping Utilities
 * Parameter to Mongoose field descriptor conversion with validation
 *
 * This module provides utilities for automatically generating Mongoose schema
 * field descriptors from parameter definitions, including intelligent validation
 * based on field names and types.
 *
 * Refactored for Single Responsibility Principle - now delegates to specialized modules:
 * - Parameter validation: validators/parameter-validator.js
 * - Validation rules: validators/validation-rules.js
 * - Schema generation: schema/schema-generator.js
 * - Collection schemas: schema/collection-schema-generator.js
 */
import type {
  SchemaDefinition,
  SchemaDefinitionProperty,
  SchemaOptions,
  AnyObject,
} from 'mongoose';
import {
  mapParameterToMongoType as rawMapParameterToMongoType,
  mapParametersToSchema as rawMapParametersToSchema,
  generateMongooseSchema as rawGenerateMongooseSchema,
} from './schema/schema-generator.js';
import { generateMongoSchema as rawGenerateMongoSchema } from './schema/collection-schema-generator.js';

interface ParameterDefinition {
  name: string;
  type: string;
  required?: boolean;
}

interface SchemaGeneratorOptions {
  timestamps?: boolean;
  schemaOptions?: SchemaOptions<AnyObject>;
}

interface FunctionMetadata {
  name: string;
  parameters: ParameterDefinition[];
}

type SchemaFields = SchemaDefinition<AnyObject>;

const mapParameterToMongoType = (param: ParameterDefinition): SchemaDefinitionProperty<AnyObject> =>
  rawMapParameterToMongoType(param) as SchemaDefinitionProperty<AnyObject>;

const mapParametersToSchema = (params: ParameterDefinition[]): SchemaFields =>
  rawMapParametersToSchema(params) as SchemaFields;

const generateMongooseSchema = (
  params: ParameterDefinition[],
  options: SchemaGeneratorOptions = {}
): { fields: SchemaFields; options: SchemaOptions<AnyObject> } =>
  rawGenerateMongooseSchema(params, options) as {
    fields: SchemaFields;
    options: SchemaOptions<AnyObject>;
  };

const generateMongoSchema = (
  functions: FunctionMetadata[]
): Record<string, SchemaDefinition<AnyObject>> =>
  rawGenerateMongoSchema(functions) as Record<string, SchemaDefinition<AnyObject>>;

export {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema,
  generateMongoSchema,
};
export type { ParameterDefinition, SchemaGeneratorOptions, FunctionMetadata, SchemaFields };
