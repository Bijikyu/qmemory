# ESM & TypeScript Conversion Plan - CSUP Swarm Execution

## Overview

This is a non-trivial task requiring conversion of 40+ JavaScript files to TypeScript with full ESM compatibility. The project already has `"type": "module"` in package.json and TypeScript configuration, but needs comprehensive file conversion and proper ESM import/export patterns. Using CSUP tmux codex swarm for parallel processing.

## Current State Analysis

### Files Requiring Conversion

**Core Library Files (40+ files in /lib/):**

- All files still using .js extension need TypeScript conversion
- Files include database ops, HTTP utils, performance monitoring, etc.
- Many already have corresponding .ts files but need consolidation

**Root Level Files:**

- `index.js` - Main entry point (already using ESM imports)
- `demo-app.js` - Demo application
- `server/objectStorage.js` - Object storage server

**Test Files:**

- `test/unit/*.js` - 15+ unit test files
- `test/integration/*.js` - Integration tests
- `test/production/*.js` - Production validation tests
- `__mocks__/*.js` - Mock files for Jest

**Examples:**

- `examples/*.js` - 8+ demo files

**Configuration:**

- `eslint.config.js` - ESLint configuration
- `jest.config.js` - Jest configuration

### Current TypeScript Setup

- ✅ Package.json has `"type": "module"`
- ✅ TypeScript configured with ES2022 target
- ✅ tsconfig.json set up for ESM with `.js` extensions
- ✅ Main entry point (`index.ts`) already uses TypeScript
- ✅ Most lib files already converted to TypeScript

## Conversion Strategy

### Phase 1: Core Library Files (High Priority)

1. Convert `lib/performance/database-metrics.js` to TypeScript
2. Convert `lib/performance/request-metrics.js` to TypeScript
3. Convert `lib/performance/system-metrics.js` to TypeScript

**Key considerations:**

- Add proper TypeScript interfaces for all options and metrics objects
- Convert `require()` to `import` statements
- Add proper type annotations for all method parameters and return values
- Maintain EventEmitter functionality with proper typing

### Phase 2: Application Files (High Priority)

1. Convert `demo-app.js` to `demo-app.ts`
2. Convert `server/objectStorage.js` to TypeScript

**Key considerations:**

- Express.js types need to be properly imported
- All library imports need to use `.js` extensions for ESM compatibility
- Middleware functions need proper typing
- Error handling needs type safety

### Phase 3: Import Statement Fixes (Critical)

The main challenge is ensuring all import statements use `.js` extensions for ESM compatibility while TypeScript compiler handles the mapping.

**Required fixes:**

1. Update all imports in `index.ts` to use `.js` extensions
2. Update imports in all TypeScript files to use `.js` extensions
3. Ensure relative imports work properly with ESM

### Phase 4: Test Files (Medium Priority)

1. Convert test files to TypeScript or ensure they work with TypeScript imports
2. Update Jest configuration for TypeScript/ESM compatibility
3. Fix mock files to work with ESM

### Phase 5: Configuration Updates (Medium Priority)

1. Update ESLint configuration for TypeScript/ESM
2. Verify Jest configuration works with TypeScript and ESM
3. Update any remaining build scripts

## Detailed Implementation Plan

### Task 1: Convert Performance Metrics Files

**Files:** `lib/performance/{database-metrics,request-metrics,system-metrics}.js`

**Actions:**

- Rename files from `.js` to `.ts`
- Convert `const { EventEmitter } = require('events');` to `import { EventEmitter } from 'node:events';`
- Add TypeScript interfaces for options objects
- Add type annotations for all class methods
- Convert `module.exports = ClassName;` to `export default ClassName;`

**Expected interfaces needed:**

```typescript
interface DatabaseMetricsOptions {
  slowQueryThreshold?: number;
  maxSlowQueries?: number;
  maxRecentTimes?: number;
}

interface QueryMetadata {
  [key: string]: any;
}

interface SlowQuery {
  queryName: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata: QueryMetadata;
}
```

### Task 2: Convert Demo Application

**File:** `demo-app.js` → `demo-app.ts`

**Actions:**

- Convert all `require()` statements to `import`
- Add Express.js types: `import express, { Request, Response, NextFunction } from 'express';`
- Update library imports to use `.js` extensions
- Add proper typing for middleware functions
- Convert `module.exports` to ES6 exports

**Key imports to fix:**

```typescript
// Current (will break)
import { MemStorage, sendNotFound, ... } from './index';

// Should be (for ESM)
import { MemStorage, sendNotFound, ... } from './index.js';
import { logger, ... } from './lib/qgenutils-wrapper.js';
```

### Task 3: Fix All Import Extensions

**Files:** All TypeScript files in lib/

**Actions:**

- Update relative imports to use `.js` extensions
- Ensure index.ts imports work properly
- Test that all imports resolve correctly

**Example fixes:**

```typescript
// Before (may not work with ESM)
import { something } from './utils';

// After (ESM compatible)
import { something } from './utils.js';
```

### Task 4: Update TypeScript Configuration

**File:** `tsconfig.json`

**Actions:**

- Verify `moduleResolution: "node"` works with ESM
- Ensure `allowSyntheticDefaultImports: true` is set
- Check that `esModuleInterop: true` is configured

### Task 5: Update Build and Test Scripts

**Files:** `package.json`, Jest config

**Actions:**

- Ensure build script works with ESM TypeScript
- Update Jest configuration for TypeScript ESM
- Verify test runner works with new setup

## CSUP Swarm Execution Plan

### Phase 1: Spawn 6 Parallel Agents for Library Conversion

**Agent 1 - Core Utilities:**

- Convert: utils.js, storage.js, logging-utils.js, perf.js, lru-cache.js, cache-utils.js
- Focus: Basic utility types and interfaces

**Agent 2 - Database Operations:**

- Convert: database-utils.js, document-helpers.js, document-ops.js, mongoose-mapper.js
- Focus: MongoDB/Mongoose typing and database interfaces

**Agent 3 - HTTP & Validation:**

- Convert: http-utils.js, validators/\*.js, unique-validator.js, crud-service-factory.js
- Focus: Express.js types and validation interfaces

**Agent 4 - Performance & Monitoring:**

- Convert: performance/_.js, health-check.js, test-memory-manager.js, circuit-breaker_.js
- Focus: EventEmitter typing and metrics interfaces

**Agent 5 - Advanced Features:**

- Convert: binary-storage.js, streaming-json.js, fast-operations.js, serialization-utils.js, pagination-utils.js
- Focus: Complex generic types and advanced patterns

**Agent 6 - Schema & Types:**

- Convert: schema/\*.js, field-utils.js, typeMap.js, database-pool.js, async-queue.js
- Focus: Schema generation and type mapping interfaces

### Phase 2: Root Level & Application Files (1 Agent)

**Agent 7 - Applications:**

- Convert: index.js, demo-app.js, server/\*.js
- Focus: Express.js application typing and main entry point

### Phase 3: Test Files (1 Agent)

**Agent 8 - Tests:**

- Convert: test/**/\*.js, **mocks**/**/_.js, examples/_.js
- Focus: Jest TypeScript configuration and test typing

### Phase 4: Import/Export Coordination (1 Agent)

**Agent 9 - Import Fixer:**

- Fix all import statements to use .js extensions for ESM
- Update index.ts main exports
- Ensure TypeScript module resolution works
- Run final type checking and build validation

## Success Criteria

1. **TypeScript Compilation:** `npm run build` completes without errors
2. **Type Checking:** `npm run type-check` passes with no errors
3. **Tests Pass:** `npm test` runs successfully
4. **Demo App Works:** `npm run dev` starts the demo application
5. **ESM Compatibility:** All imports use proper `.js` extensions
6. **No Breaking Changes:** All exported APIs maintain same signatures

## Risk Mitigation

1. **Backup:** Keep original .js files until conversion is verified
2. **Incremental Testing:** Test each file conversion individually
3. **Import Mapping:** Ensure TypeScript properly maps .ts imports to .js extensions
4. **Jest Compatibility:** Verify Jest works with TypeScript ESM setup

## CSUP Execution Timeline

**Phase 1 (Parallel Library Conversion):** 15-20 minutes

- 6 agents working concurrently on 6-7 files each
- Each agent: convert files, add types, test individually

**Phase 2 (Application Files):** 5 minutes

- 1 agent converts root level and server files

**Phase 3 (Test Files):** 10 minutes

- 1 agent converts all test files and updates Jest config

**Phase 4 (Import Coordination):** 10 minutes

- 1 agent fixes all import statements and runs final validation

**Total Estimated Time:** 40-50 minutes with 9 parallel agents

## Success Criteria

1. **All files converted to TypeScript** with proper ESM imports/exports
2. **TypeScript compilation** (`npm run build`) completes without errors
3. **Type checking** (`npm run type-check`) passes with strict mode
4. **All tests pass** (`npm test`) with TypeScript/Jest integration
5. **Demo application runs** (`npm run dev`) successfully
6. **ESM compatibility** verified with .js extensions in imports
7. **No functionality regression** - all APIs maintain same signatures

## Swarm Coordination Commands

```bash
# Spawn agents for Phase 1
./scripts/spawn-agent.sh agent01 ./
./scripts/spawn-agent.sh agent02 ./
./scripts/spawn-agent.sh agent03 ./
./scripts/spawn-agent.sh agent04 ./
./scripts/spawn-agent.sh agent05 ./
./scripts/spawn-agent.sh agent06 ./

# Dispatch work prompts (≤1024 chars each)
./scripts/send-to-agent.sh agent01 "Convert core utilities: utils.js, storage.js, logging-utils.js, perf.js, lru-cache.js, cache-utils.js. Add TypeScript types and ESM exports."
./scripts/send-to-agent.sh agent02 "Convert database ops: database-utils.js, document-helpers.js, document-ops.js, mongoose-mapper.js. Focus on MongoDB types."
# ... continue for all agents
```

This plan leverages CSUP parallel processing to complete the comprehensive ESM TypeScript conversion in under an hour while maintaining code quality and functionality.
