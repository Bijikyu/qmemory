# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/index.GeneratedTest.test.ts

### Output:
```
  ● sendNotFound › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sendConflict › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sendInternalServerError › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sendServiceUnavailable › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateResponseObject › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sanitizeMessage › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getTimestamp › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● ensureMongoDB › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● ensureUnique › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● handleMongoError › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● safeDbOperation › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● retryDbOperation › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● ensureIdempotency › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● optimizeQuery › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createAggregationPipeline › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findDocumentById › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● updateDocumentById › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● deleteDocumentById › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● cascadeDeleteDocument › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createDocument › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findDocuments › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findOneDocument › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● bulkUpdateDocuments › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● performUserDocOp › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findUserDoc › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● deleteUserDoc › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● userDocActionOr404 › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● fetchUserDocOr404 › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● deleteUserDocOr404 › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● listUserDocs › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createUniqueDoc › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● updateUserDoc › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateDocumentUniqueness › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● hasUniqueFieldChanges › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● MemStorage › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● storage › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● greet › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● add › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● isEven › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● logFunctionEntry › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● logFunctionExit › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● logFunctionError › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validatePagination › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createPaginationMeta › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createPaginatedResponse › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateCursorPagination › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCursor › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCursorPaginationMeta › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCursorPaginatedResponse › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateSorting › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● DatabaseMetrics › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● RequestMetrics › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● SystemMetrics › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● PerformanceMonitor › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● performanceMonitor › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● withCache › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● initializeRedisClient › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● disconnectRedis › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● invalidateCache › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getCacheStats › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCache › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● incCacheHit › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● incCacheMiss › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● setCacheKeys › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getCacheMetrics › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● resetCacheMetrics › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● normalizeFieldName › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getCollectionName › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● denormalizeFieldName › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● normalizeObjectFields › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● denormalizeObjectFields › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getMongoType › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getSupportedTypes › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● isSupportedType › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● mapParameterToMongoType › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● mapParametersToSchema › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● generateMongooseSchema › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● generateMongoSchema › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● IStorage › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● MemoryBinaryStorage › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● FileSystemBinaryStorage › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● StorageFactory › is defined

    Cannot find module './lib/http-utils.js' from 'index.ts'

    Require stack:
      index.ts
      index.GeneratedTest.test.ts

      4 |  */
      5 | // HTTP utilities
    > 6 | import {
        | ^
      7 |   sendNotFound,
      8 |   sendConflict,
      9 |   sendInternalServerError,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (index.ts:6:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

```

### Duration: 674ms

---

## Failed Test 2: /home/runner/workspace/lib/pagination-utils.GeneratedTest.test.ts

### Output:
```
  ● validatePagination › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

  ● createPaginationMeta › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

  ● createPaginatedResponse › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

  ● validateCursorPagination › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

  ● createCursor › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

  ● createCursorPaginationMeta › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

  ● createCursorPaginatedResponse › is defined

    Cannot find module './http-utils.js' from 'lib/pagination-utils.ts'

    Require stack:
      lib/pagination-utils.ts
      lib/pagination-utils.GeneratedTest.test.ts

      28 |  */
      29 | // Import existing HTTP utilities to maintain consistency with library patterns
    > 30 | import {
         | ^
      31 |   sendInternalServerError,
      32 |   validateResponseObject,
      33 |   sendErrorResponse,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/pagination-utils.ts:30:1)
      at lib/pagination-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/pagination-utils.GeneratedTest.test.ts:7:16)

```

### Duration: 78ms

---

## Failed Test 3: /home/runner/workspace/lib/document-ops.GeneratedTest.test.ts

### Output:
```
  ● performUserDocOp › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● findUserDoc › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● deleteUserDoc › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● userDocActionOr404 › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● fetchUserDocOr404 › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● deleteUserDocOr404 › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● listUserDocs › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● createUniqueDoc › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● updateUserDoc › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● validateDocumentUniqueness › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

  ● hasUniqueFieldChanges › is defined

    Cannot find module './http-utils.js' from 'lib/document-ops.ts'

    Require stack:
      lib/document-ops.ts
      lib/document-ops.GeneratedTest.test.ts

       6 | import mongoose, { Model, HydratedDocument, FilterQuery, AnyObject, Types } from 'mongoose';
       7 | import type { Response } from 'express';
    >  8 | import { sendNotFound } from './http-utils.js';
         | ^
       9 | import { ensureUnique } from './database-utils.js';
      10 | import { logFunctionEntry, logFunctionExit, logFunctionError } from './logging-utils.js';
      11 | import qerrors from 'qerrors';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/document-ops.ts:8:1)
      at lib/document-ops.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/document-ops.GeneratedTest.test.ts:7:16)

```

### Duration: 734ms

---

## Failed Test 4: /home/runner/workspace/lib/logging-utils.GeneratedTest.test.ts

### Output:
```
  ● logFunctionEntry › is defined

    Cannot find module './simple-wrapper.js' from 'lib/logging-utils.ts'

    Require stack:
      lib/logging-utils.ts
      lib/logging-utils.GeneratedTest.test.ts

      3 |  * Provides structured logging, audit logging, and performance monitoring helpers.
      4 |  */
    > 5 | import {
        | ^
      6 |   logger,
      7 |   createTypedError,
      8 |   ErrorTypes,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/logging-utils.ts:5:1)
      at lib/logging-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/logging-utils.GeneratedTest.test.ts:7:16)

  ● logFunctionExit › is defined

    Cannot find module './simple-wrapper.js' from 'lib/logging-utils.ts'

    Require stack:
      lib/logging-utils.ts
      lib/logging-utils.GeneratedTest.test.ts

      3 |  * Provides structured logging, audit logging, and performance monitoring helpers.
      4 |  */
    > 5 | import {
        | ^
      6 |   logger,
      7 |   createTypedError,
      8 |   ErrorTypes,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/logging-utils.ts:5:1)
      at lib/logging-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/logging-utils.GeneratedTest.test.ts:7:16)

```

### Duration: 41ms

---

## Failed Test 5: /home/runner/workspace/lib/performance-utils.GeneratedTest.test.ts

### Output:
```
  ● DatabaseMetrics › is defined

    Cannot find module './performance/database-metrics.js' from 'lib/performance-utils.ts'

    Require stack:
      lib/performance-utils.ts
      lib/performance-utils.GeneratedTest.test.ts

      13 |  * - Performance orchestration: performance/performance-monitor.js
      14 |  */
    > 15 | import DatabaseMetrics from './performance/database-metrics.js';
         | ^
      16 | import RequestMetrics from './performance/request-metrics.js';
      17 | import SystemMetrics from './performance/system-metrics.js';
      18 | import PerformanceMonitor from './performance/performance-monitor.js';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/performance-utils.ts:15:1)
      at lib/performance-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/performance-utils.GeneratedTest.test.ts:7:16)

  ● RequestMetrics › is defined

    Cannot find module './performance/database-metrics.js' from 'lib/performance-utils.ts'

    Require stack:
      lib/performance-utils.ts
      lib/performance-utils.GeneratedTest.test.ts

      13 |  * - Performance orchestration: performance/performance-monitor.js
      14 |  */
    > 15 | import DatabaseMetrics from './performance/database-metrics.js';
         | ^
      16 | import RequestMetrics from './performance/request-metrics.js';
      17 | import SystemMetrics from './performance/system-metrics.js';
      18 | import PerformanceMonitor from './performance/performance-monitor.js';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/performance-utils.ts:15:1)
      at lib/performance-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/performance-utils.GeneratedTest.test.ts:7:16)

  ● SystemMetrics › is defined

    Cannot find module './performance/database-metrics.js' from 'lib/performance-utils.ts'

    Require stack:
      lib/performance-utils.ts
      lib/performance-utils.GeneratedTest.test.ts

      13 |  * - Performance orchestration: performance/performance-monitor.js
      14 |  */
    > 15 | import DatabaseMetrics from './performance/database-metrics.js';
         | ^
      16 | import RequestMetrics from './performance/request-metrics.js';
      17 | import SystemMetrics from './performance/system-metrics.js';
      18 | import PerformanceMonitor from './performance/performance-monitor.js';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/performance-utils.ts:15:1)
      at lib/performance-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/performance-utils.GeneratedTest.test.ts:7:16)

  ● PerformanceMonitor › is defined

    Cannot find module './performance/database-metrics.js' from 'lib/performance-utils.ts'

    Require stack:
      lib/performance-utils.ts
      lib/performance-utils.GeneratedTest.test.ts

      13 |  * - Performance orchestration: performance/performance-monitor.js
      14 |  */
    > 15 | import DatabaseMetrics from './performance/database-metrics.js';
         | ^
      16 | import RequestMetrics from './performance/request-metrics.js';
      17 | import SystemMetrics from './performance/system-metrics.js';
      18 | import PerformanceMonitor from './performance/performance-monitor.js';

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/performance-utils.ts:15:1)
      at lib/performance-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/performance-utils.GeneratedTest.test.ts:7:16)

```

### Duration: 39ms

---

## Failed Test 6: /home/runner/workspace/lib/http-utils.GeneratedTest.test.ts

### Output:
```
  ● sendNotFound › is defined

    Cannot find module './simple-wrapper.js' from 'lib/http-utils.ts'

    Require stack:
      lib/http-utils.ts
      lib/http-utils.GeneratedTest.test.ts

       5 | // 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
       6 | import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
    >  7 | import {
         | ^
       8 |   sanitizeString,
       9 |   createPerformanceTimer,
      10 |   generateUniqueId,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/http-utils.ts:7:1)
      at lib/http-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/http-utils.GeneratedTest.test.ts:7:16)

  ● sendConflict › is defined

    Cannot find module './simple-wrapper.js' from 'lib/http-utils.ts'

    Require stack:
      lib/http-utils.ts
      lib/http-utils.GeneratedTest.test.ts

       5 | // 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
       6 | import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
    >  7 | import {
         | ^
       8 |   sanitizeString,
       9 |   createPerformanceTimer,
      10 |   generateUniqueId,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/http-utils.ts:7:1)
      at lib/http-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/http-utils.GeneratedTest.test.ts:7:16)

  ● sendInternalServerError › is defined

    Cannot find module './simple-wrapper.js' from 'lib/http-utils.ts'

    Require stack:
      lib/http-utils.ts
      lib/http-utils.GeneratedTest.test.ts

       5 | // 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
       6 | import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
    >  7 | import {
         | ^
       8 |   sanitizeString,
       9 |   createPerformanceTimer,
      10 |   generateUniqueId,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/http-utils.ts:7:1)
      at lib/http-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/http-utils.GeneratedTest.test.ts:7:16)

  ● sendServiceUnavailable › is defined

    Cannot find module './simple-wrapper.js' from 'lib/http-utils.ts'

    Require stack:
      lib/http-utils.ts
      lib/http-utils.GeneratedTest.test.ts

       5 | // 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
       6 | import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
    >  7 | import {
         | ^
       8 |   sanitizeString,
       9 |   createPerformanceTimer,
      10 |   generateUniqueId,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/http-utils.ts:7:1)
      at lib/http-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/http-utils.GeneratedTest.test.ts:7:16)

  ● validateResponseObject › is defined

    Cannot find module './simple-wrapper.js' from 'lib/http-utils.ts'

    Require stack:
      lib/http-utils.ts
      lib/http-utils.GeneratedTest.test.ts

       5 | // 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
       6 | import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
    >  7 | import {
         | ^
       8 |   sanitizeString,
       9 |   createPerformanceTimer,
      10 |   generateUniqueId,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/http-utils.ts:7:1)
      at lib/http-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/http-utils.GeneratedTest.test.ts:7:16)

  ● sanitizeMessage › is defined

    Cannot find module './simple-wrapper.js' from 'lib/http-utils.ts'

    Require stack:
      lib/http-utils.ts
      lib/http-utils.GeneratedTest.test.ts

       5 | // 🚩AI: ENTRY_POINT_FOR_HTTP_RESPONSE_HANDLING
       6 | import type { Response } from 'express'; // Ensure we leverage Express typings for runtime safety guarantees
    >  7 | import {
         | ^
       8 |   sanitizeString,
       9 |   createPerformanceTimer,
      10 |   generateUniqueId,

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/http-utils.ts:7:1)
      at lib/http-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/http-utils.GeneratedTest.test.ts:7:16)

```

### Duration: 51ms

---

## Failed Test 7: /home/runner/workspace/demo-app.GeneratedTest.test.ts

### Output:
```
  ● app › is defined

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /home/runner/workspace/demo-app.ts:570
    const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
                                                            ^^^^

    SyntaxError: Cannot use 'import.meta' outside a module

       5 | let testModule: any;
       6 | beforeAll(async () => {
    >  7 |   testModule = await import('./demo-app');
         |                ^
       8 | });
       9 |
      10 | // Deterministic test helpers

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1505:14)
      at demo-app.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (demo-app.GeneratedTest.test.ts:7:16)

```

### Duration: 45ms

---

## Failed Test 8: /home/runner/workspace/lib/field-utils.GeneratedTest.test.ts

### Output:
```
  ● normalizeFieldName › is defined

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /home/runner/workspace/node_modules/change-case/dist/index.js:15
    export function split(value) {
    ^^^^^^

    SyntaxError: Unexpected token 'export'

    > 1 | import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
        | ^
      2 | import pluralize from 'pluralize';
      3 |
      4 | type PlainObject = Record<string, unknown>;

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1505:14)
      at Object.<anonymous> (lib/field-utils.ts:1:1)
      at lib/field-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/field-utils.GeneratedTest.test.ts:7:16)

  ● getCollectionName › is defined

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /home/runner/workspace/node_modules/change-case/dist/index.js:15
    export function split(value) {
    ^^^^^^

    SyntaxError: Unexpected token 'export'

    > 1 | import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
        | ^
      2 | import pluralize from 'pluralize';
      3 |
      4 | type PlainObject = Record<string, unknown>;

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1505:14)
      at Object.<anonymous> (lib/field-utils.ts:1:1)
      at lib/field-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/field-utils.GeneratedTest.test.ts:7:16)

  ● denormalizeFieldName › is defined

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /home/runner/workspace/node_modules/change-case/dist/index.js:15
    export function split(value) {
    ^^^^^^

    SyntaxError: Unexpected token 'export'

    > 1 | import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
        | ^
      2 | import pluralize from 'pluralize';
      3 |
      4 | type PlainObject = Record<string, unknown>;

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1505:14)
      at Object.<anonymous> (lib/field-utils.ts:1:1)
      at lib/field-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/field-utils.GeneratedTest.test.ts:7:16)

  ● normalizeObjectFields › is defined

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    /home/runner/workspace/node_modules/change-case/dist/index.js:15
    export function split(value) {
    ^^^^^^

    SyntaxError: Unexpected token 'export'

    > 1 | import { camelCase, kebabCase, pascalCase, snakeCase } from 'change-case';
        | ^
      2 | import pluralize from 'pluralize';
      3 |
      4 | type PlainObject = Record<string, unknown>;

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1505:14)
      at Object.<anonymous> (lib/field-utils.ts:1:1)
      at lib/field-utils.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/field-utils.GeneratedTest.test.ts:7:16)

```

### Duration: 41ms

---

## Failed Test 9: /home/runner/workspace/lib/mongoose-mapper.GeneratedTest.test.ts

### Output:
```
  ● mapParameterToMongoType › is defined

    Cannot find module './schema/schema-generator.js' from 'lib/mongoose-mapper.ts'

    Require stack:
      lib/mongoose-mapper.ts
      lib/mongoose-mapper.GeneratedTest.test.ts

      13 |  * - Collection schemas: schema/collection-schema-generator.js
      14 |  */
    > 15 | import { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema } from './schema/schema-generator.js';
         | ^
      16 | import { generateMongoSchema } from './schema/collection-schema-generator.js';
      17 | export { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema, generateMongoSchema };
      18 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/mongoose-mapper.ts:15:1)
      at lib/mongoose-mapper.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/mongoose-mapper.GeneratedTest.test.ts:7:16)

  ● mapParametersToSchema › is defined

    Cannot find module './schema/schema-generator.js' from 'lib/mongoose-mapper.ts'

    Require stack:
      lib/mongoose-mapper.ts
      lib/mongoose-mapper.GeneratedTest.test.ts

      13 |  * - Collection schemas: schema/collection-schema-generator.js
      14 |  */
    > 15 | import { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema } from './schema/schema-generator.js';
         | ^
      16 | import { generateMongoSchema } from './schema/collection-schema-generator.js';
      17 | export { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema, generateMongoSchema };
      18 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/mongoose-mapper.ts:15:1)
      at lib/mongoose-mapper.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/mongoose-mapper.GeneratedTest.test.ts:7:16)

  ● generateMongooseSchema › is defined

    Cannot find module './schema/schema-generator.js' from 'lib/mongoose-mapper.ts'

    Require stack:
      lib/mongoose-mapper.ts
      lib/mongoose-mapper.GeneratedTest.test.ts

      13 |  * - Collection schemas: schema/collection-schema-generator.js
      14 |  */
    > 15 | import { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema } from './schema/schema-generator.js';
         | ^
      16 | import { generateMongoSchema } from './schema/collection-schema-generator.js';
      17 | export { mapParameterToMongoType, mapParametersToSchema, generateMongooseSchema, generateMongoSchema };
      18 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.<anonymous> (lib/mongoose-mapper.ts:15:1)
      at lib/mongoose-mapper.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/mongoose-mapper.GeneratedTest.test.ts:7:16)

```

### Duration: 34ms

---

## Failed Test 10: /home/runner/workspace/test/unit/utils.test.ts

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

## Failed Test 11: /home/runner/workspace/test/unit/unique-validator.test.ts

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

## Failed Test 12: /home/runner/workspace/test/unit/storage.test.ts

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

## Failed Test 13: /home/runner/workspace/test/unit/http-utils.test.ts

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

## Failed Test 14: /home/runner/workspace/test/unit/database-pool.test.ts

### Output:
```
  ● Test suite failed to run

    [96mtest/unit/database-pool.test.ts[0m:[93m22[0m:[93m30[0m - [91merror[0m[90m TS1003: [0mIdentifier expected.

    [7m22[0m     stats: mockGetAllStats().['redis://example'],
    [7m  [0m [91m                             ~[0m

```

### Duration: 0ms

---

## Failed Test 15: /home/runner/workspace/test/unit/crud-service-factory.test.ts

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

## Failed Test 16: /home/runner/workspace/test/unit/circuit-breaker.test.ts

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

## Failed Test 17: /home/runner/workspace/test/unit/async-queue.test.ts

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

- Total failed tests: 17
- Failed test files: /home/runner/workspace/index.GeneratedTest.test.ts, /home/runner/workspace/lib/pagination-utils.GeneratedTest.test.ts, /home/runner/workspace/lib/document-ops.GeneratedTest.test.ts, /home/runner/workspace/lib/logging-utils.GeneratedTest.test.ts, /home/runner/workspace/lib/performance-utils.GeneratedTest.test.ts, /home/runner/workspace/lib/http-utils.GeneratedTest.test.ts, /home/runner/workspace/demo-app.GeneratedTest.test.ts, /home/runner/workspace/lib/field-utils.GeneratedTest.test.ts, /home/runner/workspace/lib/mongoose-mapper.GeneratedTest.test.ts, /home/runner/workspace/test/unit/utils.test.ts, /home/runner/workspace/test/unit/unique-validator.test.ts, /home/runner/workspace/test/unit/storage.test.ts, /home/runner/workspace/test/unit/http-utils.test.ts, /home/runner/workspace/test/unit/database-pool.test.ts, /home/runner/workspace/test/unit/crud-service-factory.test.ts, /home/runner/workspace/test/unit/circuit-breaker.test.ts, /home/runner/workspace/test/unit/async-queue.test.ts
- Generated: 2025-12-30T04:13:05.537Z
