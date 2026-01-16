/**
 * PostgreSQL connection/health utilities
 *
 * Provides an `ensurePostgresDB` helper analogous to `ensureMongoDB`.
 *
 * Important difference:
 * - Mongo version can check a global Mongoose connection state synchronously.
 * - Postgres pools do not expose a reliable sync "readyState", so this helper
 *   performs a lightweight `SELECT 1` check.
 */

import type { Response } from 'express';
import { sendServiceUnavailable } from '../../http-utils.js';
import { createModuleUtilities } from '../../common-patterns.js';
import type { PostgresClientLike } from './types.js';

const utils = createModuleUtilities('postgres-connection-utils');

/**
 * Ensures the provided Postgres client/pool can execute queries.
 * @param res Express response used to emit 503 on failure.
 * @param client Postgres client/pool with a `query()` method.
 * @param timeoutMs Health check timeout (default 2s).
 * @returns True when the client responds, false otherwise.
 */
export async function ensurePostgresDB(
  res: Response,
  client: PostgresClientLike | null | undefined,
  timeoutMs: number = 2000
): Promise<boolean> {
  return (
    (await utils.safeAsync(
      async () => {
        if (!client || typeof client.query !== 'function') {
          sendServiceUnavailable(res, 'Database functionality unavailable');
          return false;
        }

        let timeoutId: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Postgres health check timed out')), timeoutMs);
        });

        try {
          await Promise.race([client.query('SELECT 1'), timeoutPromise]);
          return true;
        } catch (error) {
          utils.logError(error as Error, 'ensurePostgresDB', { timeoutMs });
          sendServiceUnavailable(res, 'Database functionality unavailable');
          return false;
        } finally {
          timeoutId && clearTimeout(timeoutId);
        }
      },
      'ensurePostgresDB',
      { timeoutMs }
    )) || false
  );
}

