/**
 * Unique Validation Utility
 * Provides standardized unique field validation across all MongoDB services.
 *
 * Features:
 * - Case-insensitive uniqueness checking
 * - Support for create and update operations (with ID exclusion)
 * - Multi-field validation
 * - MongoDB duplicate key error handling (code 11000)
 * - Express middleware for route-level validation
 *
 * Use cases:
 * - Mongoose applications with unique constraints
 * - MongoDB-based APIs
 * - Microservices with unique field requirements
 * - Data validation systems
 */

import type { FilterQuery, Model, Types } from 'mongoose';

// LeanDocument type alias for compatibility
type LeanDocument<T> = T;
import type { MongoServerError } from 'mongodb';
import type { Request, Response, NextFunction } from 'express';
import * as qerrors from 'qerrors';

type DocumentShape = Record<string, unknown>;
type MaybeObjectId = Types.ObjectId | string;

/**
 * Duplicate error interface.
 */
export interface DuplicateError extends Error {
  code: 'DUPLICATE' | 11000;
  status: number;
  field: string | undefined;
  value: unknown;
  existingId?: unknown;
  isDuplicate?: boolean;
  originalError?: Error;
}

/**
 * Middleware options interface.
 */
export interface MiddlewareOptions {
  source?: 'body' | 'params' | 'query';
  idParam?: string;
}

/**
 * Batched checker results interface.
 */
export interface BatchCheckResults<TValue> {
  unique: TValue[];
  duplicates: Array<{ value: TValue; existingId: unknown }>;
}

/**
 * Unique validator interface for a resource type.
 */
export interface UniqueValidator<TDoc extends DocumentShape> {
  validateCreate: (
    data: Partial<TDoc>,
    fieldsToCheck?: Array<keyof TDoc & string>
  ) => Promise<void>;
  validateUpdate: (
    id: MaybeObjectId,
    updateData: Partial<TDoc>,
    fieldsToCheck?: Array<keyof TDoc & string>
  ) => Promise<void>;
  isUnique: (
    fieldName: keyof TDoc & string,
    fieldValue: TDoc[keyof TDoc & string],
    excludeId?: MaybeObjectId | null
  ) => Promise<boolean>;
  findExisting: (
    fieldName: keyof TDoc & string,
    fieldValue: TDoc[keyof TDoc & string]
  ) => Promise<LeanDocument<TDoc> | null>;
}

/**
 * Batch unique checker interface.
 */
export interface BatchUniqueChecker<TValue> {
  checkMany: (values: TValue[]) => Promise<BatchCheckResults<TValue>>;
  filterUnique: (values: TValue[]) => Promise<TValue[]>;
}

/**
 * Escape regex special characters.
 */
export function escapeRegex(value: string): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a field value is unique in a model.
 */
export async function checkDuplicateByField<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(
  Model: Model<TDoc>,
  fieldName: TField,
  fieldValue: TDoc[TField],
  excludeId: MaybeObjectId | null = null,
  resourceType: string = 'resource' // kept for backward compatibility / logging
): Promise<LeanDocument<TDoc> | null> {
  try {
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      return null;
    }

    const query: FilterQuery<TDoc> = {};

    // Use case-insensitive search for string values to prevent casing duplicates.
    if (typeof fieldValue === 'string') {
      query[fieldName] = {
        $regex: new RegExp(`^${escapeRegex(fieldValue)}$`, 'i'),
      } as FilterQuery<TDoc>[TField];
    } else {
      query[fieldName] = fieldValue as FilterQuery<TDoc>[TField];
    }

    if (excludeId) {
      query._id = { $ne: excludeId } as unknown as FilterQuery<TDoc>['_id'];
    }

    const existing = await Model.findOne(query).lean<TDoc>();
    return existing;
  } catch (error) {
    qerrors.qerrors(error as Error, 'unique-validator.checkDuplicateByField', {
      fieldName,
      resourceType,
      hasExcludeId: excludeId !== null,
      fieldValue:
        typeof fieldValue === 'string' ? fieldValue.substring(0, 100) : String(fieldValue),
      operation: 'duplicate-check',
    });
    throw error;
  }
}

/**
 * Validates that a field value is unique and throws error if not.
 */
export async function validateUniqueField<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(
  Model: Model<TDoc>,
  fieldName: TField,
  fieldValue: TDoc[TField],
  excludeId: MaybeObjectId | null = null,
  resourceType: string = 'resource'
): Promise<void> {
  try {
    const existing = await checkDuplicateByField(
      Model,
      fieldName,
      fieldValue,
      excludeId,
      resourceType
    );

    if (existing) {
      const duplicateError = new Error(
        `A ${resourceType} with this ${fieldName} already exists`
      ) as DuplicateError;
      duplicateError.code = 'DUPLICATE';
      duplicateError.status = 409;
      duplicateError.field = fieldName;
      duplicateError.value = fieldValue;
      duplicateError.existingId = existing._id;
      throw duplicateError;
    }
  } catch (error) {
    qerrors.qerrors(error as Error, 'unique-validator.validateUniqueField', {
      fieldName,
      resourceType,
      hasExcludeId: excludeId !== null,
      fieldValue:
        typeof fieldValue === 'string' ? fieldValue.substring(0, 100) : String(fieldValue),
      operation: 'unique-validation',
    });
    throw error;
  }
}

type FieldValueMap<TDoc extends DocumentShape> = Partial<
  Record<keyof TDoc & string, TDoc[keyof TDoc & string]>
>;

/**
 * Validates uniqueness for multiple fields.
 */
export async function validateUniqueFields<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  fieldValueMap: FieldValueMap<TDoc>,
  excludeId: MaybeObjectId | null = null,
  resourceType: string = 'resource'
): Promise<void> {
  try {
    const validationPromises: Array<Promise<void>> = [];

    for (const [fieldName, fieldValue] of Object.entries(fieldValueMap)) {
      if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
        validationPromises.push(
          validateUniqueField(
            Model,
            fieldName as keyof TDoc & string,
            fieldValue as TDoc[keyof TDoc & string],
            excludeId,
            resourceType
          )
        );
      }
    }

    await Promise.all(validationPromises);
  } catch (error) {
    qerrors.qerrors(error as Error, 'unique-validator.validateUniqueFields', {
      fieldCount: Object.keys(fieldValueMap).length,
      fieldNames: Object.keys(fieldValueMap),
      resourceType,
      hasExcludeId: excludeId !== null,
      operation: 'multi-field-validation',
    });
    throw error;
  }
}

/**
 * Creates a unique field validator for a specific resource type.
 */
export function createUniqueValidator<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  resourceType: string,
  uniqueField: keyof TDoc & string = 'name' as keyof TDoc & string
): UniqueValidator<TDoc> {
  return {
    async validateCreate(
      data: Partial<TDoc>,
      fieldsToCheck: Array<keyof TDoc & string> = [uniqueField]
    ): Promise<void> {
      const fieldValueMap: FieldValueMap<TDoc> = {};

      for (const field of fieldsToCheck) {
        const value = data[field];
        if (value !== undefined && value !== null && value !== '') {
          fieldValueMap[field] = value;
        }
      }

      if (Object.keys(fieldValueMap).length > 0) {
        await validateUniqueFields(Model, fieldValueMap, null, resourceType);
      }
    },

    async validateUpdate(
      id: MaybeObjectId,
      updateData: Partial<TDoc>,
      fieldsToCheck: Array<keyof TDoc & string> = [uniqueField]
    ): Promise<void> {
      const fieldValueMap: FieldValueMap<TDoc> = {};
      for (const field of fieldsToCheck) {
        const value = updateData[field];
        if (value !== undefined && value !== null && value !== '') {
          fieldValueMap[field] = value;
        }
      }

      if (Object.keys(fieldValueMap).length > 0) {
        await validateUniqueFields(Model, fieldValueMap, id, resourceType);
      }
    },

    async isUnique(
      fieldName: keyof TDoc & string,
      fieldValue: TDoc[keyof TDoc & string],
      excludeId: MaybeObjectId | null = null
    ): Promise<boolean> {
      const existing = await checkDuplicateByField(
        Model,
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
    ): Promise<LeanDocument<TDoc> | null> {
      return checkDuplicateByField(Model, fieldName, fieldValue, null, resourceType);
    },
  };
}

function isMongoDuplicateError(
  error: unknown
): error is MongoServerError & { keyValue: Record<string, unknown> } {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as Partial<MongoServerError> & {
    keyValue?: Record<string, unknown>;
  };
  return err.code === 11000 && typeof err.keyValue === 'object';
}

/**
 * Handles MongoDB duplicate key errors (code 11000).
 */
export function handleDuplicateKeyError(error: unknown, resourceType: string = 'resource'): Error {
  if (isMongoDuplicateError(error)) {
    // Safe check for keyValue existence and type
    const keyValue = (error as any).keyValue;
    if (!keyValue || typeof keyValue !== 'object') {
      const duplicateError = new Error(`Duplicate ${resourceType} detected`) as DuplicateError;
      duplicateError.code = 'DUPLICATE';
      duplicateError.status = 409;
      return duplicateError;
    }

    const field = Object.keys(keyValue)[0];

    if (field) {
      const duplicateError = new Error(
        `A ${resourceType} with this ${field} already exists`
      ) as DuplicateError;
      duplicateError.code = 'DUPLICATE';
      duplicateError.status = 409;
      duplicateError.field = field;
      duplicateError.value = keyValue[field];
      duplicateError.existingId = (error as any).writeErrors?.[0]?.op?._id;
      return duplicateError;
    }
  }

  return error as Error;
}

/**
 * Wrap a function to handle MongoDB duplicate key errors.
 */
export function withDuplicateKeyHandling<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  resourceType: string = 'resource'
): (...args: TArgs) => Promise<TResult> {
  return async function withDuplicateHandling(this: unknown, ...args: TArgs): Promise<TResult> {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      qerrors.qerrors(error as Error, 'unique-validator.withDuplicateKeyHandling', {
        resourceType,
        argCount: args.length,
        functionName: fn.name || 'anonymous',
        operation: 'duplicate-key-wrapper',
      });
      throw handleDuplicateKeyError(error, resourceType);
    }
  };
}

/**
 * Creates middleware to validate unique fields before processing requests.
 */
export function createUniqueFieldMiddleware<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  fieldName: keyof TDoc & string,
  resourceType: string,
  options: MiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { source = 'body', idParam = 'id' } = options;

  return async function uniqueFieldMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = (req as unknown as Record<string, Record<string, unknown>>)[source];
      const fieldValue = payload?.[fieldName];

      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return next();
      }

      const excludeId = (req.params?.[idParam] ?? null) as MaybeObjectId | null;

      if (excludeId) {
        const existing = await Model.findById(excludeId).select(fieldName).lean<TDoc>();
        if (existing && (existing as Record<string, unknown>)[fieldName] === fieldValue) {
          return next();
        }
      }

      await validateUniqueField(
        Model,
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
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next(error as Error);
    }
  };
}

/**
 * Creates middleware to validate multiple unique fields.
 */
export function createUniqueFieldsMiddleware<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  fieldNames: Array<keyof TDoc & string>,
  resourceType: string,
  options: MiddlewareOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { source = 'body', idParam = 'id' } = options;

  return async function uniqueFieldsMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = (req as unknown as Record<string, Record<string, unknown>>)[source];
      const fieldValueMap: FieldValueMap<TDoc> = {};

      for (const fieldName of fieldNames) {
        const value = payload?.[fieldName];
        if (value !== undefined && value !== null && value !== '') {
          fieldValueMap[fieldName] = value as TDoc[keyof TDoc & string];
        }
      }

      if (Object.keys(fieldValueMap).length === 0) {
        return next();
      }

      const excludeId = (req.params?.[idParam] ?? null) as MaybeObjectId | null;

      await validateUniqueFields(Model, fieldValueMap, excludeId, resourceType);
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
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error as Error);
    }
  };
}

/**
 * Check if error is a duplicate error.
 */
export function isDuplicateError(error: unknown): error is DuplicateError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<DuplicateError>;
  return (
    candidate.code === 'DUPLICATE' || candidate.code === 11000 || candidate.isDuplicate === true
  );
}

/**
 * Create a batch uniqueness checker for bulk operations.
 */
export function createBatchUniqueChecker<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(
  Model: Model<TDoc>,
  fieldName: TField,
  resourceType: string = 'resource'
): BatchUniqueChecker<TDoc[TField]> {
  return {
    async checkMany(values: Array<TDoc[TField]>): Promise<BatchCheckResults<TDoc[TField]>> {
      try {
        const results: BatchCheckResults<TDoc[TField]> = {
          unique: [],
          duplicates: [],
        };

        for (const value of values) {
          const existing = await checkDuplicateByField(Model, fieldName, value, null, resourceType);
          if (existing) {
            results.duplicates.push({ value, existingId: existing._id });
          } else {
            results.unique.push(value);
          }
        }

        return results;
      } catch (error) {
        qerrors.qerrors(error as Error, 'unique-validator.createBatchUniqueChecker.checkMany', {
          fieldName,
          resourceType,
          valueCount: values.length,
          operation: 'batch-duplicate-check',
        });
        throw error;
      }
    },

    async filterUnique(values: Array<TDoc[TField]>): Promise<Array<TDoc[TField]>> {
      try {
        const results = await this.checkMany(values);
        return results.unique;
      } catch (error) {
        qerrors.qerrors(error as Error, 'unique-validator.createBatchUniqueChecker.filterUnique', {
          fieldName,
          resourceType,
          valueCount: values.length,
          operation: 'batch-filter-unique',
        });
        throw error;
      }
    },
  };
}

export type { DocumentShape as UniqueValidatorDocument };
