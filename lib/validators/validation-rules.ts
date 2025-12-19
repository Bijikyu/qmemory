/**
 * Validation Rules Generator
 * Creates validation rules for Mongoose schemas based on field names
 */
import { getMongoType } from '../typeMap.js';

// Type definitions
interface Parameter {
  type: string;
  required?: boolean;
  name: string;
}

interface ValidationRule {
  validator: string;
  message: string;
}

type MongoTypeName = ReturnType<typeof getMongoType>;

interface FieldType {
  type: MongoTypeName;
  required?: boolean;
  validate?: ValidationRule;
}

/**
 * Generate validation rules for a parameter based on its name
 * @param param - Parameter object
 * @returns Mongoose field descriptor with validation rules
 */
function generateValidationRules(param: Parameter): FieldType {
  const baseType: FieldType = {
    type: getMongoType(param.type), // Normalize incoming type strings so schema generation is consistent
    required: param.required, // Preserve caller intent regarding required-ness for validation enforcement
  };
  const lower = param.name.toLowerCase(); // Use lowercase comparisons to detect heuristic field matches safely
  // Email validation for fields containing 'email'
  if (lower.includes('email')) {
    return {
      ...baseType,
      validate: {
        validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }', // Use light-weight regex to catch common email mistakes without heavy dependencies
        message: 'Invalid email format',
      },
    };
  }
  // URL validation for fields containing 'url'
  if (lower.includes('url')) {
    return {
      ...baseType,
      validate: {
        validator: 'function(v) { try { new URL(v); return true; } catch { return false; } }', // Rely on WHATWG URL parser for robust validation without third-party packages
        message: 'Invalid URL format',
      },
    };
  }
  return baseType;
}

export { generateValidationRules };
