/**
 * PostgreSQL identifier utilities
 *
 * Provides strict identifier validation and quoting helpers for building SQL
 * that is safe from injection via table/column names.
 *
 * Security rationale:
 * - SQL parameterization protects VALUES, not identifiers.
 * - Therefore, every identifier must be validated against an allowlist pattern
 *   and (where applicable) against a per-resource allowlist of columns.
 */

const IDENTIFIER_PART_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/; // Safe subset for unquoted identifiers.

/**
 * Validates that an identifier (optionally schema-qualified via `a.b`) is safe.
 * @param identifier Potentially untrusted identifier (table/column/etc).
 * @param context Short description used for error messages.
 * @returns Normalized identifier string (trimmed, same parts).
 * @throws Error when identifier is empty or contains unsafe characters.
 */
export function assertSafeSqlIdentifier(identifier: string, context: string): string {
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw new Error(`${context} must be a non-empty string`);
  }

  const parts = identifier
    .split('.') // Allow schema-qualified identifiers while still validating each part independently.
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error(`${context} must be a non-empty identifier`);
  }

  for (const part of parts) {
    // Reject quotes, whitespace, operators, and any non-identifier characters.
    if (!IDENTIFIER_PART_REGEX.test(part)) {
      throw new Error(`${context} contains unsafe identifier part "${part}"`);
    }
  }

  return parts.join('.'); // Return normalized form for consistent downstream quoting.
}

/**
 * Quotes an identifier safely for SQL usage.
 * @param identifier Previously validated identifier.
 * @returns Quoted identifier string (each part quoted).
 */
export function quoteSqlIdentifier(identifier: string): string {
  const safe = assertSafeSqlIdentifier(identifier, 'SQL identifier'); // Validate before quoting to prevent quote injection.
  return safe
    .split('.')
    .map(part => `"${part}"`) // Double-quotes preserve case/reserved words (e.g., "user") safely.
    .join('.');
}

