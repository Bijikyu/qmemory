# qmemory Library

## Overview

This is a comprehensive Node.js utility library providing MongoDB document operations, HTTP utilities, and in-memory storage solutions. The library is designed with a "security by default" philosophy, implementing user ownership enforcement at the database query level to prevent unauthorized access to documents. Its main purpose is to offer a robust, secure, and flexible foundation for data management and API development within Node.js applications, supporting both rapid development and scalable production environments.

## User Preferences

- **Scope Transparency**: When fixing issues beyond the explicit request (e.g., test failures, build errors), explain why this work is necessary for technical integrity.
- **Documentation**: Document all function parameters & return values. Comment all code with both explanation & rationale. I prefer inline comments, rather than above the line. Never comment JSON. Use the correct commenting style for the language (html, js/ts, python, etc). A `SUMMARY.md` per feature & folder, listing all files roles, req/res flows, known side effects, edge cases & caveats, & using machine-readable headings. AI-Agent task anchors in comments like: `// 🚩AI: ENTRY_POINT_FOR_PAYMENT_CREATION` `// 🚩AI: MUST_UPDATE_IF_SUBSCRIPTION_SCHEMA_CHANGES` These let LLM agents quickly locate dependencies or update points when editing.
- **Testing**: Integration tests live at root in their own folder `./tests`. Unit tests & other such tests live with the files they test. Tests need to match code, don't ever change code to match tests, change tests to match code. Tests must not make actual API calls to external services, mock these.
- **Frontend**: All forms must validate inputs client- and server-side. All interactive elements must be accessible (WCAG 2.1 AA). All UI should follow UX/UI best practices. Use AJAX to handle data exchange with the backend server without reloading the page.
- **Utilities**: Functionality that assists & centralizes code across multiple files should be made into utilities. For any utility consider if there is an existing module we should use instead. Use the module dependencies if they're useful! Don't duplicate modules' exported functionality - if a module provides functionality use that to keep our code DRY & lean.
- **Code Writing**: I like functions declared via function declaration. I like code with one line per functional operation to aid debugging. When writing code or functions to interact with an API you will write as generic as possible to be able to accept different parameters which enable all functionality for use with a given endpoint. I prefer the smallest practical number of lines, combining similar branches with concise checks. Code should be as DRY as possible.
- **Naming Conventions**: Function & variable names should describe their use and reveal their purpose. A function's name should preferably consist of an action & a noun, action first, to say what it does, not what it is a doer of. A variable's name should consist of two or more relevant words, the first describing context of use, & the others what it is. Name folders clearly as to what they are for and organize them so that LLMs and developers can understand what they are for.
- **Deployment**: Assume app will be deployed to Replit, Render, Netlify.
- **Workflow Communication**: Always state whether a task is "trivial" or "non-trivial" and explain why. Always state how many codex workflows will be run (0, 1, or 2-6) and the reasoning.
- **Test Execution Ownership**: Codex runs `npm test`, not Replit Agent or user.
- **Workflow Failure Recovery**: Immediately restart failed workflows using the same prompt/task assignment.
- **Prompt.txt Management**: Rewrite `prompt.txt` completely before each workflow start. Wait 100ms between workflow starts. After launching all workflows, immediately clear `prompt.txt` or stop all idle workflows to prevent unwanted restarts.

## System Architecture

### Stack
The project uses an npm ESM Module with TypeScript.

### Dual-Mode Architecture
The system operates in two distinct modes:
- **Development Mode**: Utilizes in-memory storage for efficient prototyping and testing.
- **Production Mode**: Connects to MongoDB for robust and persistent data storage.

### Modular Design and Single Responsibility Principle (SRP)
The library adheres to a strict modular design following the Single Responsibility Principle. Each file encapsulates one concrete responsibility, promoting clear naming, minimal imports/exports, and reduced coupling. This design simplifies testing, enhances readability for both developers and AI agents, and optimizes LLM token usage by loading only necessary code segments. Public functionality is exposed through a barrel export pattern via the main `index.js` file.

### Architectural Components
1.  **Entry Point**: `index.js` exports public functions.
2.  **Core Library**: `lib/` directory contains utility implementations.
3.  **Configuration**: `config/` directory includes `localVars.js` for environment variables and constants.

### Key Features and Technical Implementations
-   **User Ownership Enforcement**: Implemented at the database query level to ensure "security by default."
-   **HTTP Utilities (`lib/http-utils.js`)**: Provides Express.js HTTP response helpers.
-   **Database Utilities (`lib/database-utils.js`)**: Manages MongoDB connection validation and utilities.
-   **Document Operations (`lib/document-ops.js`)**: Offers high-level CRUD operations with integrated user ownership checks.
-   **In-Memory Storage (`lib/storage.js`)**: Handles in-memory storage for user data.
-   **Binary Storage (`lib/binary-storage.js`)**: Defines an interface for binary data storage.
-   **Object Storage Binary (`lib/object-storage-binary.js`)**: Implements cloud-based binary storage using Replit Object Storage.
-   **Utility Functions (`lib/utils.js`)**: Contains basic, general-purpose utility functions.
-   **Logging Utilities (`lib/logging-utils.js`)**: Centralizes logging patterns for consistent output.
-   **Pagination Utilities (`lib/pagination-utils.js`)**: Validates pagination parameters and formats responses.
-   **Performance Utilities (`lib/performance-utils.js`)**: Collects performance metrics and monitors application performance.
-   **Cache Utilities (`lib/cache-utils.js`)**: Provides Redis-based caching with environment-aware behavior.

### Global Constants & Environment Variable Exporting
All hardcoded constants and environment variables are managed in `/config/localVars.js`. This file serves as the single source of truth; new values can be added, but existing ones must not be modified, deleted, or moved. Environment variables are exported directly from this file and imported as a whole object into other modules to prevent merge conflicts and ensure consistent naming.

### Universal I/O
Functions are designed for universal input/output. Input parameters are passed via a `data` object, and results are consistently returned as a `result` object.

## External Dependencies

-   **MongoDB**: Persistent data storage for production mode.
-   **Express.js**: Web application framework, utilized for HTTP response helpers.
-   **Replit Object Storage**: Cloud-based storage solution for binary data.
-   **Redis**: Used for implementing caching mechanisms.
-   **Codex CLI**: Used for executing automated tasks and parallel workflows.
-   **npm**: Package manager for Node.js modules.