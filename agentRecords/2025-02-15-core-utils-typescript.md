## Task
- Convert core utility modules (`utils`, `storage`, `logging-utils`, `perf`, `lru-cache`, `cache-utils`) to strict TypeScript with ESM support.

## Actions
- Rebuilt `lib/logging-utils.ts` with typed qerrors integration, preserving console behaviour expected by unit tests.
- Tightened typings and documentation across `lib/utils.ts`, `lib/storage.ts`, `lib/perf.ts`, `lib/lru-cache.ts`, and `lib/cache-utils.ts`.
- Added Redis client factory typings using node-redis generics and default reconnect strategy helpers.

## Verification
- `npm run type-check` → fails due to pre-existing issues in `crud-service-factory`, `database-utils`, and `database/connection-pool-manager` (unchanged in this task).
- `node qtests-runner.mjs` → aborts because Jest detects duplicate `expect` packages in `.cache/.bun` (pre-existing).
