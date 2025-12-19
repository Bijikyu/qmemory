# CURRENTPLAN — ESM TypeScript Migration

## Scope
- Replace the remaining CommonJS/JavaScript source files that still sit in `lib/` and the Jest suites with the authoritative TypeScript+ESM implementations.
- Ensure the compiled output in `dist/` remains the single JavaScript artifact; source roots should no longer carry parallel `.js` + `.ts` versions.
- Update all test code to native ESM with TypeScript so `jest` no longer relies on the global `require` polyfill.
- Keep focus on `lib/` and `test/` as requested; surface adjacent work only when it directly blocks the conversion.

## Inventory — JavaScript Artifacts to Sunset

### `lib/` duplicates (all have TypeScript counterparts already)
| Current JS file | TypeScript source already present | Notes |
| --- | --- | --- |
| `lib/binary-storage.js` | `lib/binary-storage.ts` | JS file still exports runtime logic (top-level await, dynamic import). Need to confirm parity with the TS version before deleting JS. |
| `lib/circuit-breaker-factory.js` | `lib/circuit-breaker-factory.ts` | Ensure the factory helper exports match the TS implementation that already uses generics. |
| `lib/circuit-breaker.js` | `lib/circuit-breaker.ts` | Validate enum/object exports align; TS version adds stronger typing. |
| `lib/email-utils.js` | `lib/email-utils.ts` | JS version lacks the richer validation types included in TS. |
| `lib/fast-operations.js` | `lib/fast-operations.ts` | TS version adds typed generics; confirm helper names stay identical. |
| `lib/health-check.js` | `lib/health-check.ts` | JS uses `require`-friendly Node builtins while TS already imports via `node:` specifiers. |
| `lib/mongoose-mapper.js` | `lib/mongoose-mapper.ts` | TS file already references the schema helpers with `.js` extensions; check index barrel imports when removing JS. |
| `lib/pagination-utils.js` | `lib/pagination-utils.ts` | TS version strengthens type guards. Ensure tests move to TS before dropping JS. |
| `lib/performance-utils.js` | `lib/performance-utils.ts` | JS version re-exports monitoring classes; TS version brings type-safe singleton. Need parity diff. |
| `lib/serialization-utils.js` | `lib/serialization-utils.ts` | TS version introduces `SerializedDocument` conditional types. |
| `lib/streaming-json.js` | `lib/streaming-json.ts` | JS contains only the legacy safe helpers. TS adds streaming APIs that should become source of truth. |
| `lib/test-memory-manager.js` | `lib/test-memory-manager.ts` | JS class lacks explicit typing; TS retains identical API. |
| `lib/typeMap.js` | `lib/typeMap.ts` | Confirm TS exports (`typeMap`, `supportedTypes`, helpers) match runtime expectations. |

➡️ Action: Diff each pair to ensure TS is the superset, update TS where necessary, then delete JS artifacts once consumers/tests have shifted to TypeScript imports.

### `test/` JavaScript suites (25 files)
- `test/test-utils.js` — shared helpers using `module.exports`.
- `test/unit/*.test.js` — 19 unit suites rely on `require(...)` (e.g. `test/unit/http-utils.test.js`).
- `test/integration/*.test.js` — 4 files, include `jest.doMock` + `require('../../index')`.
- `test/production/production-validation.test.js` — uses CommonJS + dynamic `require`.
All tests need to migrate to `.ts` with native `import`/`export`, ESM-aware mocking, and `.js` suffixes in relative imports to match the ESM build output.

## Import/Export Issues to Fix
- **CommonJS require/module.exports:** Present in every JS test (`test/test-utils.js`, `test/unit/serialization-utils.test.js`, etc.). Must become `import`/`export` with explicit `.js` suffixes for local modules.
- **Jest mocks:** Patterns like `jest.mock('../../lib/database-utils', () => ...)` and `jest.doMock('mongoose', ...)` rely on CommonJS hoisting. Under ESM we need `jest.unstable_mockModule` + dynamic `await import(...)` or refactor to dependency injection in the tests.
- **Global require polyfill:** `config/jest-require-polyfill.cjs` is only needed because of CommonJS tests. Plan to remove it after all suites are ESM.
- **Extensionless imports in tests:** e.g. `require('../../lib/http-utils')` resolves today because Jest adds `.ts` to the resolver. ESM TypeScript requires the tests to reference `../../lib/http-utils.js`.
- **Dynamic import targets:** `lib/binary-storage.ts` already uses `await import('./object-storage-binary.js')`. Confirm every path still resolves once source `.js` files disappear and the compiler emits `dist/lib/object-storage-binary.js`.

## Configuration & Dependency Considerations
- **Jest:** `jest.config.js` already sets `preset: 'ts-jest'` with `useESM: true`. After tests move to `.ts`, remove the `.js` patterns from `testMatch` and drop the moduleNameMapper rule that strips `.js`. Also delete the `setupFilesAfterEnv` polyfill when no CommonJS remains.
- **TypeScript compiler:** `tsconfig.json` excludes `**/*.test.ts`. Keep that unless we want tests compiled to `dist`. Ensure `allowJs` can eventually be flipped off once JS sources are gone.
- **ESLint:** `eslint.config.js` ignores `**/*.js`. After migration we can enable linting for `test/**/*.ts` and add a Jest environment override.
- **qtests helper import:** `test/test-utils.js` currently does `require('qtests/lib/envUtils.js')`. Verify the package exposes ESM or dual mode; update to `import { ... } from 'qtests/lib/envUtils.js'` and confirm types (may need to add an ambient typing shim if the package lacks `.d.ts` on that deep path).
- **Scripts:** Confirm `npm run dev` (`ts-node index.ts`) works in strict ESM mode (may need `ts-node --esm` or switch to `tsx`). Document in the plan to adjust if we hit loader errors during execution tests.

## Actionable Work Plan
1. **Baseline verification**
   - Run `npm run type-check` and `npm test` to capture current passing state under mixed JS/TS.
   - Snapshot coverage of the 13 JS files (use `rg`/`git diff` to ensure no untracked edits block deletions).
2. **Audit TS ↔ JS parity in `lib/`**
   - For each JS/TS pair, diff the implementations. Port any missing runtime behavior from JS into the TS source (e.g. logging, defensive checks).
   - Update documentation/comments directly in the TS files so deleting JS does not drop inline rationale.
   - Once parity is confirmed, adjust imports in dependent TS files/tests to target the TS modules (`./foo.js` after compilation).
3. **Remove `lib/*.js` artifacts**
   - Delete the JS files in a single commit after parity proof.
   - Update any residual references (search for `.js` filenames in repo to confirm no consumer points to the soon-to-be-removed sources).
   - Run `npm run build` to ensure `dist/` still contains generated `.js` output.
4. **Convert shared test utilities**
   - Rename `test/test-utils.js` → `test/test-utils.ts`.
   - Replace `module.exports` with named ESM exports and type the helper return values (`MockModel`, etc.).
   - Update downstream imports in every test file to reference the new named exports with `.js` suffix in paths (because compiled output from ts-jest expects it).
5. **Migrate unit tests**
   - Convert each `test/unit/*.test.js` to `.ts`.
   - Replace `require` statements with `import` plus `.js` suffixes.
   - Refactor `jest.mock` usage: prefer `jest.unstable_mockModule` with `await import` for ESM modules, or inject dependencies through wrappers when mocking becomes unwieldy.
6. **Migrate integration & production tests**
   - Apply the same ESM conversion patterns.
   - Pay special attention to the double `jest.doMock` / `jest.mock` invocations in `test/integration/workflows.test.js` and `test/production/production-validation.test.js`; rewrite using async `beforeAll(async () => { ... await import(...) })`.
7. **Jest configuration cleanup**
   - Update `testMatch` to `['**/test/**/*.test.ts']`.
   - Remove `.js` from `collectCoverageFrom` if the sources disappear.
   - Drop the `moduleNameMapper` rule once all imports explicitly include `.js`.
   - Delete `config/jest-require-polyfill.cjs` and its reference.
8. **ESLint & tooling follow-up**
   - Allow ESLint to lint `test/**/*.ts` with Jest-specific globals (`env: { jest: true }` override).
   - Once JS sources are gone, set `"allowJs": false` (or keep temporarily if examples remain) and consider enabling `noImplicitAny` for tests if feasible.
9. **Validation pass**
   - Re-run `npm run type-check`, `npm run build`, `npm test`, and `node qtests-runner.mjs`.
   - Confirm no `require` references remain via `rg -n "require\\("`.
   - Ensure `dist/` folder contains compiled `.js` for each migrated module (`ls dist/lib | sort`).

## Risks & Mitigations
- **Jest ESM mocking friction:** Plan to prototype conversion on a single unit test (e.g. `test/unit/http-utils.test.js`) before bulk edits; document patterns for the rest of the suite.
- **Third-party CommonJS packages:** If a dependency lacks ESM support (e.g. deep `qtests` path), use `createRequire` inside the TypeScript module or maintain a small CommonJS shim until upstream publishes ESM.
- **Accidental loss of logic when deleting JS duplicates:** Require reviewed diffs between `.js` and `.ts`. Consider adding targeted regression tests before removal if coverage gaps exist.

## Validation Checklist (post-migration)
- `npm run type-check`
- `npm run build`
- `npm test`
- `node qtests-runner.mjs`
- Manual spot-check: `rg -n "module.exports"` and `rg -n "require\\("` should return no matches outside legacy configs/scripts.

Document findings and any deviations in `/agentRecords` after each major phase.
