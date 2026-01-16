/**
 * PostgreSQL filter → SQL WHERE builder
 *
 * Supports a constrained subset of Mongo-like filters that can be represented
 * safely in parameterized SQL.
 *
 * Rationale:
 * - Many callers already pass simple equality filters (field → value).
 * - We intentionally support only a small operator subset to avoid creating an
 *   unsafe SQL DSL. Unsupported operators throw explicit errors.
 */

import { quoteSqlIdentifier } from './identifiers.js';
import type { PostgresResource } from './types.js';

type SqlFragment = {
  text: string;
  values: unknown[];
  nextParamIndex: number;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertAllowedColumn(resource: PostgresResource, column: string, context: string): string {
  if (!resource.allowedColumns.has(column)) {
    throw new Error(`${context}: column "${column}" is not allowlisted for table "${resource.tableName}"`);
  }
  return column;
}

function buildComparison(
  resource: PostgresResource,
  column: string,
  operator: string,
  operand: unknown,
  paramIndex: number
): SqlFragment {
  assertAllowedColumn(resource, column, 'Postgres filter'); // Enforce allowlist before using identifier.
  const col = quoteSqlIdentifier(column); // Quote to handle reserved words (e.g., "user") safely.

  // Equality semantics for null must use IS NULL/IS NOT NULL.
  if (operator === '$eq') {
    return operand === null
      ? { text: `${col} IS NULL`, values: [], nextParamIndex: paramIndex }
      : { text: `${col} = $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$ne') {
    return operand === null
      ? { text: `${col} IS NOT NULL`, values: [], nextParamIndex: paramIndex }
      : { text: `${col} <> $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$gt') {
    return { text: `${col} > $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$gte') {
    return { text: `${col} >= $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$lt') {
    return { text: `${col} < $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$lte') {
    return { text: `${col} <= $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$like') {
    return { text: `${col} LIKE $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$ilike') {
    return { text: `${col} ILIKE $${paramIndex}`, values: [operand], nextParamIndex: paramIndex + 1 };
  }
  if (operator === '$in') {
    if (!Array.isArray(operand)) {
      throw new Error('Postgres filter $in expects an array');
    }
    if (operand.length === 0) {
      return { text: 'FALSE', values: [], nextParamIndex: paramIndex }; // Empty IN should match nothing.
    }
    const placeholders = operand.map((_, i) => `$${paramIndex + i}`).join(', ');
    return {
      text: `${col} IN (${placeholders})`,
      values: operand,
      nextParamIndex: paramIndex + operand.length,
    };
  }
  if (operator === '$between') {
    if (!Array.isArray(operand) || operand.length !== 2) {
      throw new Error('Postgres filter $between expects a 2-element array');
    }
    return {
      text: `${col} BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
      values: [operand[0], operand[1]],
      nextParamIndex: paramIndex + 2,
    };
  }

  throw new Error(`Unsupported Postgres filter operator "${operator}"`);
}

function buildFieldCondition(
  resource: PostgresResource,
  column: string,
  condition: unknown,
  paramIndex: number
): SqlFragment {
  // Primitive values are treated as equality comparisons for ergonomics and parity with common Mongoose usage.
  if (!isPlainObject(condition) || Object.keys(condition).every(key => !key.startsWith('$'))) {
    return buildComparison(resource, column, '$eq', condition, paramIndex);
  }

  // Support a single operator object or multiple operators combined with AND.
  let textParts: string[] = [];
  let values: unknown[] = [];
  let next = paramIndex;

  for (const [op, operand] of Object.entries(condition)) {
    if (!op.startsWith('$')) {
      throw new Error(`Unsupported Postgres filter shape for column "${column}"`);
    }
    const fragment = buildComparison(resource, column, op, operand, next);
    textParts.push(fragment.text);
    values = values.concat(fragment.values);
    next = fragment.nextParamIndex;
  }

  return { text: textParts.length > 1 ? `(${textParts.join(' AND ')})` : textParts[0], values, nextParamIndex: next };
}

/**
 * Builds a parameterized WHERE clause.
 * @param resource PostgresResource providing table metadata and allowlist.
 * @param filter Filter object, supporting `$and`/`$or` plus limited operators.
 * @param startingParamIndex Placeholder index to start from (default 1).
 * @returns SQL fragment with text (including `WHERE` when needed) and values.
 */
export function buildWhereClause(
  resource: PostgresResource,
  filter: unknown,
  startingParamIndex: number = 1
): SqlFragment {
  if (filter === undefined || filter === null) {
    return { text: '', values: [], nextParamIndex: startingParamIndex };
  }
  if (!isPlainObject(filter)) {
    throw new Error('Postgres filter must be an object');
  }

  const parts: string[] = [];
  let values: unknown[] = [];
  let next = startingParamIndex;

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$and') {
      if (!Array.isArray(value)) throw new Error('Postgres $and must be an array of filter objects');
      const subParts: string[] = [];
      for (const sub of value) {
        const fragment = buildWhereClause(resource, sub, next);
        if (fragment.text) {
          subParts.push(fragment.text.replace(/^WHERE\s+/i, '')); // Normalize nested clauses.
          values = values.concat(fragment.values);
          next = fragment.nextParamIndex;
        }
      }
      if (subParts.length) parts.push(`(${subParts.join(' AND ')})`);
      continue;
    }

    if (key === '$or') {
      if (!Array.isArray(value)) throw new Error('Postgres $or must be an array of filter objects');
      const subParts: string[] = [];
      for (const sub of value) {
        const fragment = buildWhereClause(resource, sub, next);
        if (fragment.text) {
          subParts.push(fragment.text.replace(/^WHERE\s+/i, '')); // Normalize nested clauses.
          values = values.concat(fragment.values);
          next = fragment.nextParamIndex;
        }
      }
      if (subParts.length) parts.push(`(${subParts.join(' OR ')})`);
      continue;
    }

    if (key.startsWith('$')) {
      throw new Error(`Unsupported top-level Postgres filter operator "${key}"`);
    }

    const column = assertAllowedColumn(resource, key, 'Postgres filter'); // Allowlist enforcement for identifiers.
    const fragment = buildFieldCondition(resource, column, value, next);
    parts.push(fragment.text);
    values = values.concat(fragment.values);
    next = fragment.nextParamIndex;
  }

  if (!parts.length) {
    return { text: '', values: [], nextParamIndex: next };
  }

  return { text: `WHERE ${parts.join(' AND ')}`, values, nextParamIndex: next };
}

/**
 * Builds a parameterized ORDER BY clause.
 * @param resource PostgresResource providing allowlisted columns.
 * @param sort Sort map (column → 1|-1) for parity with Mongo sort semantics.
 * @returns ORDER BY clause or empty string.
 */
export function buildOrderByClause(
  resource: PostgresResource,
  sort: Record<string, 1 | -1> | undefined | null
): string {
  if (!sort) return '';

  const parts: string[] = [];
  for (const [column, direction] of Object.entries(sort)) {
    assertAllowedColumn(resource, column, 'Postgres sort'); // Prevent ORDER BY injection.
    const dir = direction === -1 ? 'DESC' : 'ASC';
    parts.push(`${quoteSqlIdentifier(column)} ${dir}`);
  }
  return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
}

/**
 * Builds a SELECT column list.
 * @param resource PostgresResource providing allowlisted columns.
 * @param select Optional list of columns. When omitted, uses `*` for parity.
 * @returns SQL column list string.
 */
export function buildSelectClause(resource: PostgresResource, select?: string[] | string): string {
  if (!select) return '*';

  const columns = Array.isArray(select)
    ? select
    : select
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);

  if (!columns.length) return '*';

  const parts: string[] = [];
  for (const column of columns) {
    assertAllowedColumn(resource, column, 'Postgres select'); // Prevent identifier injection in SELECT.
    parts.push(quoteSqlIdentifier(column));
  }
  return parts.join(', ');
}

