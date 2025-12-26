# Test Failure Analysis

Analyze and address the following test failures:

## Failed Test 1: /home/runner/workspace/index.GeneratedTest.test.ts

### Output:
```
  ● sendNotFound › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sendConflict › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sendInternalServerError › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sendServiceUnavailable › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateResponseObject › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● sanitizeMessage › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getTimestamp › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● ensureMongoDB › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● ensureUnique › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● handleMongoError › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● safeDbOperation › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● retryDbOperation › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● ensureIdempotency › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● optimizeQuery › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createAggregationPipeline › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findDocumentById › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● updateDocumentById › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● deleteDocumentById › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● cascadeDeleteDocument › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createDocument › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findDocuments › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findOneDocument › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● bulkUpdateDocuments › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● performUserDocOp › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● findUserDoc › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● deleteUserDoc › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● userDocActionOr404 › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● fetchUserDocOr404 › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● deleteUserDocOr404 › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● listUserDocs › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createUniqueDoc › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● updateUserDoc › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateDocumentUniqueness › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● hasUniqueFieldChanges › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● MemStorage › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● storage › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● greet › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● add › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● isEven › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● logFunctionEntry › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● logFunctionExit › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● logFunctionError › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validatePagination › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createPaginationMeta › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createPaginatedResponse › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateCursorPagination › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCursor › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCursorPaginationMeta › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCursorPaginatedResponse › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● validateSorting › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● DatabaseMetrics › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● RequestMetrics › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● SystemMetrics › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● PerformanceMonitor › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● performanceMonitor › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● withCache › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● initializeRedisClient › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● disconnectRedis › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● invalidateCache › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getCacheStats › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● createCache › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● incCacheHit › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● incCacheMiss › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● setCacheKeys › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getCacheMetrics › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● resetCacheMetrics › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● denormalizeObjectFields › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getMongoType › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● getSupportedTypes › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● isSupportedType › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● mapParameterToMongoType › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● mapParametersToSchema › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● generateMongooseSchema › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● generateMongoSchema › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● IStorage › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● MemoryBinaryStorage › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● FileSystemBinaryStorage › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

  ● StorageFactory › is defined

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
      at Object.<anonymous> (index.ts:207:1)
      at index.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (index.GeneratedTest.test.ts:7:16)

```

### Duration: 3174ms

---

## Failed Test 2: /home/runner/workspace/test/unit/storage.test.ts

### Output:
```
  ● MemStorage Class › createUser › should handle concurrent createUser calls hitting limit

    expect(received).rejects.toThrow()

    Received promise resolved instead of rejected
    Resolved to value: {"avatar": null, "displayName": null, "githubId": null, "id": 2, "username": "concurrent2"}

      190 |       const secondPromise = limited.createUser({ username: 'concurrent2' }); // start second user create
      191 |
    > 192 |       await expect(secondPromise).rejects.toThrow('Maximum user limit reached');
          |             ^
      193 |       const firstUser = await firstPromise;
      194 |       expect(firstUser.username).toBe('concurrent1');
      195 |       const allUsers = await limited.getAllUsers();

      at expect (node_modules/@jest/expect/node_modules/expect/build/index.js:113:15)
      at Object.<anonymous> (test/unit/storage.test.ts:192:13)

```

### Duration: 184ms

---

## Failed Test 3: /home/runner/workspace/test/unit/crud-service-factory.test.ts

### Output:
```
  ● crud-service-factory › create rejects duplicate records

    expect(received).rejects.toMatchObject(expected)

    - Expected  - 4
    + Received  + 1

    - Object {
    -   "code": "DUPLICATE",
    -   "field": "name",
    - }
    + [TypeError: Model.findOne(...).exec is not a function]

      147 |     const service = createCrudService(Model, 'widget', { uniqueField: 'name' });
      148 |
    > 149 |     await expect(service.create({ name: 'widget' })).rejects.toMatchObject({
          |                                                              ^
      150 |       code: 'DUPLICATE',
      151 |       field: 'name',
      152 |     });

      at Object.toMatchObject (node_modules/@jest/expect/node_modules/expect/build/index.js:218:22)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:149:62)

  ● crud-service-factory › create persists record and executes hooks

    TypeError: Model.findOne(...).exec is not a function

      171 |   return Model.findOne({
      172 |     [field]: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') },
    > 173 |   } as FilterQuery<TDoc>).exec(); // Use case-insensitive regex to prevent duplicates differing only by casing
          |                           ^
      174 | }
      175 |
      176 | /**

      at findByFieldIgnoreCase (lib/crud-service-factory.ts:173:27)
      at Object.create (lib/crud-service-factory.ts:234:30)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:167:35)

  ● crud-service-factory › getAll returns paginated results with metadata

    TypeError: query.skip(...).limit(...).exec is not a function

      276 |
      277 |     const [data, total] = await Promise.all([
    > 278 |       query.skip(skip).limit(limit).exec(), // Execute query with pagination to fetch subset
          |                                     ^
      279 |       Model.countDocuments(filters).exec(), // Count separately to compute pagination metadata safely
      280 |     ]);
      281 |

      at Object.getAll (lib/crud-service-factory.ts:278:37)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:183:34)

  ● crud-service-factory › update enforces duplicate checks and lifecycle hooks

    expect(received).rejects.toMatchObject(expected)

    - Expected  - 3
    + Received  + 1

    - Object {
    -   "code": "DUPLICATE",
    - }
    + [TypeError: Model.findById(...).exec is not a function]

      205 |     await expect(
      206 |       service.update('2', { name: 'Primary' }),
    > 207 |     ).rejects.toMatchObject({ code: 'DUPLICATE' });
          |               ^
      208 |
      209 |     const updated = await service.update('2', { name: 'Secondary Updated' });
      210 |

      at Object.toMatchObject (node_modules/@jest/expect/node_modules/expect/build/index.js:218:22)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:207:15)

  ● crud-service-factory › createPaginatedService returns enhanced response with extra data

    TypeError: paginatedQuery.exec is not a function

      515 |     const paginatedQuery = query.sort(sort).skip(skip).limit(limit) as HydratedFindQuery<TDoc>; // Preserve fluent query so we can execute once and keep helpers intact
      516 |     const [resources, totalCount] = await Promise.all([
    > 517 |       paginatedQuery.exec(), // Execute final query respecting user-provided enhancements
          |                      ^
      518 |       Model.countDocuments(filters).exec(), // Count documents separately to avoid mutating enhanced query
      519 |     ]);
      520 |

      at getPaginatedResources (lib/crud-service-factory.ts:517:22)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:227:26)

  ● crud-service-factory › createValidatedService delegates to base service with validation

    expect(received).resolves.toMatchObject()

    Received promise rejected instead of resolved
    Rejected to value: [TypeError: Model.findOne(...).exec is not a function]

      249 |     });
      250 |
    > 251 |     await expect(service.create({ name: 'Valid' })).resolves.toMatchObject({ name: 'Valid' });
          |           ^
      252 |     await expect(service.create({ })).rejects.toThrow(/name is required/);
      253 |   });
      254 | });

      at expect (node_modules/@jest/expect/node_modules/expect/build/index.js:113:15)
      at Object.<anonymous> (test/unit/crud-service-factory.test.ts:251:11)

```

### Duration: 86ms

---

## Failed Test 4: /home/runner/workspace/test/unit/database-pool.test.ts

### Output:
```
  ● Test suite failed to run

    [96mtest/unit/database-pool.test.ts[0m:[93m22[0m:[93m30[0m - [91merror[0m[90m TS1003: [0mIdentifier expected.

    [7m22[0m     stats: mockGetAllStats().['redis://example'],
    [7m  [0m [91m                             ~[0m

```

### Duration: 0ms

---

## Failed Test 5: /home/runner/workspace/test/unit/async-queue.test.ts

### Output:
```
  ● Test suite failed to run

    ReferenceError: Cannot access 'FakeBeeQueue' before initialization

      104 | jest.mock('bee-queue', () => ({
      105 |   __esModule: true,
    > 106 |   default: FakeBeeQueue,
          |            ^
      107 | }));
      108 |
      109 | describe('async-queue wrapper', () => {

      at test/unit/async-queue.test.ts:106:12
      at Object.<anonymous> (lib/async-queue.ts:1:1)
      at Object.<anonymous> (test/unit/async-queue.test.ts:3:1)

```

### Duration: 0ms

---

## Failed Test 6: /home/runner/workspace/test/unit/http-utils.test.ts

### Output:
```
  ● Test suite failed to run

    Configuration error:

    Could not locate module qtests/lib/envUtils.js mapped as:
    /home/runner/workspace/node_modules/qtests/dist/$1.js.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^qtests\/(.*)$/": "/home/runner/workspace/node_modules/qtests/dist/$1.js"
      },
      "resolver": undefined
    }

      4 |  */
      5 |
    > 6 | const testHelpers = require('qtests/lib/envUtils.js');
        |                     ^
      7 |
      8 | /**
      9 |  * Creates a standardized mock model for testing database operations

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/resolver.js:759:17)
      at Object.require (test/test-utils.js:6:21)
      at Object.<anonymous> (test/unit/http-utils.test.ts:11:1)

```

### Duration: 0ms

---

## Failed Test 7: /home/runner/workspace/test/unit/circuit-breaker.test.ts

### Output:
```
  ● CircuitBreakerWrapper typed events › should emit open event with typed listener

    TypeError: breaker.on is not a function

      19 |
      20 |     const openListener = jest.fn();
    > 21 |     breaker.on('open', openListener);
         |             ^
      22 |
      23 |     await expect(
      24 |       breaker.execute(async () => {

      at Object.<anonymous> (test/unit/circuit-breaker.test.ts:21:13)

  ● CircuitBreakerWrapper typed events › off should remove listeners before failure events fire

    TypeError: breaker.on is not a function

      45 |     const typedListener = (error: Error) => failureListener(error); // preserve typed signature
      46 |
    > 47 |     breaker.on('failure', typedListener);
         |             ^
      48 |     breaker.off('failure', typedListener);
      49 |
      50 |     await expect(

      at Object.<anonymous> (test/unit/circuit-breaker.test.ts:47:13)

```

### Duration: 39ms

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

### Duration: 35ms

---

## Failed Test 9: /home/runner/workspace/lib/mongoose-mapper.GeneratedTest.test.ts

### Output:
```
  ● mapParameterToMongoType › is defined

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
      at Object.<anonymous> (lib/schema/collection-schema-generator.ts:7:1)
      at Object.<anonymous> (lib/mongoose-mapper.ts:16:1)
      at lib/mongoose-mapper.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/mongoose-mapper.GeneratedTest.test.ts:7:16)

  ● mapParametersToSchema › is defined

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
      at Object.<anonymous> (lib/schema/collection-schema-generator.ts:7:1)
      at Object.<anonymous> (lib/mongoose-mapper.ts:16:1)
      at lib/mongoose-mapper.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/mongoose-mapper.GeneratedTest.test.ts:7:16)

  ● generateMongooseSchema › is defined

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
      at Object.<anonymous> (lib/schema/collection-schema-generator.ts:7:1)
      at Object.<anonymous> (lib/mongoose-mapper.ts:16:1)
      at lib/mongoose-mapper.GeneratedTest.test.ts:7:16
      at Object.<anonymous> (lib/mongoose-mapper.GeneratedTest.test.ts:7:16)

```

### Duration: 83ms

---

## Failed Test 10: /home/runner/workspace/demo-app.GeneratedTest.test.ts

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

    /home/runner/workspace/demo-app.ts:474
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

### Duration: 61ms

---

## Summary

- Total failed tests: 10
- Failed test files: /home/runner/workspace/index.GeneratedTest.test.ts, /home/runner/workspace/test/unit/storage.test.ts, /home/runner/workspace/test/unit/crud-service-factory.test.ts, /home/runner/workspace/test/unit/database-pool.test.ts, /home/runner/workspace/test/unit/async-queue.test.ts, /home/runner/workspace/test/unit/http-utils.test.ts, /home/runner/workspace/test/unit/circuit-breaker.test.ts, /home/runner/workspace/lib/field-utils.GeneratedTest.test.ts, /home/runner/workspace/lib/mongoose-mapper.GeneratedTest.test.ts, /home/runner/workspace/demo-app.GeneratedTest.test.ts
- Generated: 2025-12-26T16:38:49.545Z
