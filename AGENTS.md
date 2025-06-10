# AGENTS.md

## VISION

This utility library was designed as a foundational layer for Express.js applications requiring user-owned document management with MongoDB. The core design philosophy centers around defensive programming patterns that assume external systems (databases, networks) may fail at any time, and user input should never be trusted.

The in-memory storage component serves a dual purpose: it provides immediate functionality for development/testing environments while demonstrating the expected interface patterns that production database implementations should follow. This allows developers to build complete applications without external dependencies, then seamlessly transition to production databases.

The choice to implement custom document operations rather than relying solely on Mongoose stems from the need for consistent user ownership validation across all database interactions. Every document operation enforces that users can only access their own data, preventing common security vulnerabilities where developers forget to include user filtering in queries.

HTTP utility functions standardize error responses with timestamps and retry hints, reflecting lessons learned from distributed systems where debugging requires precise timing information and clients need guidance on retry strategies.

## FUNCTIONALITY

### AI Agent Guidelines

When working with this codebase, AI agents should:

1. **Preserve Security Patterns**: Never modify or bypass the user ownership validation in document operations. These patterns exist to prevent privilege escalation vulnerabilities.

2. **Maintain Response Consistency**: All HTTP error responses must include timestamps and appropriate status codes. Agents should not simplify these responses as the additional metadata is crucial for production debugging.

3. **Handle Database Failures Gracefully**: Always use `ensureMongoDB()` before database operations. Agents should not assume database availability or skip this validation step.

4. **Respect Memory Storage Limitations**: When modifying MemStorage, remember it's designed for development only. Do not add persistence features or complex querying capabilities that would change its fundamental nature.

5. **Follow Logging Patterns**: Production logging should be environment-aware (development vs production). The library uses centralized logging utilities that automatically adjust behavior based on NODE_ENV. Agents must use `logFunctionEntry()` and `logFunctionExit()` for consistency and should not bypass this infrastructure.

### Expected Behaviors

- **Input Validation**: All user inputs should be validated for type, format, and security before processing
- **Error Propagation**: Database and network errors should be properly caught and converted to appropriate HTTP responses
- **Resource Cleanup**: Operations should not leave hanging promises or unclosed connections
- **Atomic Operations**: Document updates should maintain data consistency even if operations are interrupted

## SCOPE

### In Scope
- MongoDB document operations with user ownership enforcement
- HTTP response standardization for Express.js applications
- Development-focused in-memory storage for prototyping
- Database connection validation and error handling
- Unit and integration testing for all utility functions

### Out of Scope
- Authentication and authorization mechanisms (assumes upstream middleware handles this)
- Session management or user registration workflows
- Database schema definitions or migrations
- Production-ready persistent storage implementations
- Caching layers or performance optimization beyond basic patterns
- Multi-tenant architecture or complex user hierarchies

### Permitted Changes
- Adding new HTTP status code helpers following existing patterns
- Extending document operations with additional query parameters
- Improving error messages and logging detail
- Adding new test cases and integration scenarios
- Performance optimizations that don't change API contracts

### Prohibited Changes
- Removing user ownership validation from document operations
- Changing the MemStorage interface (would break development workflows)
- Modifying core security patterns without explicit approval
- Adding heavyweight dependencies that change the library's footprint

## CONSTRAINTS

### Protected Components
- `lib/document-ops.js`: User ownership validation logic must not be modified without security review
- `lib/storage.js`: MemStorage interface is locked to prevent breaking changes in development environments
- `lib/logging-utils.js`: Centralized logging patterns must remain consistent across all modules
- `test/setup.js`: Global test configuration and mock patterns are standardized for CI/CD reliability
- `jest.config.js`: Coverage thresholds and test patterns are locked to maintain quality gates

### Special Process Requirements
- Security-related changes require additional review and testing
- Changes to HTTP response formats need backward compatibility verification
- Database utility modifications must maintain connection resilience patterns

### Workflow Exceptions
- Performance-critical changes may bypass normal code review for urgent production issues
- Documentation updates can be merged without full test suite completion

## POLICY

### Development Standards
This library follows CommonJS module patterns explicitly - ES modules are prohibited to maintain compatibility with existing Express.js applications that haven't migrated to ESM.

### Testing Requirements
All new functionality must achieve 80% code coverage minimum across branches, functions, lines, and statements as enforced by Jest configuration. Integration tests must cover real MongoDB connections when available, with graceful fallbacks for environments without database access. Test mocking follows standardized patterns defined in `test/setup.js` to ensure consistent behavior across all test suites.

### Error Handling Philosophy
The library implements "fail-fast" patterns for development environments but "graceful degradation" for production. This means validation errors should be immediately visible during development but handled elegantly in production to maintain service availability.

### Dependency Management
New dependencies require justification and security audit. The library intentionally maintains a minimal dependency footprint to reduce supply chain attack surface area.

### Breaking Changes
Any modification to exported function signatures or HTTP response formats constitutes a breaking change and requires major version increment following semantic versioning.

### Production Deployment Considerations
While designed for Replit/Render/Netlify deployment patterns, the library must remain platform-agnostic. Environment-specific optimizations should be opt-in rather than default behavior.