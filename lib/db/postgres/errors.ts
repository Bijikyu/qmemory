/**
 * PostgreSQL error mapping utilities
 *
 * Maps PostgreSQL/pg errors into the library's standard HTTP response pattern.
 *
 * Security rationale:
 * - Log detailed errors internally.
 * - Send sanitized, non-sensitive messages to clients.
 */

import type { Response } from 'express';
import {
  sendConflict,
  sendInternalServerError,
  sendServiceUnavailable,
  sendValidationError,
} from '../../http-utils.js';
import { createModuleUtilities } from '../../common-patterns.js';

const utils = createModuleUtilities('postgres-errors');

export type PostgresErrorLike = {
  code?: string;
  message?: string;
  detail?: string;
  constraint?: string;
};

/**
 * Runtime type-guard for pg/Postgres-style errors.
 * @param error Unknown error value.
 * @returns True when the value looks like a Postgres error object.
 */
export function isPostgresError(error: unknown): error is PostgresErrorLike {
  return Boolean(error) && typeof error === 'object' && 'code' in (error as Record<string, unknown>);
}

/**
 * Determines whether the error indicates a connectivity/availability issue.
 * @param error Unknown error value.
 * @returns True when the error looks like an availability failure.
 */
export function isPostgresAvailabilityError(error: unknown): boolean {
  // Node-level network failures can surface without a SQLSTATE code.
  const nodeCode = (error as { code?: unknown } | null)?.code;
  if (typeof nodeCode === 'string' && ['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH'].includes(nodeCode)) {
    return true;
  }

  if (!isPostgresError(error)) return false;

  // SQLSTATE class 57xxx indicates operator intervention / shutdown.
  return typeof error.code === 'string' && error.code.startsWith('57');
}

/**
 * Maps a Postgres error to an appropriate HTTP response, with internal logging.
 * @param error Error to classify.
 * @param res Express response (optional).
 * @param operation Human-readable operation name for logs.
 */
export function handlePostgresError(error: unknown, res: Response | null, operation: string): void {
  utils.logError(error as Error, 'handlePostgresError', {
    operation,
    isPostgresError: isPostgresError(error),
    pgCode: isPostgresError(error) ? error.code : undefined,
    hasResponse: Boolean(res),
  });

  if (!res) return; // If no response provided, logging is the only safe action.

  if (isPostgresAvailabilityError(error)) {
    sendServiceUnavailable(res, 'Database functionality unavailable');
    return;
  }

  if (isPostgresError(error)) {
    const code = error.code;

    // 23505: unique_violation → 409 Conflict
    if (code === '23505') {
      sendConflict(res, 'Resource already exists');
      return;
    }

    // 23503: foreign_key_violation; 23502: not_null_violation; 23514: check_violation
    if (code === '23503' || code === '23502' || code === '23514') {
      sendValidationError(res, 'Validation failed');
      return;
    }

    // 22P02: invalid_text_representation (e.g., invalid UUID)
    // 22001: string_data_right_truncation
    if (code === '22P02' || code === '22001') {
      sendValidationError(res, 'Invalid input');
      return;
    }
  }

  // Default: do not leak DB details to clients.
  sendInternalServerError(res, 'Database error during operation');
}

