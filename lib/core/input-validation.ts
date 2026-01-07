/**
 * Secure Input Validation Utilities
 *
 * Provides strict input validation to prevent injection attacks
 * and ensure data integrity across the application.
 */

/**
 * Validates and parses integer input from request parameters
 * Prevents numeric injection attacks by strict validation
 *
 * @param input - Raw input string from request parameters
 * @param fieldName - Name of the field for error messages (optional)
 * @returns Validated integer
 * @throws Error if input is invalid
 */
export const validateIntegerInput = (input: string | undefined, fieldName?: string): number => {
  const field = fieldName || 'parameter';

  // Check for undefined/null
  if (input === undefined || input === null) {
    throw new Error(`${field} is required and must be a numeric string`);
  }

  // Convert to string and trim
  const inputStr = String(input).trim();

  // Check for empty string
  if (inputStr === '') {
    throw new Error(`${field} cannot be empty and must be a numeric string`);
  }

  // Strict numeric validation - only allow digits
  if (!/^\d+$/.test(inputStr)) {
    throw new Error(`${field} must contain only digits (0-9), received: "${inputStr}"`);
  }

  // Parse with explicit base 10 to prevent octal/hex parsing
  const parsedValue = parseInt(inputStr, 10);

  // Validate parsing result
  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${field} failed to parse as valid integer: "${inputStr}"`);
  }

  // Check for reasonable range to prevent overflow attacks
  if (parsedValue < 0) {
    throw new Error(`${field} must be non-negative, received: ${parsedValue}`);
  }

  // Prevent extremely large numbers that could cause issues
  if (parsedValue > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${field} is too large, maximum allowed is ${Number.MAX_SAFE_INTEGER}`);
  }

  // Ensure the parsed result matches the original string (prevents parseInt("123abc") -> 123)
  if (parsedValue.toString() !== inputStr) {
    throw new Error(`${field} contains invalid numeric format: "${inputStr}"`);
  }

  return parsedValue;
};

/**
 * Validates and parses potentially negative integer input
 *
 * @param input - Raw input string from request parameters
 * @param fieldName - Name of the field for error messages (optional)
 * @returns Validated integer (can be negative)
 * @throws Error if input is invalid
 */
export const validateSignedIntegerInput = (
  input: string | undefined,
  fieldName?: string
): number => {
  const field = fieldName || 'parameter';

  // Check for undefined/null
  if (input === undefined || input === null) {
    throw new Error(`${field} is required and must be a numeric string`);
  }

  // Convert to string and trim
  const inputStr = String(input).trim();

  // Check for empty string
  if (inputStr === '') {
    throw new Error(`${field} cannot be empty and must be a numeric string`);
  }

  // Strict numeric validation - allow optional leading minus sign followed by digits
  if (!/^-?\d+$/.test(inputStr)) {
    throw new Error(
      `${field} must contain only digits with optional leading minus sign, received: "${inputStr}"`
    );
  }

  // Parse with explicit base 10 to prevent octal/hex parsing
  const parsedValue = parseInt(inputStr, 10);

  // Validate parsing result
  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${field} failed to parse as valid integer: "${inputStr}"`);
  }

  // Prevent extremely large numbers that could cause issues
  if (Math.abs(parsedValue) > Number.MAX_SAFE_INTEGER) {
    throw new Error(
      `${field} is too large, maximum allowed absolute value is ${Number.MAX_SAFE_INTEGER}`
    );
  }

  // Ensure the parsed result matches the original string (prevents parseInt("123abc") -> 123)
  if (parsedValue.toString() !== inputStr) {
    throw new Error(`${field} contains invalid numeric format: "${inputStr}"`);
  }

  return parsedValue;
};

/**
 * Validates that an input string contains only safe characters
 * Prevents XSS and injection attacks
 *
 * @param input - Raw input string
 * @param fieldName - Name of the field for error messages (optional)
 * @returns Sanitized string
 * @throws Error if input is invalid
 */
export const validateStringInput = (input: string | undefined, fieldName?: string): string => {
  const field = fieldName || 'parameter';

  // Check for undefined/null
  if (input === undefined || input === null) {
    throw new Error(`${field} is required and must be a string`);
  }

  // Convert to string and trim
  const inputStr = String(input).trim();

  // Check for empty string (allow if that's valid for the field)
  if (inputStr === '') {
    throw new Error(`${field} cannot be empty`);
  }

  // Allow only alphanumeric, spaces, and common safe punctuation
  // Prevents XSS, command injection, and other attacks
  const safePattern = /^[a-zA-Z0-9\s\-_.,@()[\]{}]+$/;
  if (!safePattern.test(inputStr)) {
    throw new Error(`${field} contains unsafe characters: "${inputStr}"`);
  }

  // Length validation to prevent buffer overflow attacks
  if (inputStr.length > 1000) {
    throw new Error(`${field} is too long (maximum 1000 characters)`);
  }

  return inputStr;
};

/**
 * Validates that an input string is a valid identifier (username, ID, etc.)
 * More restrictive than general string validation
 *
 * @param input - Raw input string
 * @param fieldName - Name of the field for error messages (optional)
 * @returns Sanitized identifier string
 * @throws Error if input is invalid
 */
export const validateIdentifierInput = (input: string | undefined, fieldName?: string): string => {
  const field = fieldName || 'parameter';

  // Check for undefined/null
  if (input === undefined || input === null) {
    throw new Error(`${field} is required and must be a valid identifier`);
  }

  // Convert to string and trim
  const inputStr = String(input).trim();

  // Check for empty string
  if (inputStr === '') {
    throw new Error(`${field} cannot be empty`);
  }

  // Strict identifier validation - only alphanumeric, underscore, and hyphen
  const identifierPattern = /^[a-zA-Z0-9_-]+$/;
  if (!identifierPattern.test(inputStr)) {
    throw new Error(
      `${field} must contain only letters, numbers, underscores, and hyphens: "${inputStr}"`
    );
  }

  // Length validation for identifiers
  if (inputStr.length < 1 || inputStr.length > 50) {
    throw new Error(`${field} must be between 1 and 50 characters long: "${inputStr}"`);
  }

  return inputStr;
};
