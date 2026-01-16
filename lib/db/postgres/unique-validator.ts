/**
 * PostgreSQL unique validation utilities
 *
 * Postgres equivalents of `lib/unique-validator.ts`, implemented with:
 * - Parameterized queries for values
 * - Allowlisted identifier checks for columns
 *
 * Notes:
 * - Postgres duplicate error code: SQLSTATE `23505` (unique_violation)
 * - We intentionally do not attempt to parse constraint definitions into field
 *   names by default because schemas vary; callers can pass explicit field names.
 */

import type { Request, Response, NextFunction } from 'express';
import qerrors from 'qerrors';
import { getTimestamp, safeOperation } from '../../common-patterns.js';
import { escapeRegex, validateFieldName } from '../../unique-validator.js';
import { isPostgresError } from './errors.js';
import { quoteSqlIdentifier } from './identifiers.js';
import type { PostgresResource } from './types.js';

type DocumentShape = Record<string, unknown>;
type MaybeId = string | number;

/**
 * Duplicate error interface (parity with existing unique-validator exports).
 */
export interface DuplicateError extends Error {
  code: 'DUPLICATE' | '23505';
  status: number;
  field: string | undefined;
  value: unknown;
  existingId?: unknown;
  isDuplicate?: boolean;
  originalError?: Error;
}

export interface MiddlewareOptions {
  source?: 'body' | 'params' | 'query';
  idParam?: string;
}

export interface BatchCheckResults<TValue> {
  unique: TValue[];
  duplicates: Array<{ value: TValue; existingId: unknown }>;
}

export interface BatchUniqueChecker<TValue> {
  checkMany: (values: TValue[]) => Promise<BatchCheckResults<TValue>>;
  filterUnique: (values: TValue[]) => Promise<TValue[]>;
}

/**
 * Unique validator interface for a Postgres-backed resource.
 */
export interface UniqueValidator<TDoc extends DocumentShape> {
  validateCreate: (
    data: Partial<TDoc>,
    fieldsToCheck?: Array<keyof TDoc & string>
  ) => Promise<void>;
  validateUpdate: (
    id: MaybeId,
    updateData: Partial<TDoc>,
    fieldsToCheck?: Array<keyof TDoc & string>
  ) => Promise<void>;
  isUnique: (
    fieldName: keyof TDoc & string,
    fieldValue: TDoc[keyof TDoc & string],
    excludeId?: MaybeId | null
  ) => Promise<boolean>;
  findExisting: (
    fieldName: keyof TDoc & string,
    fieldValue: TDoc[keyof TDoc & string]
  ) => Promise<Record<string, unknown> | null>;
}

/**
 * Checks for an existing record with the same field value.
 * @param resource PostgresResource describing the target table.
 * @param fieldName Allowlisted column name.
 * @param fieldValue Value to check.
 * @param excludeId Optional id to exclude (for updates).
 * @param resourceType Used for error messaging/logging.
 * @returns Existing row (id only) or null.
 */
export async function checkDuplicateByFieldPostgres<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(
  resource: PostgresResource,
  fieldName: TField,
  fieldValue: TDoc[TField],
  excludeId: MaybeId | null = null,
  resourceType: string = 'resource'
): Promise<Record<string, unknown> | null> {
  return safeOperation(
    async () => {
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return null;
      }

      validateFieldName(fieldName, new Set(resource.allowedColumns)); // Reuse shared allowlist validator for consistent errors.

      const idCol = quoteSqlIdentifier(resource.idColumn);
      const table = quoteSqlIdentifier(resource.tableName);
      const col = quoteSqlIdentifier(fieldName);

      const values: unknown[] = [];
      let sql = `SELECT ${idCol} AS id FROM ${table} WHERE `;

      if (typeof fieldValue === 'string') {
        sql += `LOWER(${col}) = LOWER($1)`;
        values.push(fieldValue);
      } else {
        sql += `${col} = $1`;
        values.push(fieldValue);
      }

      if (excludeId !== null && excludeId !== undefined) {
        sql += ` AND ${idCol} <> $2`;
        values.push(excludeId);
      }

      sql += ' LIMIT 1';

      const result = await resource.pool.query(sql, values);
      return result.rows?.[0] ?? null;
    },
    'checkDuplicateByFieldPostgres',
    'unique-validator-postgres',
    {
      tableName: resource.tableName,
      fieldName,
      resourceType,
      hasExcludeId: excludeId !== null,
      operation: 'duplicate-check',
    }
  );
}

/**
 * Validates uniqueness and throws a DuplicateError when a conflict exists.
 */
export async function validateUniqueFieldPostgres<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(
  resource: PostgresResource,
  fieldName: TField,
  fieldValue: TDoc[TField],
  excludeId: MaybeId | null = null,
  resourceType: string = 'resource'
): Promise<void> {
  return safeOperation(
    async () => {
      const existing = await checkDuplicateByFieldPostgres(
        resource,
        fieldName,
        fieldValue,
        excludeId,
        resourceType
      );

      if (existing) {
        const duplicateError = new Error(
          `A ${resourceType} with this ${String(fieldName)} already exists`
        ) as DuplicateError;
        duplicateError.code = 'DUPLICATE';
        duplicateError.status = 409;
        duplicateError.field = String(fieldName);
        duplicateError.value = fieldValue;
        duplicateError.existingId = (existing as Record<string, unknown>).id;
        duplicateError.isDuplicate = true;
        throw duplicateError;
      }
    },
    'validateUniqueFieldPostgres',
    'unique-validator-postgres',
    {
      tableName: resource.tableName,
      fieldName,
      resourceType,
      hasExcludeId: excludeId !== null,
      operation: 'unique-validation',
    }
  );
}

type FieldValueMap<TDoc extends DocumentShape> = Partial<
  Record<keyof TDoc & string, TDoc[keyof TDoc & string]>
>;

/**
 * Validates uniqueness for multiple fields (sequentially to preserve clear error messages).
 */
export async function validateUniqueFieldsPostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  fieldValueMap: FieldValueMap<TDoc>,
  excludeId: MaybeId | null = null,
  resourceType: string = 'resource'
): Promise<void> {
  return safeOperation(
    async () => {
      for (const [fieldName, fieldValue] of Object.entries(fieldValueMap)) {
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          await validateUniqueFieldPostgres(
            resource,
            fieldName as keyof TDoc & string,
            fieldValue as TDoc[keyof TDoc & string],
            excludeId,
            resourceType
          );
        }
      }
    },
    'validateUniqueFieldsPostgres',
    'unique-validator-postgres',
    {
      tableName: resource.tableName,
      resourceType,
      fieldCount: Object.keys(fieldValueMap).length,
      hasExcludeId: excludeId !== null,
      operation: 'multi-field-unique-validation',
    }
  );
}

/**
 * Creates a reusable unique validator for a Postgres-backed resource.
 */
export function createUniqueValidatorPostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  resourceType: string = 'resource'
): UniqueValidator<TDoc> {
  return {
    async validateCreate(
      data: Partial<TDoc>,
      fieldsToCheck?: Array<keyof TDoc & string>
    ): Promise<void> {
      const fieldValueMap: FieldValueMap<TDoc> = {};

      for (const [field, value] of Object.entries(data ?? {})) {
        if (fieldsToCheck && !fieldsToCheck.includes(field as keyof TDoc & string)) continue;
        if (value !== undefined && value !== null && value !== '') {
          fieldValueMap[field as keyof TDoc & string] = value as TDoc[keyof TDoc & string];
        }
      }

      if (Object.keys(fieldValueMap).length === 0) return;
      await validateUniqueFieldsPostgres(resource, fieldValueMap, null, resourceType);
    },

    async validateUpdate(
      id: MaybeId,
      updateData: Partial<TDoc>,
      fieldsToCheck?: Array<keyof TDoc & string>
    ): Promise<void> {
      const fieldValueMap: FieldValueMap<TDoc> = {};

      for (const [field, value] of Object.entries(updateData ?? {})) {
        if (fieldsToCheck && !fieldsToCheck.includes(field as keyof TDoc & string)) continue;
        if (value !== undefined && value !== null && value !== '') {
          fieldValueMap[field as keyof TDoc & string] = value as TDoc[keyof TDoc & string];
        }
      }

      if (Object.keys(fieldValueMap).length === 0) return;
      await validateUniqueFieldsPostgres(resource, fieldValueMap, id, resourceType);
    },

    async isUnique(
      fieldName: keyof TDoc & string,
      fieldValue: TDoc[keyof TDoc & string],
      excludeId: MaybeId | null = null
    ): Promise<boolean> {
      const existing = await checkDuplicateByFieldPostgres(
        resource,
        fieldName,
        fieldValue,
        excludeId,
        resourceType
      );
      return existing === null;
    },

    async findExisting(
      fieldName: keyof TDoc & string,
      fieldValue: TDoc[keyof TDoc & string]
    ): Promise<Record<string, unknown> | null> {
      return checkDuplicateByFieldPostgres(resource, fieldName, fieldValue, null, resourceType);
    },
  };
}

/**
 * Converts Postgres unique violations (23505) into DuplicateError objects.
 */
export function handleDuplicateKeyErrorPostgres(
  error: unknown,
  resourceType: string = 'resource'
): Error {
  if (isPostgresError(error) && error.code === '23505') {
    const duplicateError = new Error(`Duplicate ${resourceType} detected`) as DuplicateError;
    duplicateError.code = '23505';
    duplicateError.status = 409;
    duplicateError.field = undefined;
    duplicateError.value = undefined;
    duplicateError.isDuplicate = true;
    duplicateError.originalError = error as Error;
    return duplicateError;
  }

  return error as Error;
}

/**
 * Wrap a function to handle Postgres duplicate key errors.
 */
export function withDuplicateKeyHandlingPostgres<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  resourceType: string = 'resource'
): (...args: TArgs) => Promise<TResult> {
  return async function withDuplicateHandling(this: unknown, ...args: TArgs): Promise<TResult> {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      qerrors.qerrors(error as Error, 'unique-validator-postgres.withDuplicateKeyHandling', {
        resourceType,
        argCount: args.length,
        functionName: fn.name || 'anonymous',
        operation: 'duplicate-key-wrapper',
      });
      throw handleDuplicateKeyErrorPostgres(error, resourceType);
    }
  };
}

/**
 * Check if an error is a duplicate error (Postgres or library-generated).
 */
export function isDuplicateErrorPostgres(error: unknown): error is DuplicateError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<DuplicateError> & { code?: unknown };
  return candidate.code === 'DUPLICATE' || candidate.code === '23505' || candidate.isDuplicate === true;
}

/**
 * Middleware to validate one unique field for Postgres-backed resources.
 */
export function createUniqueFieldMiddlewarePostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  fieldName: keyof TDoc & string,
  resourceType: string,
  options: MiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { source = 'body', idParam = 'id' } = options;

  return async function uniqueFieldMiddlewarePostgres(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      validateFieldName(fieldName, new Set(resource.allowedColumns)); // Enforce allowlist before using fieldName as an identifier.
      const payload = (req as unknown as Record<string, Record<string, unknown>>)[source];
      const fieldValue = payload?.[fieldName];

      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return next();
      }

      const excludeId = (req.params?.[idParam] ?? null) as MaybeId | null;

      if (excludeId) {
        // If updating and the value hasn't changed, skip uniqueness validation.
        const row = await resource.pool.query(
          `SELECT ${quoteSqlIdentifier(fieldName)} AS value FROM ${quoteSqlIdentifier(
            resource.tableName
          )} WHERE ${quoteSqlIdentifier(resource.idColumn)} = $1 LIMIT 1`,
          [excludeId]
        );
        const existingValue = (row.rows?.[0] as Record<string, unknown> | undefined)?.value;
        if (existingValue !== undefined && existingValue === fieldValue) {
          return next();
        }
      }

      await validateUniqueFieldPostgres(
        resource,
        fieldName,
        fieldValue as TDoc[typeof fieldName],
        excludeId,
        resourceType
      );
      next();
    } catch (error) {
      const err = error as Partial<DuplicateError>;
      if (err.status === 409) {
        res.status(409).json({
          success: false,
          error: err.message,
          code: err.code,
          field: err.field,
          value: err.value,
          timestamp: getTimestamp(),
        });
        return;
      }
      next(error as Error);
    }
  };
}

/**
 * Middleware to validate multiple unique fields for Postgres-backed resources.
 */
export function createUniqueFieldsMiddlewarePostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  fieldNames: Array<keyof TDoc & string>,
  resourceType: string,
  options: MiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { source = 'body', idParam = 'id' } = options;

  return async function uniqueFieldsMiddlewarePostgres(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = (req as unknown as Record<string, Record<string, unknown>>)[source];
      const fieldValueMap: FieldValueMap<TDoc> = {};

      for (const fieldName of fieldNames) {
        validateFieldName(fieldName, new Set(resource.allowedColumns)); // Enforce allowlist for each declared field.
        const value = payload?.[fieldName];
        if (value !== undefined && value !== null && value !== '') {
          fieldValueMap[fieldName] = value as TDoc[keyof TDoc & string];
        }
      }

      if (Object.keys(fieldValueMap).length === 0) {
        return next();
      }

      const excludeId = (req.params?.[idParam] ?? null) as MaybeId | null;

      await validateUniqueFieldsPostgres(resource, fieldValueMap, excludeId, resourceType);
      next();
    } catch (error) {
      const err = error as Partial<DuplicateError>;
      if (err.status === 409) {
        res.status(409).json({
          success: false,
          error: err.message,
          code: err.code,
          field: err.field,
          value: err.value,
          timestamp: getTimestamp(),
        });
        return;
      }
      next(error as Error);
    }
  };
}

/**
 * Batch uniqueness checker for Postgres-backed resources.
 */
export function createBatchUniqueCheckerPostgres<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(
  resource: PostgresResource,
  fieldName: TField,
  resourceType: string = 'resource'
): BatchUniqueChecker<TDoc[TField]> {
  return {
    async checkMany(values: Array<TDoc[TField]>): Promise<BatchCheckResults<TDoc[TField]>> {
      return safeOperation(
        async () => {
          const results: BatchCheckResults<TDoc[TField]> = { unique: [], duplicates: [] };

          for (const value of values) {
            const existing = await checkDuplicateByFieldPostgres(
              resource,
              fieldName,
              value,
              null,
              resourceType
            );
            if (existing) {
              results.duplicates.push({ value, existingId: (existing as Record<string, unknown>).id });
            } else {
              results.unique.push(value);
            }
          }

          return results;
        },
        'createBatchUniqueCheckerPostgres.checkMany',
        'unique-validator-postgres',
        {
          tableName: resource.tableName,
          fieldName,
          resourceType,
          valueCount: values.length,
          operation: 'batch-duplicate-check',
        }
      );
    },

    async filterUnique(values: Array<TDoc[TField]>): Promise<Array<TDoc[TField]>> {
      return safeOperation(
        async () => {
          const results = await this.checkMany(values);
          return results.unique;
        },
        'createBatchUniqueCheckerPostgres.filterUnique',
        'unique-validator-postgres',
        {
          tableName: resource.tableName,
          fieldName,
          resourceType,
          valueCount: values.length,
          operation: 'batch-filter-unique',
        }
      );
    },
  };
}
