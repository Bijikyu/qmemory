# AGENTS.md

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

**Testing Strategy**: The library uses Jest with specific coverage thresholds (80% minimum). Production validation tests simulate real-world scenarios including concurrent access, high-volume operations, and error recovery. Agents should maintain this testing philosophy when adding new functionality.

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
- Test suite must maintain 95%+ code coverage
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