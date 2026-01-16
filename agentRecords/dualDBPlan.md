# Dual DB Support Plan (MongoDB + PostgreSQL)

<!-- 🚩AI: DUAL_DB_SUPPORT_PLAN -->

## Mission
Add parallel PostgreSQL support for this library’s current MongoDB/Mongoose-oriented database operations so consuming apps can select the correct DB implementation via `DBTYPE` while preserving the library’s security-by-default stance (mandatory per-user ownership enforcement at the query level) and its “prefer errors over lies” policy.

## Scope (What “DB operations” includes)
This plan targets the exported features that are currently Mongo/Mongoose-shaped:
- Core database safety/error utilities: `lib/database-utils.ts` (+ `lib/database/*` helpers)
- Generic CRUD helpers: `lib/document-helpers.ts`
- User-owned “security layer” CRUD: `lib/document-ops.ts`
- CRUD service factory: `lib/crud-service-factory.ts`
- Uniqueness validation helpers/middleware: `lib/unique-validator.ts`
- Native driver operations wrapper: `lib/database/mongodb-operations.ts`

Non-DB utilities (HTTP utils, caches, queues, storage, etc.) are unaffected except for documentation/examples referencing `ensureMongoDB`.

## Constraints & guiding principles
- **Security by default**: user ownership filters must be enforced in the data-access layer for both DBs.
- **Prefer errors over lies**: if Postgres support is misconfigured (missing deps, missing schema/table), fail loudly with actionable errors.
- **Backward compatibility**: MongoDB remains the default when `DBTYPE` is unset, and existing Mongo exports continue to work.
- **No silent downgrades**: do not return fake data or “fallback to Mongo” if `DBTYPE=postgres`.
- **Tests** must not call real external Postgres; use an in-process emulator (e.g., `pg-mem`) or pure mocks.

## Current state snapshot (from FILE_FLOWS)
- Mongo/Mongoose is baked into function signatures (e.g., `Model<T>`, `FilterQuery<T>`) across the modules listed above.
- Error handling is Mongo-specific in places (e.g., Mongo duplicate key code `11000`, Mongoose `ValidationError`/`CastError`).
- The connection pool layer (`lib/database/simple-pool.ts`) already contains dynamic-import branches for `postgresql` (`pg`) but `pg` is not a declared dependency today; this is a runtime footgun if invoked.

## Design goals for Postgres parity
- Provide equivalents for:
  - Safe operation wrappers (`safeDbOperation`, retries, timeouts)
  - Ownership-enforced CRUD (`findUserDoc`, `updateUserDoc`, `deleteUserDoc`, list/paginate)
  - Uniqueness validation (`ensureUnique`, `validateUniqueField(s)`, duplicate error mapping)
  - CRUD service factory semantics (create/read/update/delete/search/paginate)
- Keep response/error behavior consistent with existing HTTP utilities (409 conflicts, 400 validation, 500 internal, etc.).

## Key decision: adapter-based dual implementation
Implement PostgreSQL support by adding a DB adapter layer that:
- Leaves the existing Mongo implementations mostly intact
- Adds parallel Postgres implementations with comparable behavior
- Exposes a **DBTYPE-driven selector** that routes “public” entry points to the correct adapter

This yields “parallel and equal implementations” where needed, while allowing “slight modifications” where shared behavior can be factored into DB-agnostic utilities (timeouts, retry/backoff, standardized error shapes).

## DBTYPE contract
### Environment variable
- `DBTYPE` (string), normalized to a canonical union:
  - `mongodb` (default)
  - `postgres` (canonical)
- Accept synonyms but normalize:
  - `mongo` → `mongodb`
  - `postgresql` → `postgres`

### Runtime behavior
- If `DBTYPE` is unknown, throw a descriptive error at module init (or first call), not a silent fallback.
- If `DBTYPE=postgres` but the Postgres adapter cannot load (e.g., missing `pg`), throw a descriptive error with remediation.

### Exported helpers
- `getDbType(): 'mongodb' | 'postgres'` (pure function reading env)
- `assertSupportedDbType(dbType: string): asserts dbType is ...` (optional, used internally)

## Proposed module layout
Create a new internal folder for DB adapters and selection:
- `lib/db/types.ts`
  - Defines DB-agnostic interfaces for the operations the library needs (CRUD, transactions, query building constraints).
  - Also defines “identifier” typing so `_id` (Mongo) and `id` (SQL) differences are handled consistently.
- `lib/db/dbtype.ts`
  - Parses/normalizes `process.env.DBTYPE`.
- `lib/db/select.ts`
  - Provides selector helpers (e.g., `getDbAdapter()` or `getDbImplementations()`).
- `lib/db/mongo/*`
  - Thin wrappers that call existing Mongoose/Mongo-native implementations.
  - Where existing files already implement the logic, prefer re-exporting rather than duplicating.
- `lib/db/postgres/*`
  - New implementations using `pg` (Pool/Client) with parameterized queries and strict identifier whitelisting.

### Where code should live (parallelism rule)
- If a function is inherently DB-specific (e.g., aggregation pipeline vs SQL GROUP BY), create *parallel implementations* and select by DBTYPE.
- If a function is DB-agnostic (retry/backoff, timeout guards), factor it once into shared utilities and reuse from both adapters.

## Public API/export strategy
### Goals
- Allow consumers to keep importing `findUserDoc`, `createCrudService`, etc.
- Make it possible (and recommended) to explicitly import the DB-specific variant to avoid ambiguity.

### Proposed exports
1) **DBTYPE-selected default exports (existing names)** for the DB-centric surface area:
   - `ensureDB` (alias; backed by `ensureMongoDB` or `ensurePostgresDB`)
   - `safeDbOperation`, `retryDbOperation`, `ensureUnique`, etc.
   - `findUserDoc`, `updateUserDoc`, `deleteUserDoc`, etc.
   - `createCrudService`, `validateUniqueField(s)`, etc.

2) **Explicit namespaces** to avoid “magic”:
   - `mongo.<function>` (current behavior, Mongoose-oriented)
   - `postgres.<function>` (new behavior, `pg`-oriented)

3) **A compatibility layer** that does not lie:
   - If `DBTYPE=postgres` and a consumer accidentally calls a Mongo-only export (e.g., `createAggregationPipeline` if kept Mongo-only), throw a clear `NotSupportedForDbTypeError` with guidance.

### TypeScript typing approach (pragmatic)
Because TypeScript cannot infer runtime `DBTYPE`, the “default” (DBTYPE-selected) exports should use union/overload types:
- Overload signatures where practical:
  - Mongo overload accepts `mongoose.Model<T>`.
  - Postgres overload accepts a library-defined `PostgresResource<T>` (see next section).
- Explicit namespaces keep typing crisp: `mongo.findUserDoc(Model, ...)` vs `postgres.findUserDoc(resource, ...)`.

## Postgres resource representation (needed for parity)
Mongo operations key off a `Model<T>`. Postgres needs at minimum:
- A `pg.Pool` (or Pool-like) connection handle (or use existing pool manager)
- `tableName`
- `idColumn` (default `id`)
- `ownerColumn` (default `user` OR `username` — see open question)
- Optional `softDeleteColumn` (for `softDeleteDocument`)
- Optional `createdAtColumn` (for date-range/pagination helpers)
- An **allowed column whitelist** (prevents SQL injection through column/field names)

Define a `PostgresResource<T>` type that includes this metadata and implement helpers:
- `createPostgresResource<T>(config): PostgresResource<T>`
- `assertValidIdentifier(name)` and `assertAllowedColumn(resource, column)` used inline for security

## Error mapping parity (Mongo ↔ Postgres)
Create a shared error-normalization layer so callers get consistent behavior:
- Mongo duplicate key: `11000` → 409 conflict
- Postgres unique violation: SQLSTATE `23505` → 409 conflict
- Postgres foreign key violation: `23503` → 409 conflict or 400 (decision: prefer 409 when relating to constraints)
- Postgres invalid text representation: `22P02` → 400 validation error
- Timeout errors → 503 service unavailable or 500 internal (match existing conventions)

Expose:
- `handleDbError(error, res, operation, dbType)` delegating to DB-specific mapping but returning consistent outcomes.

## Ownership enforcement parity
Mongo pattern today: `{ _id: id, user: username }` (and username sanitization to prevent NoSQL injection).

Postgres equivalent must:
- **Never** concatenate user-provided values into SQL.
- Always add `WHERE ownerColumn = $n` for user-scoped operations.
- Validate/sanitize username similarly (different attack surface than NoSQL, but still validate length/charset to prevent abusive payloads and log injection).

## Function-by-function parity matrix (high level)
### `database-utils` (+ `lib/database/*`)
- `ensureMongoDB` → add `ensurePostgresDB` (sync “configured/healthy” check) + `ensureDB` selector.
- `handleMongoError` → add `handlePostgresError` + `handleDbError` selector.
- `safeDbOperation`, `retryDbOperation` → factor common timeout/retry scaffolding into shared utilities; adapter supplies error handling.
- `ensureUnique` → implement Postgres variant using `SELECT 1 ... LIMIT 1` or catch `23505`.
- `optimizeQuery`, `createAggregationPipeline` → likely Mongo-only; either (a) keep under `mongo.*` only or (b) define SQL equivalents with new names.

### `document-helpers`
Implement Postgres equivalents for:
- `findDocumentById`, `updateDocumentById`, `deleteDocumentById`, `createDocument`
- `findDocuments`, `findOneDocument`, `bulkUpdateDocuments`, `bulkDeleteDocuments`
- `existsByField`, `getDistinctValues`
- `getByDateRange`, `getPaginatedDocuments`, `textSearchDocuments` (use `ILIKE`, full-text search optional)
- `softDeleteDocument`, `getActiveDocuments`
- `cascadeDeleteDocument` requires explicit FK metadata (cannot guess reliably like Mongo does); propose a Postgres-only config object for related deletions, or require DB schema to have `ON DELETE CASCADE` and provide a helper that validates that assumption (prefer error over silent partial deletes).

### `document-ops` (security layer)
Implement Postgres equivalents for:
- `findUserDoc`, `deleteUserDoc`, `updateUserDoc`, `listUserDocsLean`
- `createUniqueDoc`, `validateDocumentUniqueness`, `hasUniqueFieldChanges`
- `fetchUserDocOr404`, `deleteUserDocOr404`, `userDocActionOr404`

These must enforce ownership in SQL (`WHERE ownerColumn = $1`) and return comparable “not found” semantics.

### `crud-service-factory`
Create a Postgres CRUD service factory variant that matches the service API:
- `create`, `getById`, `getAll` (filters, pagination), `update`, `deleteById`, `search`, `getByField`, `count`, `exists`, `bulkCreate`, `upsert`

Important: Postgres filter/pagination semantics differ from Mongo; define a constrained filter model (e.g., equality + basic operators) to avoid introducing an unsafe SQL string DSL.

### `unique-validator`
Implement Postgres variants:
- `checkDuplicateByField`, `validateUniqueField(s)` using parameterized queries + column whitelist.
- Middleware can remain Express-compatible; only internal DB query changes.
- `handleDuplicateKeyError` must recognize `23505`.

## Dependency plan
### Runtime
- Add `pg` as a dependency (or optionalDependency with explicit runtime error if missing when `DBTYPE=postgres`).

### Test/dev
- Add `pg-mem` (or equivalent) to run unit tests without a real Postgres server.

## Implementation phases (concrete)
### Phase 0 — Inventory + contracts
- Enumerate the DB-related exports from `index.ts` and `lib/imports.ts`.
- Define which exports are:
  - DB-agnostic
  - Dual-DB (must support both)
  - Mongo-only (explicitly namespaced)

### Phase 1 — DBTYPE + adapter scaffolding
- Implement `lib/db/dbtype.ts`, `lib/db/types.ts`, `lib/db/select.ts`.
- Add explicit `mongo` and `postgres` namespaces in the public export surface (without changing existing Mongo behavior).

### Phase 2 — Postgres core primitives
- Implement Postgres connection/health check utility.
- Implement Postgres error mapping.
- Implement shared timeout/retry wrappers that both DBs reuse.

### Phase 3 — Postgres document helpers + security layer
- Implement Postgres `document-helpers` and `document-ops` equivalents.
- Ensure username validation and ownership enforcement are identical in intent to Mongo.
- Add unit tests for each major operation using `pg-mem`.

### Phase 4 — CRUD service factory + unique validator parity
- Implement Postgres `crud-service-factory` equivalent.
- Implement Postgres `unique-validator` equivalent.
- Add tests for search/pagination/uniqueness behavior and error mapping.

### Phase 5 — Export routing + docs
- Wire DBTYPE-selected defaults in `index.ts` (and `lib/imports.ts` if used by internal consumers).
- Update `README.md` with:
  - `DBTYPE` usage
  - Postgres setup expectations (tables, owner column, required indexes)
  - Clear statement of which APIs are dual-DB vs Mongo-only
- Add examples demonstrating Postgres usage and DBTYPE switching.

### Phase 6 — Validation gate
- Run `npm run type-check`.
- Run `npm test` via `qtests-runner.mjs`.
- Ensure tests include DBTYPE switching scenarios and no external DB access.

## Testing strategy (details)
- **Unit tests**: each Postgres module gets coverage mirroring the existing Mongo unit tests.
- **Integration tests**: add a suite that sets `DBTYPE=mongodb` and `DBTYPE=postgres` (in separate Jest runs) to ensure exports switch correctly.
- **No real Postgres**: use `pg-mem` or strict mocks; do not require Docker or network.

## Performance & scaling considerations (Postgres)
- Always use `pg.Pool` with bounded pool size and timeouts.
- Use parameterized queries for values; whitelist identifiers for columns/tables.
- Prefer keyset pagination for large datasets where feasible; keep offset pagination for parity where required.
- Document recommended indexes (e.g., `(ownerColumn, idColumn)`, unique fields, `created_at`).

## Open questions (need answers before implementation to avoid wrong scope)
1) Should “DBTYPE switching” require **zero call-site changes** in consuming apps, or is it acceptable that apps pass a different “resource/model” object for Postgres?
2) Canonical ownership column name:
   - Mongo code uses `user` in `document-ops.ts` but other modules use `username` (e.g., `database-operation-factory.ts`).
   - For Postgres parity, do we standardize on `user` everywhere, or support both via configuration?
3) What is the intended stance on schema responsibilities for Postgres (tables/indexes/idempotency table)?
   - Should the library create/ensure tables exist, or require the consuming app to manage migrations?
4) Which “Mongo-only” utilities must remain top-level exports vs moved under `mongo.*` (to avoid lying about Postgres support)?

