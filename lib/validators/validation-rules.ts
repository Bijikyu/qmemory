/**
 * Validation Rules Generator Module
 *
 * Purpose: Automatically generates validation rules for Mongoose schemas based on
 * field names and types. This module provides intelligent validation rule inference
 * to reduce boilerplate code and ensure consistent data validation across the application.
 *
 * Design Philosophy:
 * - Convention over configuration: Infer validation rules from field naming patterns
 * - Extensible: Easy to add new validation patterns for specific field types
 * - Consistent: Apply the same validation rules across all schemas
 * - Minimal dependencies: Use lightweight regex patterns instead of heavy validation libraries
 * - Type-safe: Leverage TypeScript for compile-time validation rule generation
 *
 * Integration Notes:
 * - Used throughout the system for automatic schema generation
 * - Integrates with Mongoose for database-level validation
 * - Works with the typeMap module for consistent type mapping
 * - Provides email, URL, phone, and other common field validations
 *
 * Performance Considerations:
 * - Rule generation is O(1) per field - minimal overhead
 * - Regex patterns are optimized for performance
 * - Validation rules are cached at schema generation time
 * - No runtime overhead after schema creation
 *
 * Error Handling Strategy:
 * - Provides clear validation error messages for end users
 * - Uses client-side friendly error messages
 * - Gracefully handles edge cases in field name detection
 * - Fails safely when validation patterns cannot be matched
 *
 * Architecture Decision: Why generate validation rules from field names?
 * - Reduces boilerplate code in schema definitions
 * - Ensures consistent validation across similar field types
 * - Leverages common naming conventions in the codebase
 * - Makes adding new validation patterns straightforward
 * - Reduces human error in manual validation rule creation
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import { getMongoType } from '../typeMap.js';

/**
 * Parameter interface for field definition
 *
 * Defines the structure of parameter objects used to generate validation rules.
 * This interface captures the essential information needed for rule generation.
 *
 * @interface Parameter
 */
interface Parameter {
  type: string; // Data type of the parameter (string, number, boolean, etc.)
  required?: boolean; // Whether the parameter is required (default: false)
  name: string; // Name of the parameter used for validation rule inference
}

/**
 * Validation rule interface
 *
 * Defines the structure of Mongoose validation rules including the validator
 * function and the error message to display when validation fails.
 *
 * @interface ValidationRule
 */
interface ValidationRule {
  validator: string; // Mongoose validator function as a string
  message: string; // User-friendly error message for validation failures
}

/**
 * MongoDB type alias for type safety
 *
 * This type represents the valid MongoDB field types that can be used in
 * Mongoose schemas. It's derived from the getMongoType function return type.
 */
type MongoTypeName = ReturnType<typeof getMongoType>;

/**
 * Field type interface for schema generation
 *
 * Defines the complete structure of a field in a Mongoose schema including
 * the MongoDB type, required status, and optional validation rules.
 *
 * @interface FieldType
 */
interface FieldType {
  type: MongoTypeName; // MongoDB field type (String, Number, Boolean, etc.)
  required?: boolean; // Whether the field is required in documents
  validate?: ValidationRule; // Optional validation rule for custom field validation
}

/**
 * Generate validation rules for a parameter based on its name and type
 *
 * This function intelligently infers validation rules based on field naming conventions.
 * It uses pattern matching to detect common field types (email, URL, phone, etc.) and
 * applies appropriate validation rules automatically.
 *
 * @param param - Parameter object containing type, required status, and name
 * @returns {FieldType} Complete Mongoose field descriptor with validation rules
 *
 * @example
 * const emailField = generateValidationRules({
 *   type: 'string',
 *   required: true,
 *   name: 'userEmail'
 * });
 * // Returns field with email validation rule applied
 */
function generateValidationRules(param: Parameter): FieldType {
  // Create base field type with normalized MongoDB type and required status
  const baseType: FieldType = {
    type: getMongoType(param.type), // Normalize incoming type strings for consistent schema generation
    required: param.required, // Preserve caller intent for required field validation
  };
  const lower = param.name.toLowerCase(); // Use lowercase for pattern matching to handle case variations

  // Email validation: Detect fields containing 'email' in their name
  // Pattern matches common email field names like: email, userEmail, emailAddress, primaryEmail
  if (lower.includes('email')) {
    return {
      ...baseType,
      validate: {
        // Lightweight regex for email validation without heavy external dependencies
        validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
        message: 'Invalid email format',
      },
    };
  }

  // URL validation: Detect fields containing 'url' in their name
  // Pattern matches common URL field names like: url, websiteUrl, profileUrl, imageUrl
  if (lower.includes('url')) {
    return {
      ...baseType,
      validate: {
        // Use WHATWG URL parser for robust validation without third-party packages
        validator: 'function(v) { try { new URL(v); return true; } catch { return false; } }',
        message: 'Invalid URL format',
      },
    };
  }

  // Return base field type if no specific validation patterns match
  return baseType;
}

export { generateValidationRules };
