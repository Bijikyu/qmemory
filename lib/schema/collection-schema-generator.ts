/**
 * Collection Schema Generator Module
 *
 * Purpose: Generates complete MongoDB collection schemas from function metadata,
 * automatically handling field mapping, validation rules, and standard MongoDB
 * document structure. This module provides high-level schema generation
 * for entire database collections based on API function definitions.
 *
 * Design Philosophy:
 * - Convention over configuration: Infer collection structure from function signatures
 * - Automatic MongoDB fields: Add _id, createdAt, updatedAt to all collections
 * - Field normalization: Convert parameter names to consistent database field names
 * - Duplicate prevention: Avoid field overwrites when multiple functions target same collection
 * - Validation generation: Apply intelligent validation rules based on field names and types
 *
 * Integration Notes:
 * - Used by higher-level schema generation utilities
 * - Integrates with parameter-validator for function metadata validation
 * - Works with validation-rules module for automatic field validation
 * - Uses field-utils for name normalization and collection naming
 * - Provides complete MongoDB collection schemas ready for Mongoose
 *
 * Performance Considerations:
 * - Schema generation is O(n*m) where n is functions and m is average parameters
 * - Set-based field deduplication provides O(1) lookup performance
 * - One-time generation cost at application startup
 * - Efficient memory usage with field tracking and deduplication
 *
 * Error Handling Strategy:
 * - Validates all function metadata before processing
 * - Throws descriptive errors for invalid function definitions
 * - Prevents collection schema corruption through validation
 * - Handles edge cases in field name normalization
 *
 * Architecture Decision: Why generate schemas from function metadata?
 * - Aligns database structure with API endpoints automatically
 * - Reduces manual schema definition maintenance
 * - Ensures consistency between API and database layers
 * - Provides automated validation rule generation
 * - Simplifies onboarding of new API functions
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import { validateFunctionMetadata } from '../validators/parameter-validator.js';
import { generateValidationRules } from '../validators/validation-rules.js';
import { normalizeFieldName, getCollectionName } from '../field-utils.js';

/**
 * Generate MongoDB collection schema from function metadata
 *
 * This function processes an array of function metadata objects and generates
 * complete MongoDB collection schemas with automatic field mapping, validation
 * rules, and standard MongoDB document structure.
 *
 * @param functions - Array of function metadata objects containing parameters
 * @returns {Record<string, any>} Complete collection schemas object keyed by collection name
 *
 * @example
 * const schemas = generateMongoSchema([
 *   {
 *     name: 'createUser',
 *     parameters: [
 *       { name: 'userEmail', type: 'string', required: true },
 *       { name: 'userAge', type: 'number', required: false }
 *     ]
 *   },
 *   {
 *     name: 'updateUser',
 *     parameters: [
 *       { name: 'email', type: 'string', required: true }
 *     ]
 *   }
 * ]);
 *
 * // Returns:
 * // {
 * //   users: {
 * //     _id: { type: 'ObjectId', auto: true },
 * //     createdAt: { type: 'Date', default: 'Date.now' },
 * //     updatedAt: { type: 'Date', default: 'Date.now' },
 * //     user_email: { type: 'String', required: true, validate: { ... } },
 * //     user_age: { type: 'Number', required: false },
 * //     email: { type: 'String', required: true }
 * //   }
 * // }
 */
function generateMongoSchema(functions) {
  if (!Array.isArray(functions)) {
    throw new Error('Functions must be an array');
  }
  const schema = {};

  // Track seen fields per collection to avoid O(n²) Object.keys() calls
  const collectionSeenFields = new Map();

  // Process each function metadata to build collection schemas
  for (const func of functions) {
    validateFunctionMetadata(func); // Validate function structure before processing
    const collectionName = getCollectionName(func.name);

    // Initialize collection schema with standard MongoDB fields if not already created
    const collection =
      schema[collectionName] ??
      (schema[collectionName] = {
        _id: { type: 'ObjectId', auto: true }, // Standard MongoDB primary key
        createdAt: { type: 'Date', default: 'Date.now' }, // Automatic creation timestamp
        updatedAt: { type: 'Date', default: 'Date.now' }, // Automatic update timestamp
      });

    // Initialize seen fields tracking for this collection if not already done
    if (!collectionSeenFields.has(collectionName)) {
      collectionSeenFields.set(collectionName, new Set(Object.keys(collection)));
    }
    const seen = collectionSeenFields.get(collectionName);

    // Process each parameter from the function
    for (const param of func.parameters) {
      const fieldName = normalizeFieldName(param.name); // Convert to snake_case for database consistency

      // Only add field if we haven't seen it before (prevents overwrites)
      if (!seen.has(fieldName)) {
        collection[fieldName] = generateValidationRules(param); // Add validation rules based on field name
        seen.add(fieldName);
      }
    }
  }
  return schema;
}
export { generateMongoSchema };
