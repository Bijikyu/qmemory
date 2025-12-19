# ESM TypeScript Conversion Plan

## Overview

This is a non-trivial task that requires converting the existing Node.js utility library to a full ESM TypeScript app. The project already has `"type": "module"` in package.json and TypeScript configuration, but several key .js files need conversion and proper ESM import/export patterns need to be established.

## Current State Analysis

### Files Requiring Conversion

1. **lib/performance/\*.js files (3 files)**
   - `database-metrics.js` - Database performance tracking with EventEmitter
   - `request-metrics.js` - HTTP request performance metrics
   - `system-metrics.js` - System resource monitoring

2. **Root level .js files**
   - `demo-app.js` - Main demo application (298 lines)
   - `server/objectStorage.js` - Object storage server

3. **Test files (.js)**
   - Multiple test files in test/ directory
   - Mock files in **mocks**/

4. **Configuration files**
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

## Parallel Execution Plan (CSUP)

This conversion can be parallelized using 3 tmux agents:

### Agent 1: Performance Metrics Conversion

- Convert all 3 performance metric files
- Focus on proper TypeScript interfaces and EventEmitter typing
- Test each file individually after conversion

### Agent 2: Demo Application Conversion

- Convert demo-app.js to TypeScript
- Fix all import statements
- Ensure Express.js typing is correct
- Test the demo application runs

### Agent 3: Import Statement Fixes

- Go through all TypeScript files and fix import extensions
- Focus on index.ts main entry point
- Test that all imports resolve correctly
- Run TypeScript compiler to check for errors

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

## Estimated Timeline

- **Phase 1 (Core Library):** 2-3 hours
- **Phase 2 (Application):** 1-2 hours
- **Phase 3 (Import Fixes):** 1-2 hours
- **Phase 4 (Testing):** 1-2 hours
- **Total:** 5-9 hours depending on complexity

This plan ensures a systematic conversion to ESM TypeScript while maintaining backward compatibility and ensuring all functionality continues to work as expected.
