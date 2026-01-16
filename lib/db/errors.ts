/**
 * Dual-DB error types
 *
 * These errors provide explicit, actionable failures when database selection
 * or per-database feature availability is misconfigured.
 *
 * Rationale:
 * - "Prefer errors over lies": fail loudly rather than silently falling back.
 * - Provide consistent error shapes for callers and tests.
 */

export class UnsupportedDbTypeError extends Error {
  public readonly name = 'UnsupportedDbTypeError';
  public readonly dbTypeValue: string;
  public readonly supportedDbTypes: string[];

  constructor(dbTypeValue: string, supportedDbTypes: string[]) {
    super(
      `Unsupported DBTYPE "${dbTypeValue}". Supported values: ${supportedDbTypes.join(', ')}.`
    );
    this.dbTypeValue = dbTypeValue; // Keep raw value for debugging/logging while message stays concise.
    this.supportedDbTypes = supportedDbTypes; // Enumerate supported values for quick remediation.
  }
}

export class NotSupportedForDbTypeError extends Error {
  public readonly name = 'NotSupportedForDbTypeError';
  public readonly dbType: string;
  public readonly feature: string;

  constructor(dbType: string, feature: string, guidance?: string) {
    super(
      guidance
        ? `Feature "${feature}" is not supported for DBTYPE="${dbType}". ${guidance}`
        : `Feature "${feature}" is not supported for DBTYPE="${dbType}".`
    );
    this.dbType = dbType; // Keep selected dbType for callers that want conditional handling.
    this.feature = feature; // Identify the exact capability that is unavailable.
  }
}

