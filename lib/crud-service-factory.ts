/**
 * CRUD Service Factory
 * Generates standardized CRUD service layers for MongoDB/Mongoose models.
 *
 * Eliminates repetitive CRUD service code by providing a factory pattern that
 * creates complete service objects with standard operations. Provides lifecycle
 * hooks for customization while reducing code duplication.
 *
 * Features:
 * - Complete CRUD operations (create, read, update, delete)
 * - Built-in duplicate detection
 * - Lifecycle hooks (before/after create, update, delete)
 * - Search with configurable searchable fields
 * - Pagination with consistent response format
 * - Query enhancement and result transformation
 *
 * Use cases:
 * - Mongoose applications
 * - MongoDB-based APIs
 * - Microservices with data models
 * - Any application needing standardized data access
 */

import type { FilterQuery, HydratedDocument, Model, QueryWithHelpers, UpdateQuery } from 'mongoose';
import * as qerrors from 'qerrors';

type DocumentShape = Record<string, unknown>;
type SortDefinition = Record<string, 1 | -1>;
type HydratedFindQuery<TDoc extends DocumentShape> = QueryWithHelpers<
  HydratedDocument<TDoc>[],
  HydratedDocument<TDoc>,
  Record<string, never>,
  TDoc
>; // Provide precise typings for fluent find queries without leaking helper generics

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export type ValidationRules<TDoc extends DocumentShape> = Partial<
  Record<keyof TDoc & string, ValidationRule>
>;

export interface PaginationOptions<TSort = SortDefinition> {
  page?: number;
  limit?: number;
  sort?: TSort;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

interface PaginatedServiceResult<TDoc extends DocumentShape> {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  [key: string]: unknown;
}

interface LifecycleHooks<TDoc extends DocumentShape> {
  beforeCreate?: (data: Partial<TDoc>) => Promise<Partial<TDoc>> | Partial<TDoc>;
  afterCreate?: (created: HydratedDocument<TDoc>) => Promise<void> | void;
  beforeUpdate?: (
    data: Partial<TDoc>,
    existing: HydratedDocument<TDoc>
  ) => Promise<Partial<TDoc>> | Partial<TDoc>;
  afterUpdate?: (updated: HydratedDocument<TDoc>) => Promise<void> | void;
  beforeDelete?: (existing: HydratedDocument<TDoc>) => Promise<void> | void;
  afterDelete?: (deleted: HydratedDocument<TDoc>) => Promise<void> | void;
}

export interface CrudServiceOptions<TDoc extends DocumentShape> extends LifecycleHooks<TDoc> {
  uniqueField?: keyof TDoc & string;
  searchableFields?: Array<keyof TDoc & string>;
  defaultSort?: SortDefinition;
  defaultLimit?: number;
}

export interface PaginatedServiceOptions<TDoc extends DocumentShape, TSort = SortDefinition> {
  defaultSort?: TSort;
  defaultLimit?: number;
  queryEnhancer?: (
    query: HydratedFindQuery<TDoc>,
    filters: FilterQuery<TDoc>
  ) => HydratedFindQuery<TDoc>;
  resultEnhancer?: (
    resources: HydratedDocument<TDoc>[],
    filters: FilterQuery<TDoc>
  ) => Promise<HydratedDocument<TDoc>[]> | HydratedDocument<TDoc>[];
  additionalData?: (
    filters: FilterQuery<TDoc>,
    resources: HydratedDocument<TDoc>[]
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

export interface CrudService<TDoc extends DocumentShape> {
  create: (data: Partial<TDoc>) => Promise<HydratedDocument<TDoc>>;
  getById: (id: string) => Promise<HydratedDocument<TDoc>>;
  getAll: (
    filters?: FilterQuery<TDoc>,
    pagination?: PaginationOptions,
    sort?: SortDefinition
  ) => Promise<{
    data: HydratedDocument<TDoc>[];
    pagination: PaginationResponse;
  }>;
  update: (id: string, updateData: Partial<TDoc>) => Promise<HydratedDocument<TDoc>>;
  deleteById: (id: string) => Promise<HydratedDocument<TDoc>>;
  search: (
    query: string,
    pagination?: PaginationOptions
  ) => Promise<{
    data: HydratedDocument<TDoc>[];
    pagination: PaginationResponse;
    query: string;
  }>;
  getByField: (
    field: keyof TDoc & string,
    value: TDoc[keyof TDoc & string]
  ) => Promise<HydratedDocument<TDoc>[]>;
  count: (filters?: FilterQuery<TDoc>) => Promise<number>;
  exists: (id: string) => Promise<boolean>;
  bulkCreate: (items: Array<Partial<TDoc>>) => Promise<
    Array<{
      success: boolean;
      data?: HydratedDocument<TDoc>;
      error?: string;
      input: Partial<TDoc>;
    }>
  >;
  upsert: (query: FilterQuery<TDoc>, data: Partial<TDoc>) => Promise<HydratedDocument<TDoc>>;
}

export interface DuplicateError extends Error {
  code: 'DUPLICATE';
  field: string;
  value: unknown;
}

export interface NotFoundError extends Error {
  code: 'NOT_FOUND';
}

/**
 * Find document by field value (case-insensitive).
 * @param Model - Mongoose model used for lookups.
 * @param field - Field to search against.
 * @param value - Value to compare.
 * @returns Hydrated document when found, otherwise null.
 */
export async function findByFieldIgnoreCase<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(Model: Model<TDoc>, field: TField, value: TDoc[TField]): Promise<HydratedDocument<TDoc> | null> {
  try {
    if (!value || typeof value !== 'string') {
      return Model.findOne({ [field]: value } as FilterQuery<TDoc>).exec(); // Query directly without regex when value is non-string to leverage indexes
    }

    return Model.findOne({
      [field]: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') },
    } as FilterQuery<TDoc>).exec(); // Use case-insensitive regex to prevent duplicates differing only by casing
  } catch (error) {
    qerrors.qerrors(error as Error, 'crud-service-factory.findByFieldIgnoreCase', {
      field,
      valueType: typeof value,
      isStringValue: typeof value === 'string',
      valueLength: typeof value === 'string' ? value.length : undefined,
    });
    throw error;
  }
}

/**
 * Escape special regex characters for safe use in queries.
 * @param str - Raw string to escape.
 * @returns Sanitized string safe for regex construction.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex metacharacters to avoid injection vulnerabilities
}

/**
 * Create a duplicate error that can be surfaced to clients.
 * @param resourceType - Name of the resource (for messaging).
 * @param field - Field that violated uniqueness.
 * @param value - Offending value.
 * @returns DuplicateError enriched with metadata.
 */
export function createDuplicateError(
  resourceType: string,
  field: string,
  value: unknown
): DuplicateError {
  const error = new Error(
    `${resourceType} with ${field} "${String(value)}" already exists`
  ) as DuplicateError;
  error.code = 'DUPLICATE';
  error.field = field;
  error.value = value;
  return error;
}

/**
 * Creates a CRUD service factory for a given Mongoose model.
 * @param Model - Mongoose model to wrap.
 * @param resourceType - Semantic name for logging and messages.
 * @param options - Optional lifecycle hooks and defaults.
 * @returns Service implementing standardized CRUD operations.
 */
export function createCrudService<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  resourceType: string,
  options: CrudServiceOptions<TDoc> = {}
): CrudService<TDoc> {
  const {
    uniqueField = 'name' as keyof TDoc & string,
    searchableFields = ['name'] as Array<keyof TDoc & string>,
    beforeCreate,
    afterCreate,
    beforeUpdate,
    afterUpdate,
    beforeDelete,
    afterDelete,
    defaultSort = { createdAt: -1 },
    defaultLimit = 50,
  } = options;

  async function create(data: Partial<TDoc>): Promise<HydratedDocument<TDoc>> {
    try {
      const uniqueValue = data[uniqueField];
      if (uniqueValue !== undefined && uniqueValue !== null && uniqueValue !== '') {
        const existing = await findByFieldIgnoreCase(Model as any, uniqueField, uniqueValue);
        if (existing) {
          throw createDuplicateError(resourceType, uniqueField, uniqueValue);
        }
      }

      const processedData = beforeCreate ? await beforeCreate({ ...data }) : { ...data };

      const item = new (Model as any)(processedData);
      const saved = await item.save(); // Persist via Mongoose so hooks and validation execute

      if (afterCreate) {
        await afterCreate(saved);
      }

      console.log(`[crud] ${resourceType} created: ${saved._id}`); // Emit structured log to support operational tracing
      return saved;
    } catch (error) {
      qerrors.qerrors(error as Error, 'crud-service-factory.create', {
        resourceType,
        uniqueField,
        hasUniqueValue:
          data[uniqueField] !== undefined && data[uniqueField] !== null && data[uniqueField] !== '',
        dataFieldCount: Object.keys(data).length,
        hasBeforeCreate: beforeCreate !== undefined,
        hasAfterCreate: afterCreate !== undefined,
      });
      throw error;
    }
  }

  async function getById(id: string): Promise<HydratedDocument<TDoc>> {
    const item = await Model.findById(id).exec(); // Use exec to obtain a real promise and better typings
    if (!item) {
      const error = new Error(`${resourceType} not found`) as NotFoundError;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return item;
  }

  async function getAll(
    filters: FilterQuery<TDoc> = {},
    pagination: PaginationOptions = {},
    sort: SortDefinition = defaultSort
  ): Promise<{
    data: HydratedDocument<TDoc>[];
    pagination: PaginationResponse;
  }> {
    const { page = 1, limit = defaultLimit } = pagination;
    const skip = (page - 1) * limit;

    const query = Model.find(filters); // Start with raw query to allow optional enhancers
    query.sort(sort); // Apply sorting early to leverage indexes

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(), // Execute query with pagination to fetch subset
      Model.countDocuments(filters).exec(), // Count separately to compute pagination metadata safely
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async function update(id: string, updateData: Partial<TDoc>): Promise<HydratedDocument<TDoc>> {
    try {
      const existing = await Model.findById(id).exec(); // Fetch document once to compare unique fields and reuse in hooks
      if (!existing) {
        const error = new Error(`${resourceType} not found`) as NotFoundError;
        error.code = 'NOT_FOUND';
        throw error;
      }

      const incomingValue = updateData[uniqueField];
      if (
        incomingValue !== undefined &&
        incomingValue !== null &&
        incomingValue !== '' &&
        existing[uniqueField] !== incomingValue
      ) {
        const duplicate = await findByFieldIgnoreCase(Model as any, uniqueField, incomingValue);
        if (duplicate && String((duplicate as { _id: unknown })._id) !== id) {
          throw createDuplicateError(resourceType, uniqueField, incomingValue);
        }
      }

      const processedData = beforeUpdate
        ? await beforeUpdate({ ...updateData }, existing)
        : { ...updateData };

      const updated = await Model.findByIdAndUpdate(id, processedData as UpdateQuery<TDoc>, {
        new: true,
        runValidators: true,
      }).exec(); // Execute update with validators ensuring Mongoose produces a fresh document

      if (!updated) {
        const error = new Error(`${resourceType} not found`) as NotFoundError;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (afterUpdate) {
        await afterUpdate(updated);
      }

      console.log(`[crud] ${resourceType} updated: ${updated._id}`); // Log updates for auditing and debugging diffs
      return updated;
    } catch (error) {
      qerrors.qerrors(error as Error, 'crud-service-factory.update', {
        resourceType,
        id,
        uniqueField,
        updateFieldCount: Object.keys(updateData).length,
        hasUniqueFieldChange: updateData[uniqueField] !== undefined,
        hasBeforeUpdate: beforeUpdate !== undefined,
        hasAfterUpdate: afterUpdate !== undefined,
      });
      throw error;
    }
  }

  async function deleteById(id: string): Promise<HydratedDocument<TDoc>> {
    try {
      const existing = await Model.findById(id).exec(); // Ensure we load document for lifecycle hooks before removing
      if (!existing) {
        const error = new Error(`${resourceType} not found`) as NotFoundError;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (beforeDelete) {
        await beforeDelete(existing);
      }

      const deleted = await Model.findByIdAndDelete(id).exec(); // Delete via Mongoose so middleware executes and document returned
      if (!deleted) {
        const error = new Error(`${resourceType} not found`) as NotFoundError;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (afterDelete) {
        await afterDelete(deleted);
      }

      console.log(`[crud] ${resourceType} deleted: ${deleted._id}`); // Capture deletions for compliance-friendly audit trail
      return deleted;
    } catch (error) {
      qerrors.qerrors(error as Error, 'crud-service-factory.deleteById', {
        resourceType,
        id,
        hasBeforeDelete: beforeDelete !== undefined,
        hasAfterDelete: afterDelete !== undefined,
      });
      throw error;
    }
  }

  async function search(
    queryText: string,
    pagination: PaginationOptions = {}
  ): Promise<{
    data: HydratedDocument<TDoc>[];
    pagination: PaginationResponse;
    query: string;
  }> {
    const { page = 1, limit = defaultLimit } = pagination;
    const skip = (page - 1) * limit;

    const searchCriteria: FilterQuery<TDoc> = {
      $or: searchableFields.map(field => ({
        [field]: { $regex: escapeRegex(queryText), $options: 'i' },
      })),
    } as FilterQuery<TDoc>;

    const [data, total] = await Promise.all([
      Model.find(searchCriteria).skip(skip).limit(limit).sort(defaultSort).exec(), // Execute search query with pagination to keep memory bounded
      Model.countDocuments(searchCriteria).exec(), // Count matches to inform client pagination
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasMore: page < totalPages,
      },
      query: queryText,
    };
  }

  async function getByField(
    field: keyof TDoc & string,
    value: TDoc[keyof TDoc & string]
  ): Promise<HydratedDocument<TDoc>[]> {
    return Model.find({ [field]: value } as FilterQuery<TDoc>).exec(); // Retrieve all matching docs for analytics/helpers while preserving indexes
  }

  async function count(filters: FilterQuery<TDoc> = {}): Promise<number> {
    return Model.countDocuments(filters).exec(); // Use exec for deterministic promise resolution and to surface query errors eagerly
  }

  async function exists(id: string): Promise<boolean> {
    const doc = await Model.findById(id).select('_id').lean<{ _id: unknown }>().exec(); // Lean query keeps memory usage low when only checking existence
    return doc !== null;
  }

  async function bulkCreate(items: Array<Partial<TDoc>>): Promise<
    Array<{
      success: boolean;
      data?: HydratedDocument<TDoc>;
      error?: string;
      input: Partial<TDoc>;
    }>
  > {
    try {
      const results: Array<{
        success: boolean;
        data?: HydratedDocument<TDoc>;
        error?: string;
        input: Partial<TDoc>;
      }> = [];

      for (const item of items) {
        try {
          const created = await create(item);
          results.push({ success: true, data: created, input: item });
        } catch (error) {
          const err = error as Error;
          qerrors.qerrors(err, 'crud-service-factory.bulkCreate.item', {
            resourceType,
            itemFieldCount: Object.keys(item).length,
            itemIndex: results.length,
            totalItems: items.length,
          });
          results.push({
            success: false,
            error: err.message,
            input: item,
          });
        }
      }

      return results;
    } catch (error) {
      qerrors.qerrors(error as Error, 'crud-service-factory.bulkCreate', {
        resourceType,
        itemCount: items.length,
      });
      throw error;
    }
  }

  async function upsert(
    query: FilterQuery<TDoc>,
    data: Partial<TDoc>
  ): Promise<HydratedDocument<TDoc>> {
    try {
      const existing = await Model.findOne(query).exec(); // Look for existing doc first to respect hooks on update
      if (existing) {
        const identifier = (existing as { _id: unknown })._id;
        return update(String(identifier), data);
      }

      return create({ ...query, ...data });
    } catch (error) {
      qerrors.qerrors(error as Error, 'crud-service-factory.upsert', {
        resourceType,
        queryFieldCount: Object.keys(query).length,
        dataFieldCount: Object.keys(data).length,
      });
      throw error;
    }
  }

  return {
    create,
    getById,
    getAll,
    update,
    deleteById,
    search,
    getByField,
    count,
    exists,
    bulkCreate,
    upsert,
  };
}

/**
 * Creates a paginated service function with standardized response format.
 * @param Model - Mongoose model backing the pagination.
 * @param resourceType - Resource key inserted into the response.
 * @param options - Pagination behaviour customization.
 * @returns Service function returning pagination metadata plus data.
 */
export function createPaginatedService<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  resourceType: string,
  options: PaginatedServiceOptions<TDoc> = {}
): (
  filters?: FilterQuery<TDoc>,
  serviceOptions?: PaginationOptions
) => Promise<PaginatedServiceResult<TDoc>> {
  const {
    defaultSort = { createdAt: -1 } as SortDefinition,
    defaultLimit = 50,
    queryEnhancer,
    resultEnhancer,
    additionalData,
  } = options;

  return async function getPaginatedResources(
    filters: FilterQuery<TDoc> = {},
    serviceOptions: PaginationOptions = {}
  ): Promise<PaginatedServiceResult<TDoc>> {
    const { page = 1, limit = defaultLimit, sort = defaultSort } = serviceOptions;
    const skip = (page - 1) * limit;

    let query = Model.find(filters) as HydratedFindQuery<TDoc>; // Start from base query then optionally enhance without mutating Model global state
    if (queryEnhancer) {
      query = queryEnhancer(query, filters); // Allow consumers to add populates or projections while keeping type safety
    }

    const paginatedQuery = query.sort(sort).skip(skip).limit(limit) as HydratedFindQuery<TDoc>; // Preserve fluent query so we can execute once and keep helpers intact
    const [resources, totalCount] = await Promise.all([
      paginatedQuery.exec(), // Execute final query respecting user-provided enhancements
      Model.countDocuments(filters).exec(), // Count documents separately to avoid mutating enhanced query
    ]);

    const enhancedResources = resultEnhancer ? await resultEnhancer(resources, filters) : resources; // Allow callers to decorate results (e.g., populate, transform) without reimplementing pagination

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const hasMore = page < totalPages;

    const response: PaginatedServiceResult<TDoc> = {
      [resourceType]: enhancedResources,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore,
    };

    if (additionalData) {
      const extra = await additionalData(filters, enhancedResources);
      Object.assign(response, extra);
    }

    return response;
  };
}

/**
 * Create service with validation for a specific domain.
 * @param Model - Mongoose model to protect.
 * @param resourceType - Resource name for messaging.
 * @param validationRules - Rules applied during create/update.
 * @returns CRUD service that validates payloads.
 */
export function createValidatedService<TDoc extends DocumentShape>(
  Model: Model<TDoc>,
  resourceType: string,
  validationRules: ValidationRules<TDoc> = {}
): CrudService<TDoc> {
  return createCrudService(Model, resourceType, {
    async beforeCreate(data) {
      validateData(data, validationRules);
      return data;
    },
    async beforeUpdate(data, existing) {
      validateData({ ...(existing.toObject() as Partial<TDoc>), ...data }, validationRules, true);
      return data;
    },
  });
}

/**
 * Validate data against rules to provide pre-save safety.
 * @param data - Payload being validated.
 * @param rules - Validation rules keyed by field name.
 * @param isUpdate - Whether validation occurs during update (relaxes required check).
 * @returns Nothing; throws on validation failure.
 */
export function validateData<TDoc extends DocumentShape>(
  data: Partial<TDoc>,
  rules: ValidationRules<TDoc>,
  isUpdate: boolean = false
): void {
  try {
    for (const [field, rule] of Object.entries(rules)) {
      if (!rule) {
        continue;
      }

      const value = data[field as keyof TDoc];

      if (rule.required && !isUpdate && (value === undefined || value === null || value === '')) {
        throw new Error(`${field} is required`);
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rule.type === 'string' && typeof value !== 'string') {
        throw new Error(`${field} must be a string`);
      }

      if (rule.type === 'number' && typeof value !== 'number') {
        throw new Error(`${field} must be a number`);
      }

      if (rule.enum && !rule.enum.includes(value)) {
        throw new Error(`${field} must be one of: ${rule.enum.join(', ')}`);
      }

      if (
        rule.minLength !== undefined &&
        typeof value === 'string' &&
        value.length < rule.minLength
      ) {
        throw new Error(`${field} must be at least ${rule.minLength} characters`);
      }

      if (
        rule.maxLength !== undefined &&
        typeof value === 'string' &&
        value.length > rule.maxLength
      ) {
        throw new Error(`${field} must be at most ${rule.maxLength} characters`);
      }

      if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
        throw new Error(`${field} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
        throw new Error(`${field} must be at most ${rule.max}`);
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        throw new Error(`${field} has invalid format`);
      }
    }
  } catch (error) {
    qerrors.qerrors(error as Error, 'crud-service-factory.validateData', {
      dataFieldCount: Object.keys(data).length,
      ruleCount: Object.keys(rules).length,
      isUpdate,
    });
    throw error;
  }
}

export type { DocumentShape as CrudDocument };
