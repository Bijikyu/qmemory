/**
 * Parameter Validation Utilities
 * Validates parameter objects for schema generation
 */

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  [key: string]: any;
}

interface FunctionMetadata {
  name: string;
  parameters: Parameter[];
  [key: string]: any;
}

/**
 * Validate a single parameter object
 * @param param - Parameter to validate
 * @throws {Error} If parameter is invalid
 */
function validateParameter(param: Parameter): void {
  if (!param || typeof param !== 'object') {
    throw new Error('Parameter must be an object');
  }
  
  if (typeof param.name !== 'string' || !param.name.trim()) {
    throw new Error('Parameter name must be a non-empty string');
  }
  
  if (typeof param.type !== 'string' || !param.type.trim()) {
    throw new Error('Parameter type must be a non-empty string');
  }
  
  if (typeof param.required !== 'boolean') {
    throw new Error('Parameter required must be a boolean');
  }
}

/**
 * Validate array of parameters
 * @param params - Parameters to validate
 * @throws {Error} If parameters array is invalid
 */
function validateParameters(params: Parameter[]): void {
  if (!Array.isArray(params)) {
    throw new Error('Parameters must be an array');
  }
}

/**
 * Validate function metadata for schema generation
 * @param func - Function metadata to validate
 * @throws {Error} If function metadata is invalid
 */
function validateFunctionMetadata(func: FunctionMetadata): void {
  if (!func || typeof func !== 'object') {
    throw new Error('Function metadata must be an object');
  }
  
  if (typeof func.name !== 'string' || !func.name.trim()) {
    throw new Error('Function name must be a non-empty string');
  }
  
  if (!Array.isArray(func.parameters)) {
    throw new Error('Function parameters must be an array');
  }
}

export {
  validateParameter,
  validateParameters,
  validateFunctionMetadata
};

export type {
  Parameter,
  FunctionMetadata
};