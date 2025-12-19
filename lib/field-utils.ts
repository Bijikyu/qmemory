import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
import pluralize from 'pluralize';

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  // We explicitly guard against arrays so we only reshape dictionary-like objects.
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Convert a raw field name into snake_case for storage consistency.
 * @param paramName - Incoming field identifier provided by the caller.
 * @returns Snake case representation that matches database field conventions.
 * @throws {Error} When the supplied parameter name is empty or not a string.
 */
export function normalizeFieldName(paramName: string): string {
  // Guard clause keeps change-case from mutating invalid inputs and surfaces misuse early.
  if (typeof paramName !== 'string' || !paramName.trim()) {
    throw new Error('Parameter name must be a non-empty string');
  }

  // change-case handles edge cases like acronyms, ensuring accurate normalization.
  return snakeCase(paramName);
}

/**
 * Derive a collection name based on a function name by pluralizing the terminal word.
 * @param functionName - Function identifier that describes the collection intent.
 * @returns Snake case collection name with the final word pluralized.
 * @throws {Error} When the supplied function name is empty or not a string.
 */
export function getCollectionName(functionName: string): string {
  // Validation protects downstream logic from operating on meaningless identifiers.
  if (typeof functionName !== 'string' || !functionName.trim()) {
    throw new Error('Function name must be a non-empty string');
  }

  // We split the snake_case tokens to target only the last component for pluralization.
  const snakeCaseName = snakeCase(functionName);
  const words = snakeCaseName.split('_');
  const mainWord = words[words.length - 1];
  const pluralMainWord = pluralize(mainWord);
  words[words.length - 1] = pluralMainWord;

  // Joining keeps previously normalized prefixes intact while updating only the suffix.
  return words.join('_');
}

/**
 * Transform a snake_case name back into camelCase for API usage.
 * @param snakeCaseName - Field identifier stored in snake_case.
 * @returns Camel case representation appropriate for JavaScript contexts.
 * @throws {Error} When the supplied snakeCaseName is empty or not a string.
 */
export function denormalizeFieldName(snakeCaseName: string): string {
  // Input validation avoids producing empty strings that would break consumer code.
  if (typeof snakeCaseName !== 'string' || !snakeCaseName.trim()) {
    throw new Error('Snake case name must be a non-empty string');
  }

  // change-case camelCase handles underscores and consecutive separators gracefully.
  return camelCase(snakeCaseName);
}

/**
 * Convert a string to kebab-case for route or filename generation.
 * @param value - Raw string supplied by higher-level utilities.
 * @returns Kebab case representation of the provided value.
 * @throws {Error} When the supplied value is empty or not a string.
 */
export function toParamCase(value: string): string {
  // Enforce non-empty string input to keep downstream path generation deterministic.
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Input must be a non-empty string');
  }

  // kebabCase matches HTTP parameter formatting expectations.
  return kebabCase(value);
}

/**
 * Convert a string to PascalCase for constructor or class generation.
 * @param value - Raw string that should become PascalCase.
 * @returns PascalCase version of the provided value.
 * @throws {Error} When the supplied value is empty or not a string.
 */
export function toPascalCase(value: string): string {
  // Guard clause keeps consumers from accidentally generating invalid class identifiers.
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Input must be a non-empty string');
  }

  // pascalCase capitalizes each segment to align with constructor naming conventions.
  return pascalCase(value);
}

/**
 * Pluralize a word optionally considering the supplied count.
 * @param word - Singular word that should be pluralized when appropriate.
 * @param count - Optional quantity that influences pluralization rules.
 * @returns Pluralized word or singular when the count dictates.
 * @throws {Error} When the supplied word is empty or not a string.
 */
export function pluralizeWord(word: string, count?: number): string {
  // Input validation avoids surprising outputs like pluralizing undefined values.
  if (typeof word !== 'string' || !word.trim()) {
    throw new Error('Word must be a non-empty string');
  }

  // The pluralize library applies language-aware transformations, handling irregular cases.
  return pluralize(word, count);
}

/**
 * Convert a word to its singular form.
 * @param word - Word expected to be in plural form.
 * @returns Singular version of the provided word.
 * @throws {Error} When the supplied word is empty or not a string.
 */
export function singularizeWord(word: string): string {
  // Strict validation matches pluralizeWord to keep API behavior symmetric.
  if (typeof word !== 'string' || !word.trim()) {
    throw new Error('Word must be a non-empty string');
  }

  // pluralize exposes a singular helper that properly handles irregular forms.
  return pluralize.singular(word);
}

export function normalizeObjectFields(obj: PlainObject): PlainObject;
export function normalizeObjectFields<T>(obj: T): T;
/**
 * Recursively convert all object keys to snake_case while preserving values.
 * @param obj - Object whose keys should be normalized.
 * @returns New object with snake_case keys or the original value when normalization is not applicable.
 */
export function normalizeObjectFields(obj: unknown): unknown {
  // Non-plain objects, arrays, and primitives pass through untouched to avoid unwanted mutations.
  if (!isPlainObject(obj)) {
    return obj;
  }

  const normalized: PlainObject = {};

  for (const [key, value] of Object.entries(obj)) {
    // Each key is normalized to snake_case to maintain storage conventions.
    const normalizedKey = normalizeFieldName(key);
    // Recursively normalize nested plain objects while leaving primitives and arrays intact.
    normalized[normalizedKey] = isPlainObject(value) ? normalizeObjectFields(value) : value;
  }

  // We return a new object to keep the original reference immutable for callers.
  return normalized;
}

export function denormalizeObjectFields(obj: PlainObject): PlainObject;
export function denormalizeObjectFields<T>(obj: T): T;
/**
 * Recursively convert snake_case keys back to camelCase for JavaScript consumption.
 * @param obj - Object whose keys should be denormalized.
 * @returns New object with camelCase keys or the original value when denormalization is not applicable.
 */
export function denormalizeObjectFields(obj: unknown): unknown {
  // Primitives, arrays, and non-plain objects are left untouched to respect caller intent.
  if (!isPlainObject(obj)) {
    return obj;
  }

  const denormalized: PlainObject = {};

  for (const [key, value] of Object.entries(obj)) {
    // Convert each key to camelCase to match JavaScript naming idioms.
    const denormalizedKey = denormalizeFieldName(key);
    // Recursively denormalize nested objects to keep the entire graph consistent.
    denormalized[denormalizedKey] = isPlainObject(value) ? denormalizeObjectFields(value) : value;
  }

  // Returning a fresh object avoids unexpected side effects in calling code.
  return denormalized;
}
