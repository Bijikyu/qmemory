/**
 * PostgreSQL database utilities
 *
 * Provides Postgres equivalents for the library's Mongo-focused database utils:
 * - safeDbOperation
 * - retryDbOperation
 * - ensureUnique
 * - ensureIdempotency
 */

import type { Response } from 'express';
import { sendConflict } from '../../http-utils.js';
import { createModuleUtilities } from '../../common-patterns.js';
import { calculateBackoffDelay, safeDelay } from '../../core/secure-delay.js';
import { quoteSqlIdentifier } from './identifiers.js';
import { buildWhereClause } from './filters.js';
import type { PostgresResource, PostgresPoolLike } from './types.js';
import { handlePostgresError } from './errors.js';

const utils = createModuleUtilities('postgres-database-utils');

/**
 * Executes a Postgres operation with timeout protection and standardized error handling.
 * @param operation Async operation to execute.
 * @param operationName Descriptive name for logging and error reporting.
 * @param res Optional Express response for sending sanitized errors.
 * @param timeoutMs Timeout in milliseconds (default 30s).
 * @returns Operation result or null on failure.
 */
export async function safeDbOperationPostgres<TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  res: Response | null = null,
  timeoutMs: number = 30000
): Promise<TResult | null> {
  return utils
    .safeAsync(
      async () => {
        let timeoutId: NodeJS.Timeout | null = null;

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error(`Database operation timeout: ${operationName}`)),
            timeoutMs
          );
        });

        const result = await Promise.race([operation(), timeoutPromise]).finally(() => {
          timeoutId && clearTimeout(timeoutId); // Prevent timer leaks on completion.
        });

        return result;
      },
      'safeDbOperationPostgres',
      { operationName, timeoutMs, hasResponse: Boolean(res) }
    )
    .catch(error => {
      handlePostgresError(error, res, operationName);
      return null;
    });
}

/**
 * Retries Postgres operations with exponential backoff and jitter.
 * @param operation Operation to retry.
 * @param operationName Name used for logging.
 * @param maxRetries Maximum number of attempts.
 * @param baseDelayMs Base delay for backoff.
 * @returns Operation result or null on failure.
 */
export async function retryDbOperationPostgres<TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<TResult | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      utils.debugLog('retryDbOperationPostgres attempt', { attempt, maxRetries, operationName });
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt >= maxRetries) break;

      const delay = calculateBackoffDelay(baseDelayMs, attempt); // Uses jittered backoff for better scaling under contention.
      await safeDelay(delay);
    }
  }

  lastError && handlePostgresError(lastError, null, operationName);
  return null;
}

/**
 * Ensures uniqueness by checking for an existing row matching the provided filter.
 * @param resource PostgresResource describing the table and allowlisted columns.
 * @param filter Filter (supports the constrained filter operators in filters.ts).
 * @param res Express response for emitting 409 conflicts.
 * @param duplicateMsg Optional message for clients.
 * @returns True when unique, false when a duplicate exists (and response was sent).
 */
export async function ensureUniquePostgres(
  resource: PostgresResource,
  filter: unknown,
  res: Response,
  duplicateMsg?: string
): Promise<boolean> {
  return (
    utils.safeAsync(
      async () => {
        const where = buildWhereClause(resource, filter, 1);
        if (!where.text) {
          throw new Error('ensureUniquePostgres requires a non-empty filter');
        }

        const sql = `SELECT ${quoteSqlIdentifier(resource.idColumn)} AS id FROM ${quoteSqlIdentifier(
          resource.tableName
        )} ${where.text} LIMIT 1`;

        const result = await resource.pool.query(sql, where.values);
        const exists = Array.isArray(result.rows) && result.rows.length > 0;
        if (exists) {
          sendConflict(res, duplicateMsg ?? 'Resource already exists');
          return false;
        }

        return true;
      },
      'ensureUniquePostgres',
      { tableName: resource.tableName, hasDuplicateMsg: duplicateMsg !== undefined }
    ) || false
  );
}

export interface PostgresIdempotencyConfig {
  pool: PostgresPoolLike;
  tableName?: string;
  keyColumn?: string;
  resultColumn?: string;
  createdAtColumn?: string;
}

/**
 * Postgres idempotency helper.
 *
 * Requires an idempotency table with a UNIQUE constraint on `keyColumn` and a JSONB `resultColumn`.
 *
 * Rationale:
 * - Matches the existing Mongo idempotency behavior: cache results by key and return cached value.
 * - Avoids silent fallbacks when schema is missing; missing tables/constraints will surface as errors.
 *
 * @param config Pool + table/column names for idempotency records.
 * @param idempotencyKey Unique key for the operation.
 * @param operation Operation to execute if not cached.
 * @returns Cached or freshly computed result.
 */
export async function ensureIdempotencyPostgres<TResult>(
  config: PostgresIdempotencyConfig,
  idempotencyKey: string,
  operation: () => Promise<TResult>
): Promise<TResult> {
  if (!config?.pool) {
    throw new Error('ensureIdempotencyPostgres requires a pool');
  }
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    throw new Error('ensureIdempotencyPostgres requires a non-empty idempotencyKey');
  }

  const tableName = config.tableName ?? 'idempotency_records';
  const keyColumn = config.keyColumn ?? 'idempotencyKey';
  const resultColumn = config.resultColumn ?? 'result';
  const createdAtColumn = config.createdAtColumn ?? 'createdAt';

  const table = quoteSqlIdentifier(tableName);
  const keyCol = quoteSqlIdentifier(keyColumn);
  const resultCol = quoteSqlIdentifier(resultColumn);
  const createdAtCol = quoteSqlIdentifier(createdAtColumn);

  return utils.safeAsync(
    async () => {
      // First read: fast path for already-completed operations.
      const existing = await config.pool.query(
        `SELECT ${resultCol} AS result FROM ${table} WHERE ${keyCol} = $1 LIMIT 1`,
        [idempotencyKey]
      );
      if (existing.rows?.[0]?.result !== undefined) {
        return existing.rows[0].result as TResult;
      }

      const computed = await operation(); // Execute the operation once we know it's not cached.

      // Insert with conflict protection to avoid throwing when concurrent requests race.
      await config.pool.query(
        `INSERT INTO ${table} (${keyCol}, ${resultCol}, ${createdAtCol}) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (${keyCol}) DO NOTHING`,
        [idempotencyKey, JSON.stringify(computed)]
      );

      // Second read: if we lost the insert race, return the winner's cached value.
      const after = await config.pool.query(
        `SELECT ${resultCol} AS result FROM ${table} WHERE ${keyCol} = $1 LIMIT 1`,
        [idempotencyKey]
      );
      if (after.rows?.[0]?.result !== undefined) {
        return after.rows[0].result as TResult;
      }

      // If the table exists but returns nothing, treat as a hard integrity failure.
      throw new Error('Idempotency record missing after insert');
    },
    'ensureIdempotencyPostgres',
    { tableName, keyColumn, resultColumn, createdAtColumn }
  );
}

