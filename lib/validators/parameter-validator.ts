/**
 * Parameter Validation Utilities Module
 *
 * Purpose: Provides robust validation for parameter objects used in schema generation.
 * This module ensures type safety and prevents runtime errors by validating all
 * parameter definitions before they are used to create database schemas.
 *
 * Design Philosophy:
 * - Fail fast: Validate all inputs before processing to prevent runtime errors
 * - Type safety: Use TypeScript assertion functions for compile-time guarantees
 * - Clear errors: Provide descriptive error messages for invalid inputs
 * - Preventive: Catch schema definition errors before they reach the database
 * - Comprehensive: Validate all aspects of parameter definitions
 *
 * Integration Notes:
 * - Used by schema-generator module for parameter validation
 * - Integrates with Mongoose schema generation pipeline
 * - Provides validation for both individual parameters and parameter arrays
 * - Ensures consistency across all schema generation operations
 *
 * Performance Considerations:
 * - Validation is O(n) for parameter arrays where n is number of parameters
 * - Minimal overhead during validation (less than 1ms per parameter)
 * - Early error detection prevents expensive database errors later
 * - Type assertions have zero runtime cost after TypeScript compilation
 *
 * Error Handling Strategy:
 * - Throws descriptive errors for invalid parameter structures
 * - Validates all required fields before processing
 * - Uses assertion functions for TypeScript type narrowing
 * - Provides clear context about what failed validation
 *
 * Architecture Decision: Why use assertion functions?
 * - Provides compile-time type safety after validation
 * - Eliminates need for runtime type checks after validation passes
 * - Makes the intent of validation explicit in function signatures
 * - Allows TypeScript to infer correct types in calling code
 * - Prevents type assertion errors in the rest of the codebase
 *
 * @author System Architecture Team
 * @version 1.0.0
 */

import { validateObject } from '../common-patterns.js';

/**
 * Parameter interface for validation
 *
 * Defines the structure of parameter objects that are validated by this module.
 * This interface represents the expected shape for schema generation parameters.
 *
 * @interface Parameter
 */
interface Parameter {
  name: string; // Parameter name used as field key in database schema
  type: string; // Parameter type for MongoDB field type mapping
  required: boolean; // Whether parameter is required in database documents
}

/**
 * Function metadata interface
 *
 * Defines structure for function parameter metadata used in advanced
 * schema generation scenarios.
 *
 * @interface FunctionMetadata
 */
interface FunctionMetadata {
  name: string; // Function name for identification
  parameters: Parameter[]; // Array of function parameters
}

/**
 * Unknown record type for type narrowing
 *
 * Represents a record with unknown values used during validation
 * for type assertion and narrowing operations.
 */
type UnknownRecord = Record<PropertyKey, unknown>;

/**
 * Validates that provided value represents a parameter definition
 *
 * This function performs comprehensive validation of parameter objects to ensure
 * they meet the requirements for schema generation. It uses TypeScript assertion
 * functions to provide type safety after validation passes.
 *
 * @param param - Candidate parameter object to validate
 * @throws {Error} When parameter shape or values are invalid
 *
 * @example
 * validateParameter({ name: 'email', type: 'string', required: true }); // Passes
 * validateParameter({ name: '', type: 'string', required: true }); // Throws: Parameter name must be a non-empty string
 */
function validateParameter(param: unknown): asserts param is Parameter {
  validateObject(param, 'Parameter'); // Enforce object shape to avoid runtime key access errors
  const candidate = param as UnknownRecord;

  // Validate parameter name - required for schema field generation
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) {
    throw new Error('Parameter name must be a non-empty string'); // Name drives schema keys so blank values are unsafe
  }

  // Validate parameter type - required for MongoDB type mapping
  if (typeof candidate.type !== 'string' || !candidate.type.trim()) {
    throw new Error('Parameter type must be a non-empty string'); // Type is required to generate Mongoose schema fields
  }

  // Validate required flag - needs strict boolean for schema semantics
  if (typeof candidate.required !== 'boolean') {
    throw new Error('Parameter required must be a boolean'); // Required flag needs strict boolean semantics for clarity
  }
}

/**
 * Validates an array of parameter definitions
 *
 * This function validates an entire array of parameter definitions, ensuring
 * each parameter in the array meets the validation requirements. It provides
 * type safety for the entire parameter array after validation passes.
 *
 * @param params - Candidate array of parameter objects to validate
 * @throws {Error} When array structure or any parameter within is invalid
 *
 * @example
 * validateParameters([
 *   { name: 'email', type: 'string', required: true },
 *   { name: 'age', type: 'number', required: false }
 * ]); // Passes
 *
 * validateParameters('not an array'); // Throws: Parameters must be an array
 */
function validateParameters(params: unknown): asserts params is Parameter[] {
  if (!Array.isArray(params)) {
    throw new Error('Parameters must be an array'); // Guard against single objects to maintain API expectations
  }

  // Validate each parameter in the array
  for (const param of params) {
    validateParameter(param); // Reuse single validator to guarantee each element matches runtime contract
  }
}

/**
 * Validates metadata describing a function signature
 *
 * This function validates function metadata objects that include function names
 * and parameter arrays. It's used in advanced schema generation scenarios
 * where function signatures drive schema creation.
 *
 * @param func - Candidate function metadata object to validate
 * @throws {Error} When function metadata structure or nested parameters are invalid
 *
 * @example
 * validateFunctionMetadata({
 *   name: 'createUser',
 *   parameters: [
 *     { name: 'email', type: 'string', required: true },
 *     { name: 'age', type: 'number', required: false }
 *   ]
 * }); // Passes
 *
 * validateFunctionMetadata({ name: '', parameters: [] }); // Throws: Function name must be a non-empty string
 */
function validateFunctionMetadata(func: unknown): asserts func is FunctionMetadata {
  validateObject(func, 'Function metadata'); // Prevent null and primitive metadata from propagating
  const candidate = func as UnknownRecord;

  // Validate function name - required for schema generation
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) {
    throw new Error('Function name must be a non-empty string'); // Function names seed schema names; blanks break generation
  }

  // Recursively validate parameters array to ensure deep correctness
  validateParameters(candidate.parameters); // Reuse array validator to enforce deep correctness
}

export { validateParameter, validateParameters, validateFunctionMetadata };
