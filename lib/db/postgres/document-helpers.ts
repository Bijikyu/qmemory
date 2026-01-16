/**
 * PostgreSQL document helpers
 *
 * Provides Postgres equivalents of `lib/document-helpers.ts` using a validated
 * PostgresResource (table + allowlisted columns + pool).
 *
 * Notes on parity:
 * - Mongo helpers return Mongoose documents; Postgres helpers return plain row objects.
 * - Filters support a constrained subset via `buildWhereClause()` for safety.
 */

import { createModuleUtilities } from '../../common-patterns.js';
import { quoteSqlIdentifier } from './identifiers.js';
import { buildOrderByClause, buildSelectClause, buildWhereClause } from './filters.js';
import { safeDbOperationPostgres } from './database-utils.js';
import type { PostgresPoolClientLike, PostgresResource } from './types.js';

const utils = createModuleUtilities('postgres-document-helpers');

type AnyRow = Record<string, unknown>;
type DocumentId = string | number;

type FindDocumentsOptions = {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  select?: string[] | string;
};

type BulkUpdateInstruction = {
  filter: unknown;
  data: Record<string, unknown>;
};

type RelatedDeleteInstruction = {
  resource: PostgresResource;
  foreignKeyColumn: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertResource(resource: PostgresResource, functionName: string): void {
  if (!resource?.pool) {
    throw new Error(`${functionName} requires a PostgresResource`);
  }
}

function assertUpdatePayload(resource: PostgresResource, updates: Record<string, unknown>): void {
  for (const key of Object.keys(updates)) {
    if (!resource.allowedColumns.has(key)) {
      throw new Error(`Update field "${key}" is not allowlisted for table "${resource.tableName}"`);
    }
    if (key === resource.idColumn) {
      throw new Error(`Refusing to update id column "${resource.idColumn}"`);
    }
  }
}

function buildSetClause(
  resource: PostgresResource,
  updates: Record<string, unknown>,
  startingParamIndex: number
): { setSql: string; values: unknown[]; nextParamIndex: number } {
  if (!Object.keys(updates).length) {
    throw new Error('Update payload must not be empty');
  }

  assertUpdatePayload(resource, updates); // Validate identifiers before building SQL.

  const parts: string[] = [];
  const values: unknown[] = [];
  let next = startingParamIndex;

  for (const [key, value] of Object.entries(updates)) {
    parts.push(`${quoteSqlIdentifier(key)} = $${next}`);
    values.push(value);
    next++;
  }

  return { setSql: `SET ${parts.join(', ')}`, values, nextParamIndex: next };
}

function escapeLikePattern(value: string): string {
  // Escape LIKE wildcards to prevent user-controlled patterns from exploding scans.
  return value.replace(/([\\\\%_])/g, '\\\\$1');
}

export async function findDocumentByIdPostgres(
  resource: PostgresResource,
  id: DocumentId
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'findDocumentByIdPostgres');

      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 LIMIT 1`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id]),
        'findDocumentByIdPostgres'
      );

      return result?.rows?.[0] ?? null;
    },
    'findDocumentByIdPostgres',
    { tableName: resource.tableName }
  );
}

export async function updateDocumentByIdPostgres(
  resource: PostgresResource,
  id: DocumentId,
  updates: Record<string, unknown>
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'updateDocumentByIdPostgres');
      if (!isPlainObject(updates)) throw new Error('updates must be an object');

      const set = buildSetClause(resource, updates, 2);

      const sql = `UPDATE ${quoteSqlIdentifier(resource.tableName)} ${set.setSql} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 RETURNING *`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id, ...set.values]),
        'updateDocumentByIdPostgres'
      );

      return result?.rows?.[0] ?? null;
    },
    'updateDocumentByIdPostgres',
    { tableName: resource.tableName, id }
  );
}

export async function deleteDocumentByIdPostgres(
  resource: PostgresResource,
  id: DocumentId
): Promise<boolean> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'deleteDocumentByIdPostgres');

      const sql = `DELETE FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id]),
        'deleteDocumentByIdPostgres'
      );

      return Boolean(result?.rowCount && result.rowCount > 0);
    },
    'deleteDocumentByIdPostgres',
    { tableName: resource.tableName, id }
  );
}

export async function cascadeDeleteDocumentPostgres(
  resource: PostgresResource,
  id: DocumentId,
  relatedResources: RelatedDeleteInstruction[] = []
): Promise<boolean> {
  const log = utils.getFunctionLogger('cascadeDeleteDocumentPostgres');
  log.entry({ tableName: resource.tableName, id, relatedCount: relatedResources.length });

  assertResource(resource, 'cascadeDeleteDocumentPostgres');

  let client: PostgresPoolClientLike | null = null;
  try {
    client = await resource.pool.connect(); // Single connection so deletes can be made atomic.
    await client.query('BEGIN');

    const exists = await client.query(
      `SELECT 1 FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 LIMIT 1`,
      [id]
    );
    if (!exists.rows?.length) {
      await client.query('ROLLBACK');
      return false;
    }

    for (const related of relatedResources) {
      assertResource(related.resource, 'cascadeDeleteDocumentPostgres.related');
      if (!related.resource.allowedColumns.has(related.foreignKeyColumn)) {
        throw new Error(
          `Related foreignKeyColumn "${related.foreignKeyColumn}" is not allowlisted for "${related.resource.tableName}"`
        );
      }
      await client.query(
        `DELETE FROM ${quoteSqlIdentifier(related.resource.tableName)} WHERE ${quoteSqlIdentifier(
          related.foreignKeyColumn
        )} = $1`,
        [id]
      );
    }

    const deleted = await client.query(
      `DELETE FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1`,
      [id]
    );

    await client.query('COMMIT');
    return Boolean(deleted.rowCount && deleted.rowCount > 0);
  } catch (error) {
    try {
      client && (await client.query('ROLLBACK'));
    } catch (rollbackError) {
      utils.logError(rollbackError as Error, 'cascadeDeleteDocumentPostgres.rollback', {
        originalError: (error as Error).message,
      });
    }
    utils.logError(error as Error, 'cascadeDeleteDocumentPostgres', { tableName: resource.tableName, id });
    return false;
  } finally {
    try {
      client && client.release();
    } catch (releaseError) {
      utils.logError(releaseError as Error, 'cascadeDeleteDocumentPostgres.release', {
        tableName: resource.tableName,
      });
    }
  }
}

export async function createDocumentPostgres(
  resource: PostgresResource,
  data: Record<string, unknown>
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'createDocumentPostgres');
      if (!isPlainObject(data)) throw new Error('data must be an object');

      const keys = Object.keys(data);
      if (!keys.length) throw new Error('createDocumentPostgres requires non-empty data');

      for (const key of keys) {
        if (!resource.allowedColumns.has(key)) {
          throw new Error(`Insert field "${key}" is not allowlisted for table "${resource.tableName}"`);
        }
      }

      const columnsSql = keys.map(k => quoteSqlIdentifier(k)).join(', ');
      const placeholdersSql = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => data[k]);

      const sql = `INSERT INTO ${quoteSqlIdentifier(resource.tableName)} (${columnsSql}) VALUES (${placeholdersSql}) RETURNING *`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, values),
        'createDocumentPostgres'
      );

      return result?.rows?.[0] ?? null;
    },
    'createDocumentPostgres',
    { tableName: resource.tableName, dataKeys: Object.keys(data ?? {}) }
  );
}

export async function findDocumentsPostgres(
  resource: PostgresResource,
  filter: unknown = {},
  options: FindDocumentsOptions = {}
): Promise<AnyRow[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'findDocumentsPostgres');
      const where = buildWhereClause(resource, filter, 1);
      const orderBy = buildOrderByClause(resource, options.sort);
      const select = buildSelectClause(resource, options.select);

      const params: unknown[] = [...where.values];
      let next = where.nextParamIndex;

      let limitOffsetSql = '';
      if (options.limit !== undefined) {
        limitOffsetSql += ` LIMIT $${next}`;
        params.push(options.limit);
        next++;
      }
      if (options.skip !== undefined) {
        limitOffsetSql += ` OFFSET $${next}`;
        params.push(options.skip);
        next++;
      }

      const sql = `SELECT ${select} FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} ${orderBy} ${limitOffsetSql}`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, params),
        'findDocumentsPostgres'
      );

      return (result?.rows ?? []) as AnyRow[];
    },
    'findDocumentsPostgres',
    { tableName: resource.tableName }
  );
}

export async function findOneDocumentPostgres(
  resource: PostgresResource,
  filter: unknown = {},
  options: { select?: string[] | string } = {}
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'findOneDocumentPostgres');
      const where = buildWhereClause(resource, filter, 1);
      const select = buildSelectClause(resource, options.select);

      const sql = `SELECT ${select} FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} LIMIT 1`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, where.values),
        'findOneDocumentPostgres'
      );

      return result?.rows?.[0] ?? null;
    },
    'findOneDocumentPostgres',
    { tableName: resource.tableName }
  );
}

export async function bulkUpdateDocumentsPostgres(
  resource: PostgresResource,
  updates: Array<BulkUpdateInstruction>
): Promise<Array<{ matchedCount: number; modifiedCount: number }> | null> {
  return (
    utils.safeAsync(
      async () => {
        assertResource(resource, 'bulkUpdateDocumentsPostgres');

        const results = await Promise.all(
          updates.map(async instruction => {
            if (!isPlainObject(instruction.data)) throw new Error('bulk update data must be an object');
            const where = buildWhereClause(resource, instruction.filter, 1);
            if (!where.text) throw new Error('bulk update requires a non-empty filter');
            const set = buildSetClause(resource, instruction.data, where.nextParamIndex);

            const sql = `UPDATE ${quoteSqlIdentifier(resource.tableName)} ${set.setSql} ${where.text}`;
            const params = [...where.values, ...set.values];

            const result = await safeDbOperationPostgres(
              () => resource.pool.query(sql, params),
              'bulkUpdateDocumentsPostgres.update'
            );

            const rowCount = result?.rowCount ?? 0;
            return { matchedCount: rowCount, modifiedCount: rowCount };
          })
        );

        return results;
      },
      'bulkUpdateDocumentsPostgres',
      { tableName: resource.tableName, updateCount: updates.length }
    ) || null
  );
}

export async function findManyByFieldIgnoreCasePostgres(
  resource: PostgresResource,
  field: string,
  value: string,
  options: { limit?: number; sort?: Record<string, 1 | -1> } = {}
): Promise<AnyRow[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'findManyByFieldIgnoreCasePostgres');
      if (!resource.allowedColumns.has(field)) {
        throw new Error(`Field "${field}" is not allowlisted for "${resource.tableName}"`);
      }

      const { limit = 50, sort = { [resource.createdAtColumn]: -1 } } = options;
      const orderBy = buildOrderByClause(resource, sort);

      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} WHERE LOWER(${quoteSqlIdentifier(
        field
      )}) = LOWER($1) ${orderBy} LIMIT $2`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [value, limit]),
        'findManyByFieldIgnoreCasePostgres'
      );

      return (result?.rows ?? []) as AnyRow[];
    },
    'findManyByFieldIgnoreCasePostgres',
    { tableName: resource.tableName, field }
  );
}

export async function existsByFieldPostgres(
  resource: PostgresResource,
  field: string,
  value: unknown
): Promise<boolean> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'existsByFieldPostgres');
      if (!resource.allowedColumns.has(field)) {
        throw new Error(`Field "${field}" is not allowlisted for "${resource.tableName}"`);
      }

      const sql = `SELECT 1 FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        field
      )} = $1 LIMIT 1`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [value]),
        'existsByFieldPostgres'
      );

      return Boolean(result?.rows?.length);
    },
    'existsByFieldPostgres',
    { tableName: resource.tableName, field }
  );
}

export async function getDistinctValuesPostgres(
  resource: PostgresResource,
  field: string,
  filters: unknown = {}
): Promise<unknown[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'getDistinctValuesPostgres');
      if (!resource.allowedColumns.has(field)) {
        throw new Error(`Field "${field}" is not allowlisted for "${resource.tableName}"`);
      }

      const where = buildWhereClause(resource, filters, 1);
      const sql = `SELECT DISTINCT ${quoteSqlIdentifier(field)} AS value FROM ${quoteSqlIdentifier(
        resource.tableName
      )} ${where.text}`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, where.values),
        'getDistinctValuesPostgres'
      );

      return (result?.rows ?? []).map(r => (r as AnyRow).value);
    },
    'getDistinctValuesPostgres',
    { tableName: resource.tableName, field }
  );
}

export async function bulkDeleteDocumentsPostgres(
  resource: PostgresResource,
  filters: unknown
): Promise<{ deletedCount: number }> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'bulkDeleteDocumentsPostgres');
      const where = buildWhereClause(resource, filters, 1);
      if (!where.text) throw new Error('bulkDeleteDocumentsPostgres requires a non-empty filter');

      const sql = `DELETE FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text}`;
      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, where.values),
        'bulkDeleteDocumentsPostgres'
      );

      return { deletedCount: result?.rowCount ?? 0 };
    },
    'bulkDeleteDocumentsPostgres',
    { tableName: resource.tableName }
  );
}

export type PostgresAggregateQuery = { sql: string; params?: unknown[] } | string;

export async function aggregateDocumentsPostgres(
  resource: PostgresResource,
  query: PostgresAggregateQuery
): Promise<unknown[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'aggregateDocumentsPostgres');

      const sql = typeof query === 'string' ? query : query.sql;
      const params = typeof query === 'string' ? [] : (query.params ?? []);

      if (!sql || typeof sql !== 'string') throw new Error('aggregateDocumentsPostgres requires a SQL string');

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, params),
        'aggregateDocumentsPostgres'
      );

      return result?.rows ?? [];
    },
    'aggregateDocumentsPostgres',
    { tableName: resource.tableName }
  );
}

export async function getByDateRangePostgres(
  resource: PostgresResource,
  dateField: string,
  startDate: Date,
  endDate: Date,
  additionalFilters: unknown = {}
): Promise<AnyRow[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'getByDateRangePostgres');
      if (!resource.allowedColumns.has(dateField)) {
        throw new Error(`dateField "${dateField}" is not allowlisted for "${resource.tableName}"`);
      }

      const filters = {
        ...(isPlainObject(additionalFilters) ? additionalFilters : {}),
        [dateField]: { $gte: startDate, $lte: endDate },
      };

      const where = buildWhereClause(resource, filters, 1);
      const orderBy = `ORDER BY ${quoteSqlIdentifier(dateField)} DESC`;

      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} ${orderBy}`;
      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, where.values),
        'getByDateRangePostgres'
      );

      return (result?.rows ?? []) as AnyRow[];
    },
    'getByDateRangePostgres',
    { tableName: resource.tableName, dateField }
  );
}

export async function softDeleteDocumentPostgres(
  resource: PostgresResource,
  id: DocumentId
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'softDeleteDocumentPostgres');

      const sql = `UPDATE ${quoteSqlIdentifier(resource.tableName)} SET ${quoteSqlIdentifier(
        resource.deletedColumn
      )} = TRUE, ${quoteSqlIdentifier(resource.deletedAtColumn)} = NOW() WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 RETURNING *`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id]),
        'softDeleteDocumentPostgres'
      );

      return result?.rows?.[0] ?? null;
    },
    'softDeleteDocumentPostgres',
    { tableName: resource.tableName, id }
  );
}

export async function getActiveDocumentsPostgres(
  resource: PostgresResource,
  filters: unknown = {}
): Promise<AnyRow[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'getActiveDocumentsPostgres');

      const merged = {
        ...(isPlainObject(filters) ? filters : {}),
        [resource.deletedColumn]: { $ne: true },
      };

      const where = buildWhereClause(resource, merged, 1);
      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text}`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, where.values),
        'getActiveDocumentsPostgres'
      );

      return (result?.rows ?? []) as AnyRow[];
    },
    'getActiveDocumentsPostgres',
    { tableName: resource.tableName }
  );
}

export async function textSearchDocumentsPostgres(
  resource: PostgresResource,
  query: string,
  searchFields: string[],
  options: { limit?: number; page?: number } = {}
): Promise<AnyRow[]> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'textSearchDocumentsPostgres');
      const { limit = 50, page = 1 } = options;
      const skip = (page - 1) * limit;

      const safeFields = searchFields.filter(field => resource.allowedColumns.has(field));
      if (!safeFields.length) {
        throw new Error('textSearchDocumentsPostgres requires at least one allowlisted search field');
      }

      const escaped = escapeLikePattern(String(query ?? ''));
      const pattern = `%${escaped}%`;

      const orParts = safeFields.map((field, i) => `${quoteSqlIdentifier(field)} ILIKE $${i + 1} ESCAPE '\\\\'`);
      const params: unknown[] = Array(safeFields.length).fill(pattern);
      params.push(limit, skip);

      const sql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} WHERE (${orParts.join(
        ' OR '
      )}) ORDER BY ${quoteSqlIdentifier(resource.createdAtColumn)} DESC LIMIT $${
        safeFields.length + 1
      } OFFSET $${safeFields.length + 2}`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, params),
        'textSearchDocumentsPostgres'
      );

      return (result?.rows ?? []) as AnyRow[];
    },
    'textSearchDocumentsPostgres',
    { tableName: resource.tableName, searchFieldCount: searchFields.length }
  );
}

export async function getPaginatedDocumentsPostgres(
  resource: PostgresResource,
  filters: unknown = {},
  pagination: { page?: number; limit?: number } = {},
  sort: Record<string, 1 | -1> = { [resource.createdAtColumn]: -1 }
): Promise<{
  data: AnyRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  return utils.safeAsync(
    async () => {
      assertResource(resource, 'getPaginatedDocumentsPostgres');

      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const where = buildWhereClause(resource, filters, 1);
      const orderBy = buildOrderByClause(resource, sort);

      const dataSql = `SELECT * FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} ${orderBy} LIMIT $${
        where.nextParamIndex
      } OFFSET $${where.nextParamIndex + 1}`;

      const countSql = `SELECT COUNT(*)::int AS total FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text}`;

      const [dataResult, countResult] = await Promise.all([
        safeDbOperationPostgres(
          () => resource.pool.query(dataSql, [...where.values, limit, skip]),
          'getPaginatedDocumentsPostgres.find'
        ),
        safeDbOperationPostgres(
          () => resource.pool.query(countSql, where.values),
          'getPaginatedDocumentsPostgres.count'
        ),
      ]);

      const total = (countResult?.rows?.[0] as AnyRow | undefined)?.total ?? 0;

      return {
        data: (dataResult?.rows ?? []) as AnyRow[],
        pagination: {
          page,
          limit,
          total: Number(total) || 0,
          pages: Math.ceil((Number(total) || 0) / limit),
        },
      };
    },
    'getPaginatedDocumentsPostgres',
    { tableName: resource.tableName }
  );
}

