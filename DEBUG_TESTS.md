# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/test/unit/crud-service-factory.test.ts

### Output:
```
  ● crud-service-factory › update enforces duplicate checks and lifecycle hooks

    TypeError: Model.findByIdAndUpdate(...).exec is not a function

      401 |         new: true,
      402 |         runValidators: true,
    > 403 |       }).exec(); // Execute update with validators ensuring Mongoose produces a fresh document
          |          ^
      404 |
      405 |       if (!updated) {
      406 |         const error = new Error(`${resourceType} not found`) as NotFoundError;

      at Object.update (lib/crud-service-factory.ts:403:10)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:226:21)

```

### Duration: 1328ms

---

## Summary

- Total failed tests: 1
- Failed test files: /home/runner/workspace/test/unit/crud-service-factory.test.ts
- Generated: 2026-01-08T19:00:01.627Z
