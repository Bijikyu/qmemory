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

import { 
  mapParameterToMongoType, 
  mapParametersToSchema, 
  generateMongooseSchema 
} from './schema/schema-generator.js';
import { generateMongoSchema } from './schema/collection-schema-generator.js';

export {
  mapParameterToMongoType,
  mapParametersToSchema,
  generateMongooseSchema,
  generateMongoSchema
};