/**
 * Parameter Validation Utilities
 * Validates parameter objects for schema generation
 */

// Type definitions
interface Parameter {
  name: string;
  type: string;
  required: boolean;
}

interface FunctionMetadata {
  name: string;
  parameters: Parameter[];
}

type UnknownRecord = Record<PropertyKey, unknown>;

/**
 * Validates that the provided value represents a parameter definition.
 * @param param - Candidate parameter.
 * @throws Error when the shape is invalid.
 */
function validateParameter(param: unknown): asserts param is Parameter {
  if (!param || typeof param !== 'object') {
    throw new Error('Parameter must be an object'); // Enforce object shape to avoid runtime key access errors
  }
  const candidate = param as UnknownRecord;
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) {
    throw new Error('Parameter name must be a non-empty string'); // Name drives schema keys so blank values are unsafe
  }
  if (typeof candidate.type !== 'string' || !candidate.type.trim()) {
    throw new Error('Parameter type must be a non-empty string'); // Type is required to generate Mongoose schema fields
  }
  if (typeof candidate.required !== 'boolean') {
    throw new Error('Parameter required must be a boolean'); // Required flag needs strict boolean semantics for clarity
  }
}

/**
 * Validates an array of parameter definitions.
 * @param params - Candidate array of parameters.
 * @throws Error when the array or any entry is invalid.
 */
function validateParameters(params: unknown): asserts params is Parameter[] {
  if (!Array.isArray(params)) {
    throw new Error('Parameters must be an array'); // Guard against single objects to maintain API expectations
  }
  for (const param of params) {
    validateParameter(param); // Reuse single validator to guarantee each element matches runtime contract
  }
}

/**
 * Validates metadata describing a function signature.
 * @param func - Candidate metadata payload.
 * @throws Error when structure or nested parameters are invalid.
 */
function validateFunctionMetadata(func: unknown): asserts func is FunctionMetadata {
  if (!func || typeof func !== 'object') {
    throw new Error('Function metadata must be an object'); // Prevent null and primitive metadata from propagating
  }
  const candidate = func as UnknownRecord;
  if (typeof candidate.name !== 'string' || !candidate.name.trim()) {
    throw new Error('Function name must be a non-empty string'); // Function names seed schema names; blanks break generation
  }
  validateParameters(candidate.parameters); // Reuse array validator to enforce deep correctness
}

export { validateParameter, validateParameters, validateFunctionMetadata };
