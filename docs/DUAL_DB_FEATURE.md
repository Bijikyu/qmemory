# Dual Database Support

Dual Database Support lets consuming applications run the same qmemory APIs against MongoDB (the historical default) or PostgreSQL by switching the `DBTYPE` environment variable. The library keeps its "security by default" stance—every document query enforces user ownership—while translating the existing Mongo/Mongoose utilities into Postgres equivalents where parity is required.

## Supported databases

| Database | Default exports | Key features |
|---------|------------------|--------------|
| MongoDB | `mongo` namespace, plus `DBTYPE`-dispatched helpers when `DBTYPE` is *unset* or `mongodb` | Existing Mongoose models, aggregation helpers, `Model<T>` signatures, and Mongo-specific error handling remain intact. |
| PostgreSQL | `postgres` namespace, plus `DBTYPE=postgres` selected helpers | New `PostgresResource` metadata, parameterized SQL queries, `pg.Pool` health checks, and strict identifier whitelisting keep behavior deterministic. |

## Configuration & runtime behavior

1. **Set `DBTYPE`.** The selector is implemented in `lib/db/dbtype.ts`. Allowed values are `mongodb` (default) and `postgres`; `mongo`, `postgresql`, and uppercase variants are normalized and validated.
2. **Fail fast.** If the value is unknown or the chosen adapter cannot initialize (for example, `pg` is missing when `DBTYPE=postgres`), qmemory throws a descriptive error immediately rather than pretending to work.
3. **Adapters.** `lib/db/select.ts` exposes helpers such as `getDbAdapter()` so the public exports can stay unchanged while dispatching to the correct implementation.
4. **Shared utilities.** Timeout/retry scaffolding (e.g., `safeDbOperation`, `retryDbOperation`) lives in `lib/database-utils.ts` and calls DB-specific helpers (`handleMongoError`, `handlePostgresError`).

## API export strategy

| Export surface | Behavior when `DBTYPE=postgres` | Notes |
|----------------|---------------------------------|-------|
| Default helpers (e.g., `findUserDoc`, `createCrudService`, `ensureUnique`, `safeDbOperation`) | Dispatched through the DB selector to Mongo or Postgres versions | Exported from `index.ts` and re-exported by `lib/imports.ts`. Types rely on overloads where practical. |
| `mongo.*` namespace | Always uses Mongo implementations, regardless of `DBTYPE` | Useful for apps that need Mongoose behavior even when `DBTYPE=postgres`. |
| `postgres.*` namespace | Always uses Postgres implementations and requires a `PostgresResource` | Ensures clarity for new Postgres-focused code. |
| Mongo-only helpers (e.g., `createAggregationPipeline`) | Remain under `mongo.*` and throw `NotSupportedForDbTypeError` if invoked while `DBTYPE=postgres` | Avoids lying about Postgres support. |

## Postgres resource contract (`lib/db/postgres/types.ts`)

A `PostgresResource<T>` describes the metadata required for ownership-enforced queries:

- `pool`: A `pg.Pool` (or Pool-like) handle for executing queries.
- `tableName`: Target table (quoted internally).
- `ownerColumn`: Column that stores the username/owner (default `user`).
- `idColumn`: Primary key column (default `id`).
- `allowedColumns`: White-listed columns to prevent SQL injection when projecting or filtering.
- Optional columns such as `softDeleteColumn`, `createdAtColumn`, and `deletedColumn` support the helper parity with Mongo.

Helpers such as `createPostgresResource(config)` live under `lib/db/postgres/resource.ts` (or similar) and perform identifier validation via `assertSafeSqlIdentifier` + `assertAllowedColumn` in `lib/db/postgres/identifiers.ts`.

## Ownership enforcement & query safety

- Mongo enforces ownership by adding `{ user: username }` to every query. The Postgres implementation appends `WHERE ownerColumn = $n` with parameterized bindings, using sanitized usernames to prevent injection.
- Utility functions such as `findUserDoc`, `updateUserDoc`, `deleteUserDoc`, and `listUserDocs` live in `lib/document-ops.ts` for Mongo and have mirroring logic under `lib/db/postgres/document-ops.ts`.
- `createUniqueDoc`, `validateDocumentUniqueness`, and `handleDuplicateKeyError` use the shared selector to behave consistently across DBs.

## Error normalization

- Mongo duplicate key errors (`11000`) map to 409 Conflict via `handleMongoError`.
- Postgres unique violations (`23505`), foreign key violations (`23503`), and invalid text representations (`22P02`) are normalized inside `handlePostgresError` and the shared `handleDbError` helper.
- Timeout or connection issues route through the shared HTTP utilities so Express responses (409, 400, 500, 503) stay consistent.
- `ensureUnique` and `validateUniqueField(s)` both leverage `handleDbError` so duplicate detections and conflict responses behave identically.

## CRUD service factory parity

`createCrudService` dispatches to Mongo or Postgres implementations. The Postgres factory reuses the `PostgresResource` config for filtering, pagination, and uniqueness checks, exposing the same methods (`create`, `getById`, `getAll`, `update`, `deleteById`, `search`, `count`, `exists`, `bulkCreate`, `upsert`). Postgres filters are constrained to equality and safe operators to avoid building arbitrary SQL strings.

## Documentation & developer guidance

- The README now explains how to flip `DBTYPE`, install the new scoped package (`@bijikyu/qmemory`), and mentions the GitHub Packages `.npmrc` setup.
- Migration docs explain which exports are dual-DB vs Mongo-only and point to the explicit `mongo.*`/`postgres.*` namespaces.
- Production guides document recommended Postgres indexes (`ownerColumn`, unique fields, `createdAt`).
- The open-source qerrors guidance (see `node_modules/qerrors/AGENTS.md`) still applies: do not modify error-handling internals when adjusting this feature documentation.

## Testing guidance

- `DBTYPE` switching is covered by the current test suite (`qtests-runner.mjs`). Add unit tests for Postgres helpers using `pg-mem` (no real Postgres server). Ensure tests set `DBTYPE=postgres` and provide a valid `PostgresResource` so the selectors route correctly.
- Integration tests should exercise both `DBTYPE=mongodb` and `DBTYPE=postgres` environments to guarantee exports behave the same.
- Type checking (via `tsc --noEmit`) and `npm test` already validate the runtime behavior.

## Release & maintenance notes

- Continue publishing as `@bijikyu/qmemory` with `publishConfig.registry=https://npm.pkg.github.com` and `access:public`.
- Keep documentation updated when new Postgres helpers are added or when Mongo-only exports are promoted to dual support.

