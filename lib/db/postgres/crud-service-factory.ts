/**
 * PostgreSQL CRUD service factory
 *
 * Provides Postgres equivalents of `lib/crud-service-factory.ts` using a
 * validated PostgresResource (table + allowlisted columns + pool).
 *
 * Design constraints:
 * - No string concatenation of user-provided values into SQL.
 * - Identifiers (columns/tables) must be allowlisted and safely quoted.
 * - Filters are intentionally constrained (see `buildWhereClause()`).
 */

import qerrors from 'qerrors';
import { createDuplicateError, escapeRegex, validateData, validateFieldName } from '../../crud-service-factory.js';
import { createModuleUtilities } from '../../common-patterns.js';
import { quoteSqlIdentifier } from './identifiers.js';
import { buildOrderByClause, buildWhereClause } from './filters.js';
import { safeDbOperationPostgres } from './database-utils.js';
import { validateUniqueFieldPostgres, withDuplicateKeyHandlingPostgres } from './unique-validator.js';
import type { PostgresResource } from './types.js';

const utils = createModuleUtilities('postgres-crud-service-factory');

type DocumentShape = Record<string, unknown>;
type SortDefinition = Record<string, 1 | -1>;

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

interface LifecycleHooks<TDoc extends DocumentShape> {
  beforeCreate?: (data: Partial<TDoc>) => Promise<Partial<TDoc>> | Partial<TDoc>;
  afterCreate?: (created: TDoc) => Promise<void> | void;
  beforeUpdate?: (data: Partial<TDoc>, existing: TDoc) => Promise<Partial<TDoc>> | Partial<TDoc>;
  afterUpdate?: (updated: TDoc) => Promise<void> | void;
  beforeDelete?: (existing: TDoc) => Promise<void> | void;
  afterDelete?: (deleted: TDoc) => Promise<void> | void;
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
  resultEnhancer?: (resources: TDoc[], filters: unknown) => Promise<TDoc[]> | TDoc[];
  additionalData?: (
    filters: unknown,
    resources: TDoc[]
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

interface PaginatedServiceResult<TDoc extends DocumentShape> {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  [key: string]: unknown;
}

export interface CrudService<TDoc extends DocumentShape> {
  create: (data: Partial<TDoc>) => Promise<TDoc>;
  getById: (id: string | number) => Promise<TDoc>;
  getAll: (
    filters?: unknown,
    pagination?: PaginationOptions,
    sort?: SortDefinition
  ) => Promise<{ data: TDoc[]; pagination: PaginationResponse }>;
  update: (id: string | number, updateData: Partial<TDoc>) => Promise<TDoc>;
  deleteById: (id: string | number) => Promise<TDoc>;
  search: (
    query: string,
    pagination?: PaginationOptions
  ) => Promise<{ data: TDoc[]; pagination: PaginationResponse; query: string }>;
  getByField: (field: keyof TDoc & string, value: TDoc[keyof TDoc & string]) => Promise<TDoc[]>;
  count: (filters?: unknown) => Promise<number>;
  exists: (id: string | number) => Promise<boolean>;
  bulkCreate: (items: Array<Partial<TDoc>>) => Promise<
    Array<{ success: boolean; data?: TDoc; error?: string; input: Partial<TDoc> }>
  >;
  upsert: (query: unknown, data: Partial<TDoc>) => Promise<TDoc>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function escapeLikePattern(value: string): string {
  // Escape LIKE wildcards so user-controlled patterns do not broaden scans unintentionally.
  return value.replace(/([\\\\%_])/g, '\\\\$1');
}

function pickAllowlistedFields<TDoc extends DocumentShape>(
  resource: PostgresResource,
  data: Partial<TDoc>,
  options: { allowId?: boolean } = {}
): Record<string, unknown> {
  if (!isPlainObject(data)) {
    throw new Error('Payload must be an object');
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!resource.allowedColumns.has(key)) {
      continue; // Rationale: drop unexpected fields instead of risking SQL identifier injection.
    }
    if (!options.allowId && key === resource.idColumn) {
      continue; // Rationale: id is typically server-generated; prevent accidental overrides.
    }
    output[key] = value;
  }

  return output;
}

async function insertRow<TDoc extends DocumentShape>(
  resource: PostgresResource,
  data: Partial<TDoc>
): Promise<TDoc> {
  const payload = pickAllowlistedFields(resource, data, { allowId: false });
  const keys = Object.keys(payload);
  if (!keys.length) {
    throw new Error('Insert payload has no allowlisted fields');
  }

  const cols = keys.map(k => quoteSqlIdentifier(k)).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const values = keys.map(k => payload[k]);

  const sql = `INSERT INTO ${quoteSqlIdentifier(resource.tableName)} (${cols}) VALUES (${placeholders}) RETURNING *`;
  const result = await safeDbOperationPostgres(() => resource.pool.query(sql, values), 'postgres.insertRow');
  const row = result?.rows?.[0] as TDoc | undefined;
  if (!row) {
    throw new Error('Insert did not return a row');
  }
  return row;
}

async function updateRowById<TDoc extends DocumentShape>(
  resource: PostgresResource,
  id: string | number,
  data: Partial<TDoc>
): Promise<TDoc> {
  const payload = pickAllowlistedFields(resource, data, { allowId: false });
  const keys = Object.keys(payload);
  if (!keys.length) {
    throw new Error('Update payload has no allowlisted fields');
  }

  const setSql = keys.map((k, i) => `${quoteSqlIdentifier(k)} = $${i + 2}`).join(', ');
  const values = keys.map(k => payload[k]);

  const sql = `UPDATE ${quoteSqlIdentifier(resource.tableName)} SET ${setSql} WHERE ${quoteSqlIdentifier(
    resource.idColumn
  )} = $1 RETURNING *`;

  const result = await safeDbOperationPostgres(
    () => resource.pool.query(sql, [id, ...values]),
    'postgres.updateRowById'
  );
  const row = result?.rows?.[0] as TDoc | undefined;
  if (!row) {
    throw new Error('NOT_FOUND');
  }
  return row;
}

async function deleteRowById<TDoc extends DocumentShape>(
  resource: PostgresResource,
  id: string | number
): Promise<TDoc> {
  const sql = `DELETE FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
    resource.idColumn
  )} = $1 RETURNING *`;
  const result = await safeDbOperationPostgres(() => resource.pool.query(sql, [id]), 'postgres.deleteRowById');
  const row = result?.rows?.[0] as TDoc | undefined;
  if (!row) {
    throw new Error('NOT_FOUND');
  }
  return row;
}

/**
 * Case-insensitive field lookup (exact match).
 */
export async function findByFieldIgnoreCasePostgres<
  TDoc extends DocumentShape,
  TField extends keyof TDoc & string,
>(resource: PostgresResource, field: TField, value: TDoc[TField]): Promise<TDoc | null> {
  try {
    validateFieldName(field, new Set(resource.allowedColumns));

    const col = quoteSqlIdentifier(field);
    const table = quoteSqlIdentifier(resource.tableName);

    const sql =
      typeof value === 'string'
        ? `SELECT * FROM ${table} WHERE LOWER(${col}) = LOWER($1) LIMIT 1`
        : `SELECT * FROM ${table} WHERE ${col} = $1 LIMIT 1`;

    const result = await safeDbOperationPostgres(() => resource.pool.query(sql, [value]), 'postgres.findByFieldIgnoreCase');
    return (result?.rows?.[0] as TDoc | undefined) ?? null;
  } catch (error) {
    qerrors.qerrors(error as Error, 'postgres-crud-service-factory.findByFieldIgnoreCasePostgres', {
      tableName: resource.tableName,
      field,
      valueType: typeof value,
    });
    throw error;
  }
}

/**
 * Create a CRUD service for a Postgres-backed resource.
 */
export function createCrudServicePostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  resourceType: string,
  options: CrudServiceOptions<TDoc> = {}
): CrudService<TDoc> {
  const {
    uniqueField,
    searchableFields = [],
    defaultSort = { [resource.createdAtColumn]: -1 } as SortDefinition,
    defaultLimit = 50,
    beforeCreate,
    afterCreate,
    beforeUpdate,
    afterUpdate,
    beforeDelete,
    afterDelete,
  } = options;

  async function create(data: Partial<TDoc>): Promise<TDoc> {
    try {
      const prepared = beforeCreate ? await beforeCreate(data) : data;

      if (uniqueField && (prepared as Record<string, unknown>)[uniqueField] !== undefined) {
        await validateUniqueFieldPostgres(
          resource,
          uniqueField as any,
          (prepared as any)[uniqueField],
          null,
          resourceType
        );
      }

      const createWithDupHandling = withDuplicateKeyHandlingPostgres(
        async () => insertRow(resource, prepared),
        resourceType
      );
      const created = await createWithDupHandling();

      afterCreate && (await afterCreate(created));
      return created;
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.create', {
        resourceType,
        tableName: resource.tableName,
        uniqueField,
      });
      if (String((error as Error).message) === 'NOT_FOUND') {
        throw error;
      }
      throw error;
    }
  }

  async function getById(id: string | number): Promise<TDoc> {
    try {
      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 LIMIT 1`;
      const result = await safeDbOperationPostgres(() => resource.pool.query(sql, [id]), 'postgres.getById');
      const row = result?.rows?.[0] as TDoc | undefined;
      if (!row) {
        const err = new Error(`${resourceType} not found`);
        (err as any).code = 'NOT_FOUND';
        throw err;
      }
      return row;
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.getById', {
        resourceType,
        tableName: resource.tableName,
        id,
      });
      throw error;
    }
  }

  async function getAll(
    filters: unknown = {},
    pagination: PaginationOptions = {},
    sort: SortDefinition = defaultSort
  ): Promise<{ data: TDoc[]; pagination: PaginationResponse }> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? defaultLimit;
      const skip = (page - 1) * limit;
      const sortToUse = sort ?? pagination.sort ?? defaultSort;

      const where = buildWhereClause(resource, filters, 1);
      const orderBy = buildOrderByClause(resource, sortToUse as any);

      const dataSql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} ${orderBy} LIMIT $${
        where.nextParamIndex
      } OFFSET $${where.nextParamIndex + 1}`;
      const countSql = `SELECT COUNT(*)::int AS total FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text}`;

      const [dataResult, countResult] = await Promise.all([
        safeDbOperationPostgres(
          () => resource.pool.query(dataSql, [...where.values, limit, skip]),
          'postgres.getAll.data'
        ),
        safeDbOperationPostgres(
          () => resource.pool.query(countSql, where.values),
          'postgres.getAll.count'
        ),
      ]);

      const total = Number((countResult?.rows?.[0] as any)?.total ?? 0) || 0;
      const pages = Math.max(1, Math.ceil(total / limit));

      return {
        data: (dataResult?.rows ?? []) as TDoc[],
        pagination: {
          page,
          limit,
          total,
          pages,
          hasMore: page < pages,
        },
      };
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.getAll', {
        resourceType,
        tableName: resource.tableName,
      });
      throw error;
    }
  }

  async function update(id: string | number, updateData: Partial<TDoc>): Promise<TDoc> {
    try {
      const existing = await getById(id);
      const prepared = beforeUpdate ? await beforeUpdate(updateData, existing) : updateData;

      if (uniqueField && (prepared as Record<string, unknown>)[uniqueField] !== undefined) {
        const existingValue = (existing as Record<string, unknown>)[uniqueField];
        const nextValue = (prepared as Record<string, unknown>)[uniqueField];
        if (existingValue !== nextValue) {
          await validateUniqueFieldPostgres(
            resource,
            uniqueField as any,
            (prepared as any)[uniqueField],
            id,
            resourceType
          );
        }
      }

      const updateWithDupHandling = withDuplicateKeyHandlingPostgres(
        async () => updateRowById(resource, id, prepared),
        resourceType
      );
      const updated = await updateWithDupHandling();

      afterUpdate && (await afterUpdate(updated));
      return updated;
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.update', {
        resourceType,
        tableName: resource.tableName,
        id,
      });
      if (String((error as Error).message) === 'NOT_FOUND') {
        const err = new Error(`${resourceType} not found`);
        (err as any).code = 'NOT_FOUND';
        throw err;
      }
      throw error;
    }
  }

  async function deleteById(id: string | number): Promise<TDoc> {
    try {
      const existing = await getById(id);
      beforeDelete && (await beforeDelete(existing));
      const deleted = await deleteRowById<TDoc>(resource, id);
      afterDelete && (await afterDelete(deleted));
      return deleted;
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.deleteById', {
        resourceType,
        tableName: resource.tableName,
        id,
      });
      if (String((error as Error).message) === 'NOT_FOUND') {
        const err = new Error(`${resourceType} not found`);
        (err as any).code = 'NOT_FOUND';
        throw err;
      }
      throw error;
    }
  }

  async function search(
    query: string,
    pagination: PaginationOptions = {}
  ): Promise<{ data: TDoc[]; pagination: PaginationResponse; query: string }> {
    try {
      if (!searchableFields.length) {
        throw new Error('Search not configured: searchableFields is empty');
      }

      // Escape user input so it is treated as a literal substring match, not a wildcard pattern.
      const escaped = escapeLikePattern(String(query ?? ''));
      const pattern = `%${escaped}%`;

      const allowlisted = searchableFields.filter(f => resource.allowedColumns.has(String(f)));
      if (!allowlisted.length) {
        throw new Error('Search not configured: no searchableFields are allowlisted');
      }

      const orParts = allowlisted.map((field, i) => `${quoteSqlIdentifier(String(field))} ILIKE $${i + 1} ESCAPE '\\\\'`);
      const whereSql = `WHERE (${orParts.join(' OR ')})`;
      const whereValues = Array(allowlisted.length).fill(pattern);

      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? defaultLimit;
      const skip = (page - 1) * limit;

      const dataSql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} ${whereSql} ORDER BY ${quoteSqlIdentifier(
        resource.createdAtColumn
      )} DESC LIMIT $${allowlisted.length + 1} OFFSET $${allowlisted.length + 2}`;

      const countSql = `SELECT COUNT(*)::int AS total FROM ${quoteSqlIdentifier(resource.tableName)} ${whereSql}`;

      const [dataResult, countResult] = await Promise.all([
        safeDbOperationPostgres(
          () => resource.pool.query(dataSql, [...whereValues, limit, skip]),
          'postgres.search.data'
        ),
        safeDbOperationPostgres(
          () => resource.pool.query(countSql, whereValues),
          'postgres.search.count'
        ),
      ]);

      const total = Number((countResult?.rows?.[0] as any)?.total ?? 0) || 0;
      const pages = Math.max(1, Math.ceil(total / limit));

      return {
        data: (dataResult?.rows ?? []) as TDoc[],
        pagination: { page, limit, total, pages, hasMore: page < pages },
        query,
      };
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.search', {
        resourceType,
        tableName: resource.tableName,
        queryLength: String(query ?? '').length,
      });
      throw error;
    }
  }

  async function getByField(
    field: keyof TDoc & string,
    value: TDoc[keyof TDoc & string]
  ): Promise<TDoc[]> {
    try {
      validateFieldName(field, new Set(resource.allowedColumns));
      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        field
      )} = $1`;
      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [value]),
        'postgres.getByField'
      );
      return (result?.rows ?? []) as TDoc[];
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.getByField', {
        resourceType,
        tableName: resource.tableName,
        field,
      });
      throw error;
    }
  }

  async function count(filters: unknown = {}): Promise<number> {
    try {
      const where = buildWhereClause(resource, filters, 1);
      const sql = `SELECT COUNT(*)::int AS total FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text}`;
      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, where.values),
        'postgres.count'
      );
      return Number((result?.rows?.[0] as any)?.total ?? 0) || 0;
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.count', {
        resourceType,
        tableName: resource.tableName,
      });
      throw error;
    }
  }

  async function exists(id: string | number): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 LIMIT 1`;
      const result = await safeDbOperationPostgres(() => resource.pool.query(sql, [id]), 'postgres.exists');
      return Boolean(result?.rows?.length);
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.exists', {
        resourceType,
        tableName: resource.tableName,
        id,
      });
      throw error;
    }
  }

  async function bulkCreate(items: Array<Partial<TDoc>>): Promise<
    Array<{ success: boolean; data?: TDoc; error?: string; input: Partial<TDoc> }>
  > {
    try {
      const results: Array<{ success: boolean; data?: TDoc; error?: string; input: Partial<TDoc> }> = [];
      for (const item of items) {
        try {
          const created = await create(item);
          results.push({ success: true, data: created, input: item });
        } catch (error) {
          results.push({
            success: false,
            error: (error as Error).message,
            input: item,
          });
        }
      }
      return results;
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.bulkCreate', {
        resourceType,
        itemCount: items.length,
      });
      throw error;
    }
  }

  async function upsert(query: unknown, data: Partial<TDoc>): Promise<TDoc> {
    try {
      const where = buildWhereClause(resource, query, 1);
      if (!where.text) {
        throw new Error('upsert requires a non-empty query filter');
      }

      const findSql = `SELECT ${quoteSqlIdentifier(resource.idColumn)} AS id FROM ${quoteSqlIdentifier(
        resource.tableName
      )} ${where.text} LIMIT 1`;

      const existing = await safeDbOperationPostgres(
        () => resource.pool.query(findSql, where.values),
        'postgres.upsert.find'
      );

      const existingId = (existing?.rows?.[0] as any)?.id as string | number | undefined;
      if (existingId !== undefined && existingId !== null) {
        return await update(existingId, data);
      }

      return await create({ ...(isPlainObject(query) ? (query as Partial<TDoc>) : {}), ...data });
    } catch (error) {
      qerrors.qerrors(error as Error, 'postgres-crud-service-factory.upsert', {
        resourceType,
        tableName: resource.tableName,
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
 */
export function createPaginatedServicePostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  resourceType: string,
  options: PaginatedServiceOptions<TDoc> = {}
): (filters?: unknown, serviceOptions?: PaginationOptions) => Promise<PaginatedServiceResult<TDoc>> {
  const { defaultSort = { [resource.createdAtColumn]: -1 } as SortDefinition, defaultLimit = 50, resultEnhancer, additionalData } = options;

  return async function getPaginatedResources(
    filters: unknown = {},
    serviceOptions: PaginationOptions = {}
  ): Promise<PaginatedServiceResult<TDoc>> {
    const { page = 1, limit = defaultLimit, sort = defaultSort } = serviceOptions;
    const skip = (page - 1) * limit;

    const where = buildWhereClause(resource, filters, 1);
    const orderBy = buildOrderByClause(resource, sort as any);

    const dataSql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} ${orderBy} LIMIT $${
      where.nextParamIndex
    } OFFSET $${where.nextParamIndex + 1}`;
    const countSql = `SELECT COUNT(*)::int AS total FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text}`;

    const [resources, countResult] = await Promise.all([
      safeDbOperationPostgres(
        () => resource.pool.query(dataSql, [...where.values, limit, skip]),
        'postgres.createPaginatedService.data'
      ),
      safeDbOperationPostgres(
        () => resource.pool.query(countSql, where.values),
        'postgres.createPaginatedService.count'
      ),
    ]);

    const rows = (resources?.rows ?? []) as TDoc[];
    const enhanced = resultEnhancer ? await resultEnhancer(rows, filters) : rows;
    const totalCount = Number((countResult?.rows?.[0] as any)?.total ?? 0) || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const hasMore = page < totalPages;

    const response: PaginatedServiceResult<TDoc> = {
      [resourceType]: enhanced,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore,
    };

    if (additionalData) {
      const extra = await additionalData(filters, enhanced);
      Object.assign(response, extra);
    }

    return response;
  };
}

/**
 * Create service with validation rules (reuses shared validateData helper).
 */
export function createValidatedServicePostgres<TDoc extends DocumentShape>(
  resource: PostgresResource,
  resourceType: string,
  validationRules: ValidationRules<TDoc> = {}
): CrudService<TDoc> {
  return createCrudServicePostgres(resource, resourceType, {
    async beforeCreate(data) {
      validateData(data, validationRules);
      return data;
    },
    async beforeUpdate(data, existing) {
      validateData({ ...(existing as Partial<TDoc>), ...data }, validationRules, true);
      return data;
    },
  });
}

export { createDuplicateError, escapeRegex, validateData };

