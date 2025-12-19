/**
 * Collection Schema Generator
 * Generates MongoDB collection schemas from function metadata
 */

import { validateFunctionMetadata, FunctionMetadata } from '../validators/parameter-validator.js';
import { generateValidationRules } from '../validators/validation-rules.js';
import { normalizeFieldName, getCollectionName } from '../field-utils.js';

/**
 * Generate MongoDB collection schema from function metadata
 * @param {FunctionMetadata[]} functions - Array of function metadata objects
 * @returns {Record<string, any>} Collection schemas object
 */
function generateMongoSchema(functions: FunctionMetadata[]): Record<string, any> {
  if (!Array.isArray(functions)) {
    throw new Error('Functions must be an array');
  }

  const schema: Record<string, any> = {};

  for (const func of functions) {
    validateFunctionMetadata(func);

    const collectionName = getCollectionName(func.name);

    // Initialize collection schema with standard MongoDB fields
    const collection =
      schema[collectionName] ??
      (schema[collectionName] = {
        _id: { type: 'ObjectId', auto: true },
        createdAt: { type: 'Date', default: 'Date.now' },
        updatedAt: { type: 'Date', default: 'Date.now' },
      });

    // Track fields we have already assigned to avoid redundant overwrites
    const seen = new Set(Object.keys(collection));

    for (const param of func.parameters) {
      const fieldName = normalizeFieldName(param.name);
      if (!seen.has(fieldName)) {
        collection[fieldName] = generateValidationRules(param);
        seen.add(fieldName);
      }
    }
  }

  return schema;
}

export { generateMongoSchema };
