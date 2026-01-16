/**
 * DBTYPE resolution utilities
 *
 * Reads and normalizes the `DBTYPE` environment variable so the library can
 * route database operations to the correct backend at runtime.
 *
 * Security/Reliability rationale:
 * - Accept only a small, explicit allowlist of db types to prevent accidental
 *   misconfiguration (e.g., typos) from silently changing behavior.
 * - Default to MongoDB when unset to preserve existing behavior.
 */

import { UnsupportedDbTypeError } from './errors.js';

export type DbType = 'mongodb' | 'postgres';

export const DBTYPE_ENV_VAR = 'DBTYPE';

const SUPPORTED_DBTYPE_VALUES: ReadonlyArray<string> = [
  'mongodb',
  'mongo',
  'postgres',
  'postgresql',
  'pg',
];

/**
 * Normalizes arbitrary DBTYPE inputs to canonical values.
 * @param rawValue Untrusted value (env var, config input, etc.).
 * @returns Canonical DB type (`mongodb` | `postgres`) or null when not set.
 */
export function normalizeDbType(rawValue: unknown): DbType | null {
  if (rawValue === undefined || rawValue === null) return null; // Treat missing as "not set".

  const value = String(rawValue).trim().toLowerCase(); // Normalize casing/whitespace for predictable matching.
  if (!value) return null; // Treat empty string as "not set" to preserve backward compatibility.

  if (value === 'mongodb' || value === 'mongo') return 'mongodb'; // Canonicalize Mongo synonyms.
  if (value === 'postgres' || value === 'postgresql' || value === 'pg') return 'postgres'; // Canonicalize Postgres synonyms.

  return null; // Caller decides whether unknown values should throw or default.
}

/**
 * Reads DBTYPE from process.env and returns a canonical db type.
 * @returns Canonical db type (`mongodb` by default when unset).
 * @throws UnsupportedDbTypeError when DBTYPE is set but invalid.
 */
export function getDbType(): DbType {
  const normalized = normalizeDbType(process.env[DBTYPE_ENV_VAR]);
  if (normalized) return normalized;

  const raw = process.env[DBTYPE_ENV_VAR];
  if (raw === undefined || raw === null || !String(raw).trim()) {
    return 'mongodb'; // Preserve existing behavior when DBTYPE is not configured.
  }

  throw new UnsupportedDbTypeError(String(raw), [...SUPPORTED_DBTYPE_VALUES]);
}

