# ESM and TypeScript Conversion Plan

## Overview
Convert the qmemory Node.js utility library from CommonJS to ESM and TypeScript. The project already has `"type": "module"` in package.json and a TypeScript configuration, but most files are still CommonJS JavaScript.

## Current State Analysis
- **Package.json**: Already configured for ESM (`"type": "module"`) with TypeScript support
- **TypeScript config**: Properly configured with ES2022 target and ESM modules
- **Index files**: Both `index.js` (CommonJS) and `index.ts` (ESM) exist but need synchronization
- **Lib directory**: 45+ .js files requiring conversion to .ts
- **Test files**: Mix of .test.ts and .js files needing updates
- **Build system**: Ready for TypeScript compilation

## Conversion Strategy

### Phase 1: Core Library Files (Parallel Processing)
Split into 5 agent groups for parallel conversion:

#### Group A: Database & Document Operations (Agent 1)
- `lib/database-utils.js` → `lib/database-utils.ts`
- `lib/document-helpers.js` → `lib/document-helpers.ts` 
- `lib/document-ops.js` → `lib/document-ops.ts`
- `lib/storage.js` → `lib/storage.ts`
- `lib/database-pool.js` → `lib/database-pool.ts`

#### Group B: HTTP & Validation (Agent 2)
- `lib/http-utils.js` → `lib/http-utils.ts`
- `lib/validators/parameter-validator.js` → `lib/validators/parameter-validator.ts`
- `lib/validators/validation-rules.js` → `lib/validators/validation-rules.ts`
- `lib/pagination-utils.js` → `lib/pagination-utils.ts`
- `lib/field-utils.js` → `lib/field-utils.ts`

#### Group C: Performance & Monitoring (Agent 3)
- `lib/performance-utils.js` → `lib/performance-utils.ts`
- `lib/performance/*.js` → `lib/performance/*.ts`
- `lib/health-check.js` → `lib/health-check.ts`
- `lib/perf.js` → `lib/perf.ts`
- `lib/test-memory-manager.js` → `lib/test-memory-manager.ts`

#### Group D: Circuit Breakers & Queues (Agent 4)
- `lib/circuit-breaker.js` → `lib/circuit-breaker.ts`
- `lib/circuit-breaker-factory.js` → `lib/circuit-breaker-factory.ts`
- `lib/async-queue.js` → `lib/async-queue.ts`
- `lib/cache-utils.js` → `lib/cache-utils.ts`
- `lib/lru-cache.js` → `lib/lru-cache.ts`

#### Group E: Utilities & Tools (Agent 5)
- `lib/utils.js` → `lib/utils.ts`
- `lib/email-utils.js` → `lib/email-utils.ts`
- `lib/logging-utils.js` → `lib/logging-utils.ts`
- `lib/serialization-utils.js` → `lib/serialization-utils.ts`
- `lib/streaming-json.js` → `lib/streaming-json.ts`

### Phase 2: Schema & Type Systems
- `lib/schema/*.js` → `lib/schema/*.ts`
- `lib/typeMap.js` → `lib/typeMap.ts`
- `lib/mongoose-mapper.js` → `lib/mongoose-mapper.ts`
- `lib/crud-service-factory.js` → `lib/crud-service-factory.ts`
- `lib/unique-validator.js` → `lib/unique-validator.ts`

### Phase 3: Storage & Advanced Features
- `lib/binary-storage.js` → `lib/binary-storage.ts`
- `lib/object-storage-binary.js` → `lib/object-storage-binary.ts`
- `lib/fast-operations.js` → `lib/fast-operations.ts`
- `lib/qgenutils-wrapper.js` → `lib/qgenutils-wrapper.ts`

### Phase 4: Index Files & Exports
- Update `index.ts` to match all converted modules
- Remove `index.js` (deprecated)
- Update all import paths to use `.js` extensions for ESM compatibility
- Ensure proper TypeScript type exports

### Phase 5: Test Files & Examples
- Convert test files to TypeScript where needed
- Update example files to use ESM imports
- Ensure all test runners work with new setup

## Technical Requirements

### ESM Conversion Rules
1. Replace `require()` with `import` statements
2. Replace `module.exports` with `export` statements
3. Use `.js` file extensions in import paths (ESM requirement)
4. Handle dynamic imports with `import()` syntax

### TypeScript Conversion Rules
1. Add proper type annotations for all function parameters
2. Define interfaces for complex objects
3. Use generic types where appropriate
4. Add `@types` packages for external dependencies
5. Handle `any` types with proper typing or `unknown`

### Import Path Strategy
- Keep relative imports for internal modules
- Use `.js` extensions in import statements (ESM requirement)
- Update index.ts imports to reflect new file structure

## Critical Dependencies
- **MongoDB/Mongoose**: Need proper type definitions
- **Express**: HTTP utilities require Express types
- **Node.js**: Use built-in Node.js types
- **Redis**: Cache utilities need Redis types

## Testing Strategy
1. Convert each file with basic TypeScript types
2. Run `npm run build` to verify compilation
3. Run `npm test` to ensure functionality preserved
4. Add type-specific tests where needed
5. Verify ESM imports work correctly

## Risk Mitigation
- **Backward compatibility**: Not required per instructions
- **Build failures**: Test each file individually before full build
- **Type errors**: Start with `any` and refine progressively
- **Import issues**: Use explicit `.js` extensions for ESM

## Success Criteria
- All `.js` files converted to `.ts`
- TypeScript compilation succeeds without errors
- All tests pass with new setup
- ESM imports work correctly
- Proper type coverage for core functionality

## Parallel Execution Plan
Using CSUP tmux codex sessions:
- **5 agents** working on different file groups simultaneously
- **1 planning agent** (main session) for coordination
- **1 testing agent** for validation after each phase
- Total estimated time: 30-45 minutes with parallel processing

## File Conversion Priority
1. **High Priority**: Core utilities (http, database, documents)
2. **Medium Priority**: Performance and monitoring tools
3. **Low Priority**: Examples and demo files

This plan ensures systematic conversion with minimal risk and maximum parallel efficiency using the CSUP workflow.