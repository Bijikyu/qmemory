# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/tests/unit/dual-db-postgres.test.ts

### Output:
```
  ● Dual DB + PostgreSQL adapter › DBTYPE=postgres routes createUniqueDoc + enforces uniqueness

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 409
    Received: 500

    Number of calls: 1

      204 |
      205 |     expect(dup).toBeUndefined();
    > 206 |     expect(res2.status).toHaveBeenCalledWith(409);
          |                         ^
      207 |   });
      208 |
      209 |   test('DBTYPE=postgres enforces ownership in findUserDoc/updateUserDoc', async () => {

      at Object.<anonymous> (tests/unit/dual-db-postgres.test.ts:206:25)

  ● Dual DB + PostgreSQL adapter › DBTYPE=postgres enforces ownership in findUserDoc/updateUserDoc

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 404
    Received: 500

    Number of calls: 1

      258 |     );
      259 |     expect(updatedByOther).toBeUndefined();
    > 260 |     expect(resUpdateOther.status).toHaveBeenCalledWith(404);
          |                                   ^
      261 |   });
      262 |
      263 |   test('DBTYPE=postgres routes listUserDocs and createCrudService', async () => {

      at Object.<anonymous> (tests/unit/dual-db-postgres.test.ts:260:35)

  ● Dual DB + PostgreSQL adapter › DBTYPE=postgres routes listUserDocs and createCrudService

    TypeError: (0 , index_1.createCrudService) is not a function

      277 |
      278 |     // Seed two posts for alice via CRUD service (tests routing for createCrudService).
    > 279 |     const service = createCrudService(posts as any, 'post', {
          |                                      ^
      280 |       uniqueField: 'title',
      281 |       searchableFields: ['title'] as any,
      282 |     }) as any;

      at Object.<anonymous> (tests/unit/dual-db-postgres.test.ts:279:38)

```

### Duration: 3294ms

---

## Summary

- Total failed tests: 1
- Failed test files: /home/runner/workspace/tests/unit/dual-db-postgres.test.ts
- Generated: 2026-01-16T07:41:44.175Z
