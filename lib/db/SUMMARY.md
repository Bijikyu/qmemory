# lib/db/SUMMARY.md

## Purpose
- Provide dual database support (MongoDB/Mongoose + PostgreSQL) selected via `DBTYPE`, while keeping MongoDB as the default for backward compatibility.
- Enforce security-by-default by keeping user ownership constraints at the query level (not in higher-level middleware).

## Entry Points
- `lib/db/dual.ts`: Exposes DBTYPE-selected wrapper functions plus explicit `mongo.*` and `postgres.*` namespaces.
- `lib/db/dbtype.ts`: Reads and normalizes the `DBTYPE` environment variable (`mongodb` default; throws on invalid values).

## Files
### Core
- `lib/db/dbtype.ts`: `getDbType()`/`normalizeDbType()` for DBTYPE validation and canonicalization.
- `lib/db/errors.ts`: Standardized DBTYPE-related errors (`UnsupportedDbTypeError`, `NotSupportedForDbTypeError`).
- `lib/db/dual.ts`: DBTYPE-based dispatch for DB-centric operations; Mongo-only helpers throw on Postgres to avoid silent behavior changes.

### Mongo Adapter
- `lib/db/mongo/index.ts`: Explicit `mongo.*` namespace re-exports of existing MongoDB/Mongoose utilities.

### Postgres Adapter
- `lib/db/postgres/types.ts`: `PostgresPoolLike` + `PostgresResource` and `createPostgresResource()` (table metadata + allowlisted columns).
- `lib/db/postgres/identifiers.ts`: Strict identifier validation and safe quoting for SQL identifiers.
- `lib/db/postgres/filters.ts`: Constrained filter → SQL builder (parameterized; allowlist enforced for identifiers).
- `lib/db/postgres/errors.ts`: Postgres error mapping to HTTP responses (sanitized client errors + internal logging).
- `lib/db/postgres/database-utils.ts`: Postgres equivalents of safe operation + retry + uniqueness + idempotency helpers.
- `lib/db/postgres/connection-utils.ts`: Postgres connectivity checks (`SELECT 1`).
- `lib/db/postgres/document-helpers.ts`: DB-agnostic helpers implemented for Postgres via safe SQL builders.
- `lib/db/postgres/document-ops.ts`: User-owned CRUD helpers that enforce ownership in SQL (`WHERE ownerColumn = $n`).
- `lib/db/postgres/unique-validator.ts`: Postgres equivalents of unique-field validation + middleware.
- `lib/db/postgres/crud-service-factory.ts`: Postgres CRUD service factory using `PostgresResource` and parameterized SQL.

## Data Flow
### DBTYPE-selected exports
- Public API (`index.ts`) exposes DB-centric helpers that call `lib/db/dual.ts`, which reads `DBTYPE` at call time to select Mongo vs Postgres.
- Consumers can bypass `DBTYPE` and call `mongo.*` / `postgres.*` explicitly for deterministic behavior.

### Postgres resource model
- Postgres operations take a `PostgresResource` instead of a Mongoose model.
- Column/table identifiers are validated and quoted, and values are always passed via parameter placeholders to prevent SQL injection.

## Security
- **Ownership enforcement**: Postgres user-document ops always include `AND ownerColumn = $n` so cross-user access cannot occur if callers forget to add filters.
- **Identifier injection prevention**: only allowlisted columns can be used in SELECT/WHERE/ORDER BY; identifiers are validated and quoted.
- **No silent fallbacks**: invalid `DBTYPE` throws; unsupported Mongo-only helpers throw on Postgres rather than attempting degraded behavior.

## Caveats & Edge Cases
- **Filter support is intentionally limited** for Postgres; unsupported operators throw explicit errors (see `lib/db/postgres/filters.ts`).
- **Uniqueness race conditions** still exist if only using pre-checks; for strong guarantees, add DB-level `UNIQUE` constraints and rely on `23505` handling.
- **Postgres driver is not bundled**; consuming apps must provide a pool/client implementing `query(text, params)` (e.g., `pg.Pool`).
