const { snakeCase, camelCase, kebabCase, pascalCase } = require('change-case');
const pluralize = require('pluralize');

const normalizeFieldName = (paramName) => {
  if (typeof paramName !== 'string' || !paramName.trim()) throw new Error('Parameter name must be a non-empty string');
  return snakeCase(paramName);
};

const getCollectionName = (functionName) => {
  if (typeof functionName !== 'string' || !functionName.trim()) throw new Error('Function name must be a non-empty string');
  const snakeCaseName = snakeCase(functionName);
  const words = snakeCaseName.split('_');
  const mainWord = words[words.length - 1];
  const pluralMainWord = pluralize(mainWord);
  words[words.length - 1] = pluralMainWord;
  return words.join('_');
};

const denormalizeFieldName = (snakeCaseName) => {
  if (typeof snakeCaseName !== 'string' || !snakeCaseName.trim()) throw new Error('Snake case name must be a non-empty string');
  return camelCase(snakeCaseName);
};

const toParamCase = (str) => {
  if (typeof str !== 'string' || !str.trim()) throw new Error('Input must be a non-empty string');
  return kebabCase(str);
};

const toPascalCase = (str) => {
  if (typeof str !== 'string' || !str.trim()) throw new Error('Input must be a non-empty string');
  return pascalCase(str);
};

const pluralizeWord = (word, count) => {
  if (typeof word !== 'string' || !word.trim()) throw new Error('Word must be a non-empty string');
  return pluralize(word, count);
};

const singularizeWord = (word) => {
  if (typeof word !== 'string' || !word.trim()) throw new Error('Word must be a non-empty string');
  return pluralize.singular(word);
};

const normalizeObjectFields = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const normalized = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalizeFieldName(key);
    normalized[normalizedKey] = typeof value === 'object' && value !== null && !Array.isArray(value) ? normalizeObjectFields(value) : value;
  }
  return normalized;
};

const denormalizeObjectFields = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const denormalized = {};
  for (const [key, value] of Object.entries(obj)) {
    const denormalizedKey = denormalizeFieldName(key);
    denormalized[denormalizedKey] = typeof value === 'object' && value !== null && !Array.isArray(value) ? denormalizeObjectFields(value) : value;
  }
  return denormalized;
};

module.exports = { normalizeFieldName, getCollectionName, denormalizeFieldName, toParamCase, toPascalCase, pluralizeWord, singularizeWord, normalizeObjectFields, denormalizeObjectFields };