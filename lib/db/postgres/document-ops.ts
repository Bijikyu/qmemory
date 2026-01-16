/**
 * PostgreSQL user-owned document operations (security layer)
 *
 * Postgres equivalents of `lib/document-ops.ts` that enforce ownership in SQL
 * queries (`WHERE ownerColumn = $n`) to prevent cross-user data access.
 *
 * 🚩AI: ENTRY_POINT_FOR_USER_DOCUMENT_OPERATIONS_POSTGRES
 */

import type { Response } from 'express';
import { sendNotFound } from '../../http-utils.js';
import { createModuleUtilities } from '../../common-patterns.js';
import { ErrorFactory } from '../../core/centralized-errors.js';
import { quoteSqlIdentifier } from './identifiers.js';
import { buildOrderByClause, buildSelectClause, buildWhereClause } from './filters.js';
import { ensureUniquePostgres, safeDbOperationPostgres } from './database-utils.js';
import type { PostgresResource } from './types.js';

const utils = createModuleUtilities('postgres-document-ops');

type AnyRow = Record<string, unknown>;
type DocumentId = string | number;

/**
 * Sanitizes username for consistent querying/logging.
 * @param username Raw username.
 * @returns Sanitized username string.
 */
function sanitizeUsername(username: string): string {
  // Strip characters that commonly show up in injection payloads and log pollution attempts.
  return String(username).replace(/[$\.\[\]]/g, '').trim();
}

/**
 * Validates username against security requirements.
 * @param username Username to validate.
 * @returns True when username meets constraints.
 */
function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(username) && username.length > 0 && username.length <= 50;
}

/**
 * Validates and sanitizes username input.
 * @param username Raw username.
 * @param functionName Caller name for error messages.
 * @returns Sanitized username.
 */
function validateAndSanitizeUsername(username: string, functionName: string): string {
  if (!username || typeof username !== 'string') {
    throw new Error(`Invalid username: must be a non-empty string in ${functionName}`);
  }
  if (!isValidUsername(username)) {
    throw new Error(
      `Invalid username format in ${functionName}: only alphanumeric, underscore, hyphen; max 50`
    );
  }
  return sanitizeUsername(username);
}

/**
 * Generic user-scoped operation wrapper.
 * @param resource PostgresResource for the target table.
 * @param id Document identifier.
 * @param username Owner username.
 * @param opCallback Callback executed with validated parameters.
 * @returns Document row or null.
 */
export async function performUserDocOpPostgres(
  resource: PostgresResource,
  id: DocumentId,
  username: string,
  opCallback: (resource: PostgresResource, scopedId: DocumentId, scopedUsername: string) => Promise<AnyRow | null>
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'performUserDocOpPostgres');
      return await opCallback(resource, id, sanitizedUsername);
    },
    'performUserDocOpPostgres',
    { tableName: resource.tableName, id, username }
  );
}

export async function findUserDocPostgres(
  resource: PostgresResource,
  id: DocumentId,
  username: string,
  options: { select?: string[] | string } = {}
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'findUserDocPostgres');
      const select = buildSelectClause(resource, options.select);

      const sql = `SELECT ${select} FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 AND ${quoteSqlIdentifier(resource.ownerColumn)} = $2 LIMIT 1`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id, sanitizedUsername]),
        'findUserDocPostgres'
      );

      if (!result) {
        // Rationale: `safeDbOperationPostgres()` returns null on DB errors/timeouts; returning `null` here would
        // incorrectly look like "not found" and could cause callers (e.g. `userDocActionOr404Postgres`) to send 404s.
        throw new Error('Database operation failed in findUserDocPostgres');
      }
      return result?.rows?.[0] ?? null;
    },
    'findUserDocPostgres',
    { tableName: resource.tableName, id }
  );
}

export async function deleteUserDocPostgres(
  resource: PostgresResource,
  id: DocumentId,
  username: string
): Promise<AnyRow | null> {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'deleteUserDocPostgres');

      const sql = `DELETE FROM ${quoteSqlIdentifier(resource.tableName)} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 AND ${quoteSqlIdentifier(resource.ownerColumn)} = $2 RETURNING *`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id, sanitizedUsername]),
        'deleteUserDocPostgres'
      );

      if (!result) {
        // Rationale: do not convert DB failures into "not found" semantics.
        throw new Error('Database operation failed in deleteUserDocPostgres');
      }
      return result?.rows?.[0] ?? null;
    },
    'deleteUserDocPostgres',
    { tableName: resource.tableName, id }
  );
}

export async function userDocActionOr404Postgres(
  resource: PostgresResource,
  id: DocumentId,
  user: string,
  res: Response,
  action: (resource: PostgresResource, scopedId: DocumentId, scopedUsername: string) => Promise<AnyRow | null>,
  msg: string
): Promise<AnyRow | undefined> {
  return utils.safeAsync(
    async () => {
      const sanitizedUser = validateAndSanitizeUsername(user, 'userDocActionOr404Postgres');
      const doc = await action(resource, id, sanitizedUser);
      if (doc == null) {
        sendNotFound(res, msg);
        return undefined;
      }
      return doc;
    },
    'userDocActionOr404Postgres',
    { tableName: resource.tableName, id, user }
  );
}

export async function fetchUserDocOr404Postgres(
  resource: PostgresResource,
  id: DocumentId,
  user: string,
  res: Response,
  msg: string,
  options: { select?: string[] | string } = {}
): Promise<AnyRow | undefined> {
  return utils.safeAsync(
    async () => {
      const sanitizedUser = validateAndSanitizeUsername(user, 'fetchUserDocOr404Postgres');
      const doc = await findUserDocPostgres(resource, id, sanitizedUser, options);
      if (!doc) {
        sendNotFound(res, msg);
        return undefined;
      }
      return doc;
    },
    'fetchUserDocOr404Postgres',
    { tableName: resource.tableName, id, user }
  );
}

export async function deleteUserDocOr404Postgres(
  resource: PostgresResource,
  id: DocumentId,
  user: string,
  res: Response,
  msg: string
): Promise<AnyRow | undefined> {
  return utils.safeAsync(
    async () => {
      const sanitizedUser = validateAndSanitizeUsername(user, 'deleteUserDocOr404Postgres');
      const doc = await deleteUserDocPostgres(resource, id, sanitizedUser);
      if (!doc) {
        sendNotFound(res, msg);
        return undefined;
      }
      return doc;
    },
    'deleteUserDocOr404Postgres',
    { tableName: resource.tableName, id, user }
  );
}

export async function listUserDocsLeanPostgres(
  resource: PostgresResource,
  username: string,
  options: { sort?: Record<string, 1 | -1>; select?: string[] | string; limit?: number; skip?: number } = {}
): Promise<AnyRow[]> {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'listUserDocsLeanPostgres');
      const select = buildSelectClause(resource, options.select);

      const where = buildWhereClause(
        resource,
        { [resource.ownerColumn]: sanitizedUsername },
        1
      );

      const sort = options.sort ?? { [resource.createdAtColumn]: -1 };
      const orderBy = buildOrderByClause(resource, sort); // Enforce allowlist to prevent ORDER BY identifier injection.

      const maxLimit = 1000;
      const defaultLimit = 100;
      const limit = options.limit ? Math.min(options.limit, maxLimit) : defaultLimit;
      const skip = options.skip ?? 0;

      const sql = `SELECT ${select} FROM ${quoteSqlIdentifier(resource.tableName)} ${where.text} ${orderBy} LIMIT $${
        where.nextParamIndex
      } OFFSET $${where.nextParamIndex + 1}`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [...where.values, limit, skip]),
        'listUserDocsLeanPostgres'
      );

      if (!result) {
        // Rationale: callers expect errors to surface; returning an empty list here would be a misleading success.
        throw new Error('Database operation failed in listUserDocsLeanPostgres');
      }
      return (result?.rows ?? []) as AnyRow[];
    },
    'listUserDocsLeanPostgres',
    { tableName: resource.tableName }
  );
}

export async function validateDocumentUniquenessPostgres(
  resource: PostgresResource,
  uniqueFilter: unknown,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> {
  return ensureUniquePostgres(resource, uniqueFilter, res, duplicateMsg);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function hasUniqueFieldChangesPostgres(
  existing: AnyRow,
  fieldsToUpdate: Record<string, unknown>,
  uniqueFilter: unknown
): boolean {
  // If we cannot confidently inspect filter shape, assume changes could affect uniqueness.
  if (!isPlainObject(uniqueFilter)) return true;

  return Object.keys(uniqueFilter).some(key => {
    if (key.startsWith('$')) return false; // Ignore logical operators for this heuristic.
    if (!(key in fieldsToUpdate)) return false;
    return existing[key] !== fieldsToUpdate[key];
  });
}

export async function createUniqueDocPostgres(
  resource: PostgresResource,
  fields: Record<string, unknown>,
  uniqueFilter: unknown,
  res: Response,
  duplicateMsg?: string
): Promise<AnyRow | undefined> {
  return utils.safeAsync(
    async () => {
      const isUnique = await validateDocumentUniquenessPostgres(resource, uniqueFilter, res, duplicateMsg);
      if (!isUnique) return undefined;

      const keys = Object.keys(fields ?? {});
      if (!keys.length) {
        throw new Error('createUniqueDocPostgres requires non-empty fields');
      }

      for (const key of keys) {
        if (!resource.allowedColumns.has(key)) {
          throw new Error(`Insert field "${key}" is not allowlisted for "${resource.tableName}"`);
        }
      }

      const columnsSql = keys.map(k => quoteSqlIdentifier(k)).join(', ');
      const placeholdersSql = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => fields[k]);

      const sql = `INSERT INTO ${quoteSqlIdentifier(resource.tableName)} (${columnsSql}) VALUES (${placeholdersSql}) RETURNING *`;
      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, values),
        'createUniqueDocPostgres',
        res
      );

      return result?.rows?.[0] ?? undefined;
    },
    'createUniqueDocPostgres',
    { tableName: resource.tableName }
  );
}

export async function updateUserDocPostgres(
  resource: PostgresResource,
  id: DocumentId,
  username: string,
  fieldsToUpdate: Record<string, unknown>,
  uniqueFilter: unknown | undefined,
  res: Response,
  duplicateMsg?: string
): Promise<AnyRow | undefined> {
  return utils.safeAsync(
    async () => {
      const sanitizedUsername = validateAndSanitizeUsername(username, 'updateUserDocPostgres');

      // Enforce ownership: do not allow changing the owner column via update payload.
      const updates: Record<string, unknown> = { ...(fieldsToUpdate ?? {}) };
      if (Object.prototype.hasOwnProperty.call(updates, resource.ownerColumn)) {
        delete updates[resource.ownerColumn]; // Rationale: ownership is a security invariant, never mutable via this helper.
      }

      const existing = await fetchUserDocOr404Postgres(
        resource,
        id,
        sanitizedUsername,
        res,
        'Document not found'
      );
      if (!existing) return undefined;

      if (uniqueFilter && hasUniqueFieldChangesPostgres(existing, updates, uniqueFilter)) {
        const uniqueWithExclusion = isPlainObject(uniqueFilter)
          ? { ...uniqueFilter, [resource.idColumn]: { $ne: id } }
          : uniqueFilter;
        const isStillUnique = await validateDocumentUniquenessPostgres(
          resource,
          uniqueWithExclusion,
          res,
          duplicateMsg
        );
        if (!isStillUnique) return undefined;
      }

      const keys = Object.keys(updates);
      if (!keys.length) {
        return existing; // No-op update: return existing for parity with Mongo behavior.
      }

      for (const key of keys) {
        if (!resource.allowedColumns.has(key)) {
          throw new Error(`Update field "${key}" is not allowlisted for "${resource.tableName}"`);
        }
        if (key === resource.idColumn) {
          throw new Error(`Refusing to update id column "${resource.idColumn}"`);
        }
      }

      const setParts = keys.map((k, i) => `${quoteSqlIdentifier(k)} = $${i + 3}`).join(', ');
      const values = keys.map(k => updates[k]);

      const sql = `UPDATE ${quoteSqlIdentifier(resource.tableName)} SET ${setParts} WHERE ${quoteSqlIdentifier(
        resource.idColumn
      )} = $1 AND ${quoteSqlIdentifier(resource.ownerColumn)} = $2 RETURNING *`;

      const result = await safeDbOperationPostgres(
        () => resource.pool.query(sql, [id, sanitizedUsername, ...values]),
        'updateUserDocPostgres',
        res
      );

      if (!result) {
        // Rationale: `safeDbOperationPostgres()` already emitted a sanitized error response via `res`; avoid sending 404
        // afterwards (double-send) and avoid implying "not found" on DB failure.
        return undefined;
      }
      const updated = result?.rows?.[0];
      if (!updated) {
        // If the row disappeared between fetch and update, return 404 to keep semantics consistent.
        sendNotFound(res, 'Document not found');
        return undefined;
      }
      return updated;
    },
    'updateUserDocPostgres',
    { tableName: resource.tableName, id, username }
  );
}

/**
 * Optional helper that throws a standardized internal error for unsupported Mongo-only functionality.
 * Rationale: some upstream code expects centralized errors from this module.
 */
export function assertPostgresUserDocSupport(feature: string): void {
  throw ErrorFactory.internalError(`Postgres user-doc feature not implemented: ${feature}`);
}
