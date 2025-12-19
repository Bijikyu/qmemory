/**
 * Validation Rules Generator
 * Creates validation rules for Mongoose schemas based on field names
 */
import { getMongoType } from '../typeMap.js';
/**
 * Generate validation rules for a parameter based on its name
 * @param param - Parameter object
 * @returns Mongoose field descriptor with validation rules
 */
function generateValidationRules(param) {
    const baseType = {
        type: getMongoType(param.type),
        required: param.required
    };
    const lower = param.name.toLowerCase();
    // Email validation for fields containing 'email'
    if (lower.includes('email')) {
        return {
            ...baseType,
            validate: {
                validator: 'function(v) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }',
                message: 'Invalid email format',
            },
        };
    }
    // URL validation for fields containing 'url'
    if (lower.includes('url')) {
        return {
            ...baseType,
            validate: {
                validator: 'function(v) { try { new URL(v); return true; } catch { return false; } }',
                message: 'Invalid URL format',
            },
        };
    }
    return baseType;
}
export { generateValidationRules };
