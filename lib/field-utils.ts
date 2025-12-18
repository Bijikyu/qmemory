import { snakeCase, camelCase, kebabCase, pascalCase } from 'change-case';
// @ts-ignore - No types available for pluralize
import pluralize from 'pluralize';

const normalizeFieldName = (paramName: string): string => {
  if (typeof paramName !== 'string' || !paramName.trim()) throw new Error('Parameter name must be a non-empty string');
  return snakeCase(paramName);
};

const getCollectionName = (functionName: string): string => {
  if (typeof functionName !== 'string' || !functionName.trim()) throw new Error('Function name must be a non-empty string');
  const snakeCaseName = snakeCase(functionName);
  const words = snakeCaseName.split('_');
  const mainWord = words[words.length - 1];
  const pluralMainWord = pluralize(mainWord);
  words[words.length - 1] = pluralMainWord;
  return words.join('_');
};

const denormalizeFieldName = (snakeCaseName: string): string => {
  if (typeof snakeCaseName !== 'string' || !snakeCaseName.trim()) throw new Error('Snake case name must be a non-empty string');
  return camelCase(snakeCaseName);
};

const toParamCase = (str: string): string => {
  if (typeof str !== 'string' || !str.trim()) throw new Error('Input must be a non-empty string');
  return kebabCase(str);
};

const toPascalCase = (str: string): string => {
  if (typeof str !== 'string' || !str.trim()) throw new Error('Input must be a non-empty string');
  return pascalCase(str);
};

const pluralizeWord = (word: string, count?: number): string => {
  if (typeof word !== 'string' || !word.trim()) throw new Error('Word must be a non-empty string');
  return pluralize(word, count);
};

const singularizeWord = (word: string): string => {
  if (typeof word !== 'string' || !word.trim()) throw new Error('Word must be a non-empty string');
  return pluralize.singular(word);
};

type NestedObject = {
  [key: string]: any;
};

const normalizeObjectFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const normalized: NestedObject = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalizeFieldName(key);
    normalized[normalizedKey] = typeof value === 'object' && value !== null && !Array.isArray(value) ? normalizeObjectFields(value) : value;
  }
  return normalized;
};

const denormalizeObjectFields = (obj: any): any => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const denormalized: NestedObject = {};
  for (const [key, value] of Object.entries(obj)) {
    const denormalizedKey = denormalizeFieldName(key);
    denormalized[denormalizedKey] = typeof value === 'object' && value !== null && !Array.isArray(value) ? denormalizeObjectFields(value) : value;
  }
  return denormalized;
};

export { normalizeFieldName, getCollectionName, denormalizeFieldName, toParamCase, toPascalCase, pluralizeWord, singularizeWord, normalizeObjectFields, denormalizeObjectFields };

export type {
  NestedObject
};