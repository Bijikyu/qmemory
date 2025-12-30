# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/test/unit/utils.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/utils.js' from 'test/unit/utils.test.ts'

      21 |  */
      22 |
    > 23 | import { greet, add, isEven } from '../../lib/utils.js';
         | ^
      24 |
      25 | describe('Utils module', () => {
      26 |   describe('greet function', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/utils.test.ts:23:1)

```

### Duration: 0ms

---

## Failed Test 2: /home/runner/workspace/test/unit/unique-validator.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/unique-validator.js' from 'test/unit/unique-validator.test.ts'

      1 | import type { Model } from 'mongoose';
      2 |
    > 3 | import {
        | ^
      4 |   checkDuplicateByField,
      5 |   validateUniqueField,
      6 |   createUniqueValidator,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/unique-validator.test.ts:3:1)

```

### Duration: 0ms

---

## Failed Test 3: /home/runner/workspace/test/unit/storage.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/storage.js' from 'test/unit/storage.test.ts'

      25 |  */
      26 |
    > 27 | import { MemStorage, storage } from '../../lib/storage.js'; // load class and singleton
         | ^
      28 |
      29 | interface InsertUser {
      30 |   username: string;

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/storage.test.ts:27:1)

```

### Duration: 0ms

---

## Failed Test 4: /home/runner/workspace/test/unit/http-utils.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/http-utils.js' from 'test/unit/http-utils.test.ts'

      21 |  */
      22 |
    > 23 | import {
         | ^
      24 |   sendNotFound,
      25 |   sendConflict,
      26 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/http-utils.test.ts:23:1)

```

### Duration: 0ms

---

## Failed Test 5: /home/runner/workspace/test/unit/database-pool.test.ts

### Output:
```
  ● Test suite failed to run

    [96mtest/unit/database-pool.test.ts[0m:[93m22[0m:[93m30[0m - [91merror[0m[90m TS1003: [0mIdentifier expected.

    [7m22[0m     stats: mockGetAllStats().['redis://example'],
    [7m  [0m [91m                             ~[0m

```

### Duration: 0ms

---

## Failed Test 6: /home/runner/workspace/test/unit/crud-service-factory.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/crud-service-factory.js' from 'test/unit/crud-service-factory.test.ts'

      1 | import type { Model } from 'mongoose';
      2 |
    > 3 | import {
        | ^
      4 |   createCrudService,
      5 |   createPaginatedService,
      6 |   createValidatedService,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:3:1)

```

### Duration: 0ms

---

## Failed Test 7: /home/runner/workspace/test/unit/circuit-breaker.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/circuit-breaker.js' from 'test/unit/circuit-breaker.test.ts'

      4 |  */
      5 |
    > 6 | import { STATES, createCircuitBreaker } from '../../lib/circuit-breaker.js';
        | ^
      7 |
      8 | describe('CircuitBreakerWrapper typed events', () => {
      9 |   const waitForEventLoop = () => new Promise(resolve => setImmediate(resolve)); // allow async emitter to flush

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/circuit-breaker.test.ts:6:1)

```

### Duration: 0ms

---

## Failed Test 8: /home/runner/workspace/test/unit/async-queue.test.ts

### Output:
```
  ● Test suite failed to run

    Cannot find module '../../lib/async-queue.js' from 'test/unit/async-queue.test.ts'

      1 | import { EventEmitter } from 'events';
      2 |
    > 3 | import {
        | ^
      4 |   AsyncQueueWrapper,
      5 |   createQueue,
      6 |   type JobData,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/async-queue.test.ts:3:1)

```

### Duration: 0ms

---

## Summary

- Total failed tests: 8
- Failed test files: /home/runner/workspace/test/unit/utils.test.ts, /home/runner/workspace/test/unit/unique-validator.test.ts, /home/runner/workspace/test/unit/storage.test.ts, /home/runner/workspace/test/unit/http-utils.test.ts, /home/runner/workspace/test/unit/database-pool.test.ts, /home/runner/workspace/test/unit/crud-service-factory.test.ts, /home/runner/workspace/test/unit/circuit-breaker.test.ts, /home/runner/workspace/test/unit/async-queue.test.ts
- Generated: 2025-12-30T11:30:26.953Z
