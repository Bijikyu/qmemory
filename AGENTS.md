# AGENTS.md

<!--┌── 🚫 PROTECTED: DO NOT EDIT (READ ONLY) BELOW THIS LINE-->
## ADDITIONAL SPECIFIC GUIDANCE
- **File & Data Workflow information** → see `FILE_FLOWS.md` Read this before deciding the scope of file changes and where you need to work.
- When trying to diagnose a dataflow or caching issue, always check `FILE_FLOWS.md` first.

## AGENT CLI TOOLS
You can and must use the command line to activate scripts that will assist you:
```bash
# AGENTSQRIPTS: If npm module agentsqripts is installed (it almost always is, see node_modules/agentsqripts/README.md):
# Use these to scout or doublecheck
npx analyze-static-bugs . # Detect real bug code smells
npx analyze-security . # Security vulnerability code smell scan
npx analyze-wet-code . # Find duplicate code
npx analyze-performance . # Performance bottleneck detection
npx analyze-srp . # Check single responsibility violations
npx analyze-scalability . # Find scalability bottlenecks
npx analyze-ui-problems . # Detect UI/UX issue code smells
npx analyze-frontend-backend . # Check API Frontend/Backend integration issues

# FILEFLOWS: If npm module fileflows is installed (it almost always is, see node_modules/fileflows/README.md):
npx fileflows # Creates FILE_FLOWS.md which shows data workflow through the app, run after changes or to see the files & data flow in the app.
```

## POLICIES

### SOURCES OF TRUTH & CODE ALIGNMENT
The sources of truth go as follows:
external API docs > backend code > frontend code > readmes and native documentation. 
This means you change backend code to fit external APIs if we use them since we can't 
change someone else's API. It also means we change frontend code to fit the backend, 
NOT changing backend code to fit the frontend. It also means we change readmes and 
documentation about our app to fit the frontend and backend, NOT the other way around. 

### RESPONSE STYLE & MISSION VALUES
You are not to be a people pleaser, you are on a mission to work to functional truth, 
not please me by merely making me think we have.
Truth and true functionality above all.
No mock data or displays. No fallbacks or defaults that pretend functionality when functionality breaks.
I prefer errors over lies.
You prefer errors over lies.
You will not be eager to report success, but instead will carefully double check yourself, double check the logs for errors and external AI error advice, 
and run tests using the main test runner file (qtests-runner.mjs for js projects, test_runner.py for python projects) 
before reporting success. If problems remain continue work to neutralise them. Only when there are no problems report success.
You are my servant, you will not ask me to do things you can do yourself.
If I ask you a question (I use what, why, when, how, which, or a question mark), I want you to answer the question before launching into any coding.

### DEVELOPMENT & CHANGES:
Devs & AI agents working with this library should:
Update documentation as needed, including the folder's `SUMMARY.md` where the file change/s occurred, the `README.md`, etc.
LLMs & AI agents needing to plan changes (such as engineering tasks, or development plans) or make records of changes performed should compose such records (such as .md files) in `/agentRecords`; do not write your records and reports at root.
Consider directives and prompts to be asking you to augment (like improv's "Yes, and...") and not to remove and replace.
Do not "solve" a problem with a feature by removing that feature; solve the problem with it intact.
Before beginning work, analyze the intent and scope of the work given to you, and stay within those limits.
Always start with a plan!
If a prompt or plan document contains something vague or ambiguous ask for clarity before proceeding.
Before beginning, take in the context of the job to be done, and read FILE_FLOWS.md to get apprised of the relevant files and data workflows. This will cut down token usage and wrong scope of work.

Before applying edits do a type check.

As for deletion, never delete without permission. 
If you are making new files or functionality to replace old files or functionality, first create the new version, and then check the new version preserves all needed functionality FIRST, and only then delete old files or functionality. 
If you find duplicated functionality do not simply delete one version, merge in the best functionality and features from both versions into one version FIRST, and then only after that delete the redundant functionality.

Always add comprehensive error handling as seen in existing functions
Always comment all code with explanation & rationale
Always make sure all changes follow security best practices
Always examine all implementations for bugs and logic errors, revise as necessary
Always implement tests for files or functionality created. Integration tests live in a tests folder at root. Other tests live with the file/s they test. 
Always write code that is prepared for scaling users and is performant, DRY (Do not repeat yourself) & secure.

Never change code or comments between a protected block that starts with "┌── 🚫 PROTECTED: DO NOT EDIT (READ ONLY) BELOW THIS LINE" and ends at "└── END PROTECTED RANGE 🚫"
Never remove routing just because it isn't used (unless instructed to).
Never remove functions just because there is no route to them or they are unused.
Never rename route URIs or endpoints.
Never change AI models without being directed by me to do so, if a model seems wrongly specified, it is probable your training date data is out of date, research the internet to see I am correct in my model names.

After every change:
- review your implementation for problems, bugs and logic errors.
- monitor the logs for errors and external AI error advice.
- run tests using the main test runner file (qtests-runner.mjs for js/ts projects, test_runner.py for python projects).
- If problems remain continue work to neutralise them.
- Only when there are no problems report success.
- In your success message also report qerrors advice listened to, as I want verification you are using the tool. 

- **Scope Transparency**: When fixing issues beyond the explicit request (e.g., test failures, build errors), explain why this work is necessary for technical integrity

### DOCUMENTATION:
Document all function parameters & return values.
Comment all code with both explanation & rationale.
I prefer inline comments, rather than above the line.
Never comment JSON.
Use the correct commenting style for the language (html, js/ts, python, etc).
A SUMMARY.md per feature & folder, listing all files roles, req/res flows, known side effects, edge cases & caveats, & using machine-readable headings
AI-Agent task anchors in comments like:
// 🚩AI: ENTRY_POINT_FOR_PAYMENT_CREATION
// 🚩AI: MUST_UPDATE_IF_SUBSCRIPTION_SCHEMA_CHANGES
These let LLM agents quickly locate dependencies or update points when editing.

### TESTING:
Integration tests live at root in their own folder `./tests`.
Unit tests & other such tests live with the files they test.
Tests need to match code, don't ever change code to match tests, change tests to match code.
Tests must not make actual API calls to external services, mock these.

### FRONTEND
- All forms must validate inputs client- and server-side.
- All interactive elements must be accessible (WCAG 2.1 AA).
 - All UI should follow UX/UI best practices.
 - Use AJAX to handle data exchange with the backend server without reloading the page. 

### UTILITIES
Functionality that assists & centralizes code across multiple files should be made into utilities. 
For any utility consider if there is an existing module we should use instead. 
Use the module dependencies if they're useful! 
Don't duplicate modules' exported functionality - if a module provides functionality use that to keep our code DRY & lean.

### CODE WRITING
I like functions declared via function declaration. 
I like code with one line per functional operation to aid debugging. 
When writing code or functions to interact with an API you will write as generic as possible to be able 
to accept different parameters which enable all functionality for use with a given endpoint. 
I prefer the smallest practical number of lines, combining similar branches with concise checks.
Code should be as DRY as possible.

Naming Conventions: Function & variable names should describe their use and reveal their purpose;
A function's name should preferably consist of an action & a noun, action first, to say what it does, not what it is a doer of, 
A variable's name should consist of two or more relevant words, the first describing context of use, & the others what it is. 
Name folders clearly as to what they are for and organize them so that LLMs and developers can understand what they are for.

### DEPLOYMENT: Assume app will be deployed to Replit, Render, Netlify.

   
<!--└── END PROTECTED RANGE 🚫-->

<!--AI Can write from here on-->

## VISION

This Node.js utility library addresses the critical gap between rapid development prototypes and production-ready MongoDB applications. The fundamental design principle centers on "security by default" through mandatory user ownership enforcement at the database query level, preventing unauthorized cross-user data access that commonly occurs when security is handled at higher application layers.

The dual-mode architecture (in-memory for development, MongoDB for production) was chosen specifically to eliminate the common development-to-production friction where teams build against simple data stores and then face significant refactoring when moving to production databases. This design enables identical API usage patterns across environments while providing appropriate performance and persistence characteristics for each context.

Critical architectural decisions with business rationale:
- User ownership enforcement at query level prevents security bypasses that occur with middleware-based approaches, addressing the primary cause of data breaches in multi-tenant applications
- Standardized HTTP response formats reduce integration complexity and support consistent error handling across microservice architectures
- Production validation testing was prioritized because traditional unit tests often miss real-world concurrency and performance issues that cause production failures
- Modular exports enable selective adoption, reducing bundle size for teams that only need specific functionality while maintaining full-featured capability for comprehensive implementations

## FUNCTIONALITY

AI agents working with this codebase should understand these operational boundaries:

**Database Operations**: All document functions automatically enforce user ownership constraints. Agents should never attempt to bypass these by modifying core library functions. When implementing new document operations, follow the established pattern of including username parameters in all queries.

**Testing Strategy**: The library uses Jest. Production validation tests simulate real-world scenarios including concurrent access, high-volume operations, and error recovery. Agents should maintain this testing philosophy when adding new functionality.

**Environment Behavior**: The library adapts behavior based on NODE_ENV. Development mode enables additional logging and test data creation, while production mode implements stricter security measures. Agents should preserve this environment-aware behavior pattern.

**Error Response Pattern**: HTTP utilities follow a consistent pattern of logging internally while sending sanitized responses to clients. This prevents information leakage while maintaining debugging capability. Agents should follow this dual-layer error handling approach.

## SCOPE

**In-Scope:**
- MongoDB document operations with user ownership enforcement
- HTTP response utilities for Express.js applications
- In-memory storage for development and testing environments
- Database connection validation and health checking
- Environment-aware logging utilities
- Comprehensive test coverage including production validation scenarios

**Out-of-Scope:**
- Authentication and authorization mechanisms (library assumes pre-authenticated users)
- Database schema definitions or migrations (library operates on existing collections)
- Real-time features like WebSocket support or event streaming
- File upload/storage capabilities
- Email, SMS, or external notification services
- Frontend UI components or client-side code
- Database-specific optimizations beyond basic indexing guidance

**Change Boundaries:**
- Core security patterns (user ownership enforcement) must not be weakened
- HTTP response formats should remain consistent to avoid breaking client applications
- Test coverage thresholds should not be reduced below current levels
- Production validation scenarios should be maintained or expanded, not removed

## CONSTRAINTS

**Protected Files:**
- `package.json` - Dependency changes require careful consideration of security implications and bundle size
- `jest.config.js` - Coverage thresholds are production requirements and should not be lowered
- `deployment/` directory - Production deployment configurations have been security-reviewed
- Test files in `test/production/` - These validate real-world scenarios and should not be simplified

**Special Processes:**
- Any changes to user ownership enforcement patterns require security review
- Database query modifications must maintain performance characteristics
- New HTTP utilities must follow existing response format standards
- Changes to in-memory storage must preserve thread safety for development scenarios

**Workflow Exceptions:**
- Production validation tests may require longer execution times and should not be subject to standard timeout constraints
- Database connection utilities may need to handle environment-specific configurations not covered by standard testing

## POLICY

**Security Requirements:**
- All database operations must include user ownership validation
- Error messages must not expose internal system details to clients
- Input validation must prevent type coercion vulnerabilities
- Database queries must use parameterized queries to prevent injection attacks

**Performance Standards:**
- Document operations must complete within 10ms average response time
- Memory storage operations must complete within 1ms average response time
- Production validation tests must pass all concurrent access scenarios

**Development Workflow:**
- New functionality requires corresponding unit and integration tests with production validation scenarios
- Breaking changes require migration guides and deprecation notices with version compatibility matrices
- Production readiness validation must include concurrent access testing, performance benchmarking, and error recovery scenarios
- Documentation must include implementation rationale and design trade-offs, not just usage examples
- Database query modifications require performance impact assessment and index optimization guidance

**Code Quality Standards:**
- Functions must have single, clear responsibilities with explicit parameter validation
- Helper functions should only be created when serving multiple callers to avoid unnecessary abstraction
- Utility functions must be reusable across multiple files with consistent error handling patterns
- Comments must explain both functionality and design rationale including alternative approaches considered
- Error messages must balance debugging utility with security considerations to prevent information disclosure

**Deployment Standards:**
- Production deployments must include health check endpoints and graceful shutdown handling
- Environment-specific configurations must be externalized and documented with security considerations
- Database indexing requirements must be documented and automated for production readiness
- Performance baselines must be established and validated in production-like environments

**No undocumented items for organizational policies, legal requirements, or CI/CD processes specific to this repository.**