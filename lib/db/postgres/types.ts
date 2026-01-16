/**
 * PostgreSQL adapter types
 *
 * Defines minimal interfaces used by the PostgreSQL implementation so the
 * library can work with:
 * - `pg.Pool` / `pg.Client` (node-postgres)
 * - `pg-mem` adapters in tests
 * - Any pool/client with a compatible `query()` surface
 */

import { assertSafeSqlIdentifier } from './identifiers.js';

export type SqlDirection = 'ASC' | 'DESC';

export interface PostgresQueryResult<Row extends Record<string, unknown> = Record<string, unknown>> {
  rows: Row[];
  rowCount?: number | null;
}

export interface PostgresClientLike {
  query: (text: string, params?: unknown[]) => Promise<PostgresQueryResult>;
}

export interface PostgresPoolClientLike extends PostgresClientLike {
  release: (releaseError?: unknown) => void;
}

export interface PostgresPoolLike extends PostgresClientLike {
  connect: () => Promise<PostgresPoolClientLike>;
}

export interface PostgresResourceConfig {
  pool: PostgresPoolLike;
  tableName: string;
  allowedColumns: ReadonlyArray<string> | ReadonlySet<string>;
  idColumn?: string;
  ownerColumn?: string;
  createdAtColumn?: string;
  deletedColumn?: string;
  deletedAtColumn?: string;
}

/**
 * A strongly validated, security-aware handle to a PostgreSQL table.
 *
 * Rationale:
 * - Centralizes table metadata and allowed identifiers to prevent SQL injection
 *   when building dynamic queries (sorting, selection, filters).
 * - Provides a consistent "model-like" handle for PostgreSQL CRUD functions.
 */
export interface PostgresResource {
  pool: PostgresPoolLike;
  tableName: string;
  idColumn: string;
  ownerColumn: string;
  createdAtColumn: string;
  deletedColumn: string;
  deletedAtColumn: string;
  allowedColumns: ReadonlySet<string>;
}

/**
 * Creates a validated PostgresResource from a config object.
 * @param config Resource configuration (table + allowlist + pool).
 * @returns PostgresResource with normalized defaults and validated identifiers.
 * @throws Error when required fields are missing or identifiers are unsafe.
 */
export function createPostgresResource(config: PostgresResourceConfig): PostgresResource {
  if (!config || typeof config !== 'object') {
    throw new Error('PostgresResource config is required');
  }
  if (!config.pool || typeof config.pool.query !== 'function' || typeof config.pool.connect !== 'function') {
    throw new Error('PostgresResource requires a pool with query() and connect()');
  }

  const tableName = assertSafeSqlIdentifier(config.tableName, 'PostgresResource.tableName'); // Validate identifiers up-front for safety.
  const idColumn = assertSafeSqlIdentifier(config.idColumn ?? 'id', 'PostgresResource.idColumn');
  const ownerColumn = assertSafeSqlIdentifier(config.ownerColumn ?? 'user', 'PostgresResource.ownerColumn');
  const createdAtColumn = assertSafeSqlIdentifier(
    config.createdAtColumn ?? 'createdAt',
    'PostgresResource.createdAtColumn'
  );
  const deletedColumn = assertSafeSqlIdentifier(
    config.deletedColumn ?? 'deleted',
    'PostgresResource.deletedColumn'
  );
  const deletedAtColumn = assertSafeSqlIdentifier(
    config.deletedAtColumn ?? 'deletedAt',
    'PostgresResource.deletedAtColumn'
  );

  const allowedColumns = new Set<string>(
    Array.isArray(config.allowedColumns) ? config.allowedColumns : Array.from(config.allowedColumns)
  );

  // Ensure allowlist contains critical columns used by core operations.
  allowedColumns.add(idColumn); // Needed for by-id operations and updates.
  allowedColumns.add(ownerColumn); // Needed for ownership enforcement.
  allowedColumns.add(createdAtColumn); // Used by pagination/date range helpers.
  allowedColumns.add(deletedColumn); // Used by soft-delete helpers.
  allowedColumns.add(deletedAtColumn); // Used by soft-delete helpers.

  for (const col of allowedColumns) {
    assertSafeSqlIdentifier(col, 'PostgresResource.allowedColumns'); // Validate every allowlisted identifier.
  }

  return {
    pool: config.pool,
    tableName,
    idColumn,
    ownerColumn,
    createdAtColumn,
    deletedColumn,
    deletedAtColumn,
    allowedColumns,
  };
}

