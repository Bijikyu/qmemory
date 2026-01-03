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
      24 | describe('Utils module', () => {
      25 |   describe('greet function', () => {
      26 |     test('should return greeting with provided name', () => {

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (test/unit/utils.test.ts:23:1)

```

### Duration: 0ms

---

## Failed Test 2: /home/runner/workspace/test/unit/unique-validator.test.ts

### Output:
```
  ● Test suite failed to run

    [96mtest/unit/unique-validator.test.ts[0m:[93m17[0m:[93m15[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m17[0m   save?: jest.Mock<Promise<TestDocument>, []>;
    [7m  [0m [91m              ~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m20[0m:[93m39[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m20[0m type FindOneLeanResult = { lean: jest.Mock<Promise<TestDocument | null>, []> };
    [7m  [0m [91m                                      ~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m22[0m:[93m47[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m22[0m function createFindOneMock(): { findOne: jest.Mock<FindOneLeanResult, [unknown]>; lean: jest.Mock<Promise<TestDocument | null>, []> } {
    [7m  [0m [91m                                              ~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m22[0m:[93m94[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m22[0m function createFindOneMock(): { findOne: jest.Mock<FindOneLeanResult, [unknown]>; lean: jest.Mock<Promise<TestDocument | null>, []> } {
    [7m  [0m [91m                                                                                             ~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m23[0m:[93m16[0m - [91merror[0m[90m TS2347: [0mUntyped function calls may not accept type arguments.

    [7m23[0m   const lean = jest.fn<Promise<TestDocument | null>, []>();
    [7m  [0m [91m               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m24[0m:[93m19[0m - [91merror[0m[90m TS2347: [0mUntyped function calls may not accept type arguments.

    [7m24[0m   const findOne = jest.fn<FindOneLeanResult, [unknown]>().mockReturnValue({ lean });
    [7m  [0m [91m                  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m34[0m:[93m30[0m - [91merror[0m[90m TS2347: [0mUntyped function calls may not accept type arguments.

    [7m34[0m   const findByIdSelectLean = jest.fn<Promise<TestDocument | null>, []>();
    [7m  [0m [91m                             ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m70[0m:[93m48[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<TestDocument, {}, {}, {}, Document<unknown, {}, TestDocument, {}> & TestDocument & Required<{ _id: string; }> & { ...; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'TestDocument' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'TestDocument'.

    [7m70[0m     const result = await checkDuplicateByField(Model, 'email', 'UPPER@example.com');
    [7m  [0m [91m                                               ~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m81[0m:[93m11[0m - [91merror[0m[90m TS2347: [0mUntyped function calls may not accept type arguments.

    [7m 81[0m     await expect(
    [7m   [0m [91m          ~~~~~~~[0m
    [7m 82[0m       validateUniqueField(Model, 'name', 'existing', null, 'widget'),
    [7m   [0m [91m~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[0m
    [7m...[0m 
    [7m 87[0m       value: 'existing',
    [7m   [0m [91m~~~~~~~~~~~~~~~~~~~~~~~~[0m
    [7m 88[0m     });
    [7m   [0m [91m~~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m82[0m:[93m27[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<TestDocument, {}, {}, {}, Document<unknown, {}, TestDocument, {}> & TestDocument & Required<{ _id: string; }> & { ...; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'TestDocument' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'TestDocument'.

    [7m82[0m       validateUniqueField(Model, 'name', 'existing', null, 'widget'),
    [7m  [0m [91m                          ~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m111[0m:[93m52[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<TestDocument, {}, {}, {}, Document<unknown, {}, TestDocument, {}> & TestDocument & Required<{ _id: string; }> & { ...; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'TestDocument' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'TestDocument'.

    [7m111[0m     const middleware = createUniqueFieldMiddleware(Model, 'email', 'user');
    [7m   [0m [91m                                                   ~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m143[0m:[93m46[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<TestDocument, {}, {}, {}, Document<unknown, {}, TestDocument, {}> & TestDocument & Required<{ _id: string; }> & { ...; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'TestDocument' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'TestDocument'.

    [7m143[0m     const checker = createBatchUniqueChecker(Model, 'name');
    [7m   [0m [91m                                             ~~~~~[0m
    [96mtest/unit/unique-validator.test.ts[0m:[93m153[0m:[93m45[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<TestDocument, {}, {}, {}, Document<unknown, {}, TestDocument, {}> & TestDocument & Required<{ _id: string; }> & { ...; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'TestDocument' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'TestDocument'.

    [7m153[0m     const validator = createUniqueValidator(Model, 'widget', 'name');
    [7m   [0m [91m                                            ~~~~~[0m

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

    [96mtest/unit/crud-service-factory.test.ts[0m:[93m18[0m:[93m15[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m18[0m   save?: jest.Mock<Promise<Entity>, []>;
    [7m  [0m [91m              ~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m22[0m:[93m14[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m22[0m   sort: jest.Mock<QueryResult<T>, [unknown?]>;
    [7m  [0m [91m             ~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m23[0m:[93m14[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m23[0m   skip: jest.Mock<QueryResult<T>, [number]>;
    [7m  [0m [91m             ~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m24[0m:[93m15[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m24[0m   limit: jest.Mock<QueryResult<T>, [number]>;
    [7m  [0m [91m              ~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m25[0m:[93m14[0m - [91merror[0m[90m TS2694: [0mNamespace 'global.jest' has no exported member 'Mock'.

    [7m25[0m   lean: jest.Mock<Promise<T[]>, []>;
    [7m  [0m [91m             ~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m93[0m:[93m52[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Entity' is not assignable to parameter of type 'Record<string, unknown>'.
      Index signature for type 'string' is missing in type 'Entity'.

    [7m93[0m     const found = store.find((doc) => matchesQuery(doc, query));
    [7m  [0m [91m                                                   ~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m98[0m:[93m53[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Entity' is not assignable to parameter of type 'Record<string, unknown>'.
      Index signature for type 'string' is missing in type 'Entity'.

    [7m98[0m     const data = store.filter((doc) => matchesQuery(doc, query));
    [7m  [0m [91m                                                    ~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m103[0m:[93m47[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Entity' is not assignable to parameter of type 'Record<string, unknown>'.
      Index signature for type 'string' is missing in type 'Entity'.

    [7m103[0m     return store.filter((doc) => matchesQuery(doc, query)).length;
    [7m   [0m [91m                                              ~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m147[0m:[93m39[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<Entity, {}, {}, {}, Document<unknown, {}, Entity, {}> & Entity & Required<{ _id: string; }> & { __v: number; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'Entity' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'Entity'.

    [7m147[0m     const service = createCrudService(Model, 'widget', { uniqueField: 'name' });
    [7m   [0m [91m                                      ~~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m160[0m:[93m39[0m - [91merror[0m[90m TS2344: [0mType 'Entity' does not satisfy the constraint 'DocumentShape'.
      Index signature for type 'string' is missing in type 'Entity'.

    [7m160[0m     const options: CrudServiceOptions<Entity> = {
    [7m   [0m [91m                                      ~~~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m166[0m:[93m39[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<Entity, {}, {}, {}, Document<unknown, {}, Entity, {}> & Entity & Required<{ _id: string; }> & { __v: number; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'Entity' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'Entity'.

    [7m166[0m     const service = createCrudService(Model, 'task', options);
    [7m   [0m [91m                                      ~~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m182[0m:[93m39[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<Entity, {}, {}, {}, Document<unknown, {}, Entity, {}> & Entity & Required<{ _id: string; }> & { __v: number; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'Entity' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'Entity'.

    [7m182[0m     const service = createCrudService(Model, 'item');
    [7m   [0m [91m                                      ~~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m199[0m:[93m39[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<Entity, {}, {}, {}, Document<unknown, {}, Entity, {}> & Entity & Required<{ _id: string; }> & { __v: number; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'Entity' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'Entity'.

    [7m199[0m     const service = createCrudService(Model, 'article', {
    [7m   [0m [91m                                      ~~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m223[0m:[93m44[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<Entity, {}, {}, {}, Document<unknown, {}, Entity, {}> & Entity & Required<{ _id: string; }> & { __v: number; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'Entity' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'Entity'.

    [7m223[0m     const service = createPaginatedService(Model, 'items', {
    [7m   [0m [91m                                           ~~~~~[0m
    [96mtest/unit/crud-service-factory.test.ts[0m:[93m247[0m:[93m44[0m - [91merror[0m[90m TS2345: [0mArgument of type 'Model<Entity, {}, {}, {}, Document<unknown, {}, Entity, {}> & Entity & Required<{ _id: string; }> & { __v: number; }, any>' is not assignable to parameter of type 'Model<DocumentShape, {}, {}, {}, Document<unknown, {}, DocumentShape, {}> & DocumentShape & Required<{ _id: unknown; }> & { ...; }, any>'.
      The types returned by 'castObject(...)' are incompatible between these types.
        Type 'Entity' is not assignable to type 'DocumentShape'.
          Index signature for type 'string' is missing in type 'Entity'.

    [7m247[0m     const service = createValidatedService(Model, 'task', {
    [7m   [0m [91m                                           ~~~~~[0m

```

### Duration: 0ms

---

## Failed Test 7: /home/runner/workspace/test/unit/circuit-breaker.test.ts

### Output:
```
  ● Test suite failed to run

    [96mtest/unit/circuit-breaker.test.ts[0m:[93m21[0m:[93m13[0m - [91merror[0m[90m TS2339: [0mProperty 'on' does not exist on type 'CircuitBreakerWrapper'.

    [7m21[0m     breaker.on('open', openListener);
    [7m  [0m [91m            ~~[0m
    [96mtest/unit/circuit-breaker.test.ts[0m:[93m32[0m:[93m20[0m - [91merror[0m[90m TS2339: [0mProperty 'state' does not exist on type 'CircuitBreakerWrapper'.

    [7m32[0m     expect(breaker.state).toBe(STATES.OPEN);
    [7m  [0m [91m                   ~~~~~[0m
    [96mtest/unit/circuit-breaker.test.ts[0m:[93m47[0m:[93m13[0m - [91merror[0m[90m TS2339: [0mProperty 'on' does not exist on type 'CircuitBreakerWrapper'.

    [7m47[0m     breaker.on('failure', typedListener);
    [7m  [0m [91m            ~~[0m
    [96mtest/unit/circuit-breaker.test.ts[0m:[93m48[0m:[93m13[0m - [91merror[0m[90m TS2339: [0mProperty 'off' does not exist on type 'CircuitBreakerWrapper'.

    [7m48[0m     breaker.off('failure', typedListener);
    [7m  [0m [91m            ~~~[0m

```

### Duration: 0ms

---

## Failed Test 8: /home/runner/workspace/test/unit/async-queue.test.ts

### Output:
```
  ● Test suite failed to run

    [96mtest/unit/async-queue.test.ts[0m:[93m142[0m:[93m29[0m - [91merror[0m[90m TS2339: [0mProperty 'addJob' does not exist on type 'AsyncQueueWrapper'.

    [7m142[0m     const job = await queue.addJob({ type: 'default', status: 'waiting' });
    [7m   [0m [91m                            ~~~~~~[0m
    [96mtest/unit/async-queue.test.ts[0m:[93m155[0m:[93m29[0m - [91merror[0m[90m TS2339: [0mProperty 'addJob' does not exist on type 'AsyncQueueWrapper'.

    [7m155[0m     const job = await queue.addJob({ type: 'default', status: 'active' });
    [7m   [0m [91m                            ~~~~~~[0m

```

### Duration: 0ms

---

## Summary

- Total failed tests: 8
- Failed test files: /home/runner/workspace/test/unit/utils.test.ts, /home/runner/workspace/test/unit/unique-validator.test.ts, /home/runner/workspace/test/unit/storage.test.ts, /home/runner/workspace/test/unit/http-utils.test.ts, /home/runner/workspace/test/unit/database-pool.test.ts, /home/runner/workspace/test/unit/crud-service-factory.test.ts, /home/runner/workspace/test/unit/circuit-breaker.test.ts, /home/runner/workspace/test/unit/async-queue.test.ts
- Generated: 2026-01-03T00:17:46.829Z
