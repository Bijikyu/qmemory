/**
 * Centralized Input Validation Utility
 *
 * Purpose: Eliminates duplicate input validation patterns throughout the codebase
 * by providing comprehensive, reusable validation functions with consistent error handling.
 *
 * Design Principles:
 * - Composability: Validators can be combined for complex validation rules
 * - Performance: Optimized for frequent validation operations
 * - Consistency: Standardized validation patterns and error messages
 * - Type safety: Full TypeScript support with proper type guards
 * - Extensibility: Easy to add new validation rules
 */

import { assert, ErrorFactory, ErrorContext } from './centralized-errors';

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
    value: any;
  }>;
}

export interface FieldValidator {
  required?: boolean;
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: ValidationRule[];
  sanitize?: boolean;
}

export interface SchemaValidator {
  [field: string]: FieldValidator;
}

// Basic validation functions
export const validators = {
  // String validators
  isString: (value: any): value is string => typeof value === 'string',
  isNonEmptyString: (value: any): value is string => typeof value === 'string' && value.length > 0,
  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  isSlug: (value: string): boolean => {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(value);
  },
  isUuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  isAlpha: (value: string): boolean => /^[a-zA-Z]+$/.test(value),
  isAlphanumeric: (value: string): boolean => /^[a-zA-Z0-9]+$/.test(value),
  isNumeric: (value: string): boolean => /^-?\d*\.?\d+$/.test(value),

  // Number validators
  isNumber: (value: any): value is number => typeof value === 'number' && Number.isFinite(value),
  isInteger: (value: any): value is number => Number.isInteger(value),
  isPositive: (value: number): boolean => value > 0,
  isNonNegative: (value: number): boolean => value >= 0,
  isInRange: (value: number, min: number, max: number): boolean => value >= min && value <= max,

  // Array validators
  isArray: (value: any): value is any[] => Array.isArray(value),
  isNonEmptyArray: (value: any): value is any[] => Array.isArray(value) && value.length > 0,
  hasLength: (value: any[], length: number): boolean =>
    Array.isArray(value) && value.length === length,

  // Object validators
  isObject: (value: any): value is object =>
    typeof value === 'object' && value !== null && !Array.isArray(value),
  isPlainObject: (value: any): value is object => {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.prototype.toString.call(value) === '[object Object]'
    );
  },

  // Boolean validators
  isBoolean: (value: any): value is boolean => typeof value === 'boolean',

  // Date validators
  isDate: (value: any): value is Date => value instanceof Date && !isNaN(value.getTime()),
  isValidDateString: (value: string): boolean => !isNaN(Date.parse(value)),

  // Generic validators
  isDefined: (value: any): boolean => value !== undefined && value !== null,
  isEmpty: (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },
  matchesPattern: (value: string, pattern: RegExp): boolean => pattern.test(value),
  isOneOf: <T>(value: any, allowedValues: T[]): value is T => allowedValues.includes(value),
};

// Sanitization functions
export const sanitizers = {
  trim: (value: string): string => value.trim(),
  toLowerCase: (value: string): string => value.toLowerCase(),
  toUpperCase: (value: string): string => value.toUpperCase(),
  escapeHtml: (value: string): string => {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return value.replace(/[&<>"']/g, match => htmlEscapes[match]);
  },
  removeNonNumeric: (value: string): string => value.replace(/[^0-9]/g, ''),
  removeNonAlphanumeric: (value: string): string => value.replace(/[^a-zA-Z0-9]/g, ''),
  limitLength: (value: string, maxLength: number): string =>
    value.length > maxLength ? value.substring(0, maxLength) : value,
};

// Field validation class
export class FieldValidatorClass {
  private rules: ValidationRule[] = [];
  private fieldConfig: FieldValidator;

  constructor(config: FieldValidator) {
    this.fieldConfig = config;
    this.buildRules();
  }

  private buildRules(): void {
    const {
      required,
      type,
      minLength,
      maxLength,
      min,
      max,
      pattern,
      enum: enumValues,
      custom,
    } = this.fieldConfig;

    // Required validation
    if (required) {
      this.rules.push({
        validate: (value: any) => validators.isDefined(value) && !validators.isEmpty(value),
        message: 'field is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Type validation
    if (type) {
      this.rules.push({
        validate: (value: any) => {
          switch (type) {
            case 'string':
              return validators.isString(value);
            case 'number':
              return validators.isNumber(value);
            case 'integer':
              return validators.isInteger(value);
            case 'boolean':
              return validators.isBoolean(value);
            case 'array':
              return validators.isArray(value);
            case 'object':
              return validators.isObject(value);
            default:
              return true;
          }
        },
        message: `field must be a ${type}`,
        code: 'INVALID_TYPE',
      });
    }

    // String length validation
    if (minLength !== undefined) {
      this.rules.push({
        validate: (value: any) => validators.isString(value) && value.length >= minLength,
        message: `field must be at least ${minLength} characters`,
        code: 'MIN_LENGTH',
      });
    }

    if (maxLength !== undefined) {
      this.rules.push({
        validate: (value: any) => validators.isString(value) && value.length <= maxLength,
        message: `field must be at most ${maxLength} characters`,
        code: 'MAX_LENGTH',
      });
    }

    // Number range validation
    if (min !== undefined) {
      this.rules.push({
        validate: (value: any) => validators.isNumber(value) && value >= min,
        message: `field must be at least ${min}`,
        code: 'MIN_VALUE',
      });
    }

    if (max !== undefined) {
      this.rules.push({
        validate: (value: any) => validators.isNumber(value) && value <= max,
        message: `field must be at most ${max}`,
        code: 'MAX_VALUE',
      });
    }

    // Pattern validation
    if (pattern) {
      this.rules.push({
        validate: (value: any) =>
          validators.isString(value) && validators.matchesPattern(value, pattern),
        message: 'field format is invalid',
        code: 'INVALID_FORMAT',
      });
    }

    // Enum validation
    if (enumValues) {
      this.rules.push({
        validate: (value: any) => validators.isOneOf(value, enumValues),
        message: `field must be one of: ${enumValues.join(', ')}`,
        code: 'INVALID_ENUM',
      });
    }

    // Custom validation rules
    if (custom) {
      this.rules.push(...custom);
    }
  }

  public validate(value: any, fieldName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Skip validation if field is not required and value is empty
    if (!this.fieldConfig.required && validators.isEmpty(value)) {
      return { isValid: true, errors: [] };
    }

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message.replace('field', fieldName));
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  public sanitize(value: any): any {
    if (!validators.isString(value)) return value;

    let sanitized = value;
    if (this.fieldConfig.sanitize) {
      sanitized = sanitizers.trim(sanitized);
    }
    return sanitized;
  }
}

// Schema validation class
export class SchemaValidatorClass {
  private schema: SchemaValidator;
  private fieldValidators: Map<string, FieldValidatorClass> = new Map();

  constructor(schema: SchemaValidator) {
    this.schema = schema;
    this.buildFieldValidators();
  }

  private buildFieldValidators(): void {
    for (const [field, config] of Object.entries(this.schema)) {
      this.fieldValidators.set(field, new FieldValidatorClass(config));
    }
  }

  public validate(data: any, context?: ErrorContext): ValidationResult {
    const errors: ValidationResult['errors'] = [];

    for (const [field, validator] of this.fieldValidators) {
      const value = data?.[field];
      const sanitizedValue = validator.sanitize(value);

      // Update data with sanitized value
      if (data && value !== sanitizedValue) {
        data[field] = sanitizedValue;
      }

      const result = validator.validate(sanitizedValue, field);
      if (!result.isValid) {
        for (const errorMessage of result.errors) {
          errors.push({
            field,
            message: errorMessage,
            code: 'VALIDATION_ERROR',
            value: sanitizedValue,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public validateAndThrow(data: any, context?: ErrorContext): void {
    const result = this.validate(data, context);
    if (!result.isValid) {
      const firstError = result.errors[0];
      throw ErrorFactory.invalidValue(
        firstError.field,
        firstError.message,
        firstError.value,
        context
      );
    }
  }
}

// Convenience functions for common validation patterns
export const validate = {
  // Quick validation functions that throw on error
  string: (value: any, field: string, required: boolean = true, context?: ErrorContext): string => {
    if (required) assert.required(value, field, context);
    if (value !== undefined && value !== null) assert.type(value, 'string', field, context);
    return value;
  },

  number: (value: any, field: string, required: boolean = true, context?: ErrorContext): number => {
    if (required) assert.required(value, field, context);
    if (value !== undefined && value !== null) assert.number(value, field, context);
    return value;
  },

  integer: (
    value: any,
    field: string,
    required: boolean = true,
    context?: ErrorContext
  ): number => {
    if (required) assert.required(value, field, context);
    if (value !== undefined && value !== null) assert.integer(value, field, context);
    return value;
  },

  email: (value: any, field: string, required: boolean = true, context?: ErrorContext): string => {
    const email = validate.string(value, field, required, context);
    if (email && !validators.isEmail(email)) {
      throw ErrorFactory.invalidFormat(field, 'email', email, context);
    }
    return email;
  },

  url: (value: any, field: string, required: boolean = true, context?: ErrorContext): string => {
    const url = validate.string(value, field, required, context);
    if (url && !validators.isUrl(url)) {
      throw ErrorFactory.invalidFormat(field, 'URL', url, context);
    }
    return url;
  },

  uuid: (value: any, field: string, required: boolean = true, context?: ErrorContext): string => {
    const uuid = validate.string(value, field, required, context);
    if (uuid && !validators.isUuid(uuid)) {
      throw ErrorFactory.invalidFormat(field, 'UUID', uuid, context);
    }
    return uuid;
  },

  array: (value: any, field: string, required: boolean = true, context?: ErrorContext): any[] => {
    if (required) assert.required(value, field, context);
    if (value !== undefined && value !== null) assert.array(value, field, context);
    return value;
  },

  object: (value: any, field: string, required: boolean = true, context?: ErrorContext): object => {
    if (required) assert.required(value, field, context);
    if (value !== undefined && value !== null) assert.object(value, field, context);
    return value;
  },

  range: (
    value: any,
    field: string,
    min: number,
    max: number,
    required: boolean = true,
    context?: ErrorContext
  ): number => {
    const num = validate.number(value, field, required, context);
    if (num !== undefined && num !== null) assert.range(num, field, min, max, context);
    return num;
  },

  minLength: (
    value: any,
    field: string,
    minLength: number,
    required: boolean = true,
    context?: ErrorContext
  ): string => {
    const str = validate.string(value, field, required, context);
    if (str && str.length < minLength) {
      throw ErrorFactory.invalidLength(
        field,
        minLength,
        Number.MAX_SAFE_INTEGER,
        str.length,
        context
      );
    }
    return str;
  },

  maxLength: (
    value: any,
    field: string,
    maxLength: number,
    required: boolean = true,
    context?: ErrorContext
  ): string => {
    const str = validate.string(value, field, required, context);
    if (str && str.length > maxLength) {
      throw ErrorFactory.invalidLength(field, 0, maxLength, str.length, context);
    }
    return str;
  },
};

// Factory functions
export const createFieldValidator = (config: FieldValidator): FieldValidatorClass => {
  return new FieldValidatorClass(config);
};

export const createSchemaValidator = (schema: SchemaValidator): SchemaValidatorClass => {
  return new SchemaValidatorClass(schema);
};
