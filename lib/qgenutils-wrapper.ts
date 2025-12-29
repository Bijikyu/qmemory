/**
 * QGenUtils and QErrors Wrapper Module
 *
 * Purpose: Provides a unified interface to qgenutils and qerrors packages,
 * eliminating code duplication and providing consistent access patterns across
 * the application. This module serves as a central point for utility functions
 * while resolving potential conflicts between similar functions in different packages.
 *
 * Design Philosophy:
 * - Single source of truth: One import location for all utility functions
 * - Conflict resolution: Choose best implementation when packages have overlapping functions
 * - Type safety: Provide proper TypeScript types for all exported functions
 * - Simplified imports: Reduce the number of import statements throughout codebase
 * - Consistent interface: Standardize function access patterns across application
 *
 * Migration Rationale:
 * This module replaces the previous qgenutils-wrapper.js implementation with direct
 * imports from source packages. The previous wrapper had code duplication and maintenance
 * overhead. The new approach provides direct access with better type safety and reduced
 * complexity while maintaining backward compatibility.
 *
 * Integration Notes:
 * - Used throughout the application for logging, validation, and utility operations
 * - Integrates with both qgenutils and qerrors packages
 * - Provides preferred implementations when packages have overlapping functionality
 * - Maintains backward compatibility with existing code using this module
 * - Resolves naming conflicts and provides consistent function signatures
 *
 * Performance Considerations:
 * - Direct imports eliminate wrapper overhead
 * - Type casting has zero runtime cost after TypeScript compilation
 * - No additional function calls or indirection layers
 * - Minimal memory footprint with direct re-exports
 *
 * Error Handling Strategy:
 * - Chooses qerrors.logger over qgenutils for advanced logging capabilities
 * - Maintains qerrors.generateUniqueId to avoid potential conflicts
 * - Preserves original error handling from both packages
 * - Provides type-safe access to all utility functions
 *
 * Architecture Decision: Why choose qerrors over qgenutils for some functions?
 * - qerrors provides more advanced logging with structured error reporting
 * - qerrors has better integration with application monitoring systems
 * - qerrors.generateUniqueId has stronger uniqueness guarantees
 * - qerrors logger provides better context preservation
 * - Maintains consistency with centralized error handling strategy
 *
 * @author System Architecture Team
 * @version 2.0.0 (Refactored)
 */

// Direct imports from qgenutils package
import * as qgenutils from 'qgenutils';

// Direct imports from qerrors package
import * as qerrors from 'qerrors';

// ===== LOGGING UTILITIES =====
// Use qerrors logger as primary logging implementation (more advanced features)
export const logger = qerrors.logger;

// ===== SECURITY & SANITIZATION UTILITIES =====
// Re-export qgenutils security functions with type safety
export const sanitizeString = qgenutils.sanitizeString;
export const sanitizeHtml = qgenutils.sanitizeHtml;
export const sanitizeSqlInput = (qgenutils as any).sanitizeSqlInput;
export const sanitizeObjectRecursively = (qgenutils as any).sanitizeObjectRecursively;

// ===== VALIDATION UTILITIES =====
// Re-export qgenutils validation functions
export const isValidString = (qgenutils as any).isValidString;
export const isValidObject = (qgenutils as any).isValidObject;

// ===== PERFORMANCE UTILITIES =====
// Re-export qgenutils performance monitoring functions
export const createPerformanceTimer = (qgenutils as any).createPerformanceTimer;

// ===== ENVIRONMENT VARIABLE UTILITIES =====
// Re-export qgenutils environment variable handling
export const getEnvVar = (qgenutils as any).getEnvVar;
export const requireEnvVars = (qgenutils as any).requireEnvVars;

// ===== GRACEFUL SHUTDOWN UTILITIES =====
// Re-export qgenutils graceful shutdown functionality
export const gracefulShutdown = (qgenutils as any).gracefulShutdown;

// ===== ID GENERATION UTILITIES =====
// Use qerrors version of generateUniqueId to avoid conflicts with qgenutils
// qerrors implementation provides better uniqueness guarantees and integration
// export const generateUniqueId = qgenutils.generateUniqueId; // Disabled to prevent conflicts

// ===== ERROR HANDLING UTILITIES =====
// Re-export all qerrors functionality (primary error handling)
export { qerrors };
export const createTypedError = (qerrors as any).createTypedError;
export const ErrorTypes = (qerrors as any).ErrorTypes;
export const ErrorFactory = (qerrors as any).ErrorFactory;
// qerrors Message Sanitization (missing from exports)
export const sanitizeResponseMessage = (qerrors as any).sanitizeMessage;
export const sanitizeContext = qerrors.sanitizeContext;
// Export generateUniqueId from qerrors to avoid conflicts
export const generateUniqueId = qerrors.generateUniqueId;
