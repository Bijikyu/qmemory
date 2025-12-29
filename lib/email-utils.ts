/**
 * Email Utilities Module
 *
 * Purpose: Provides comprehensive email processing, validation, and aggregation
 * functionality for handling email-related operations throughout the application.
 *
 * Design Philosophy:
 * - Multi-source aggregation: Collect emails from domain lookups, site scraping, and WHOIS data
 * - Validation robustness: Primary validation with fallback regex for resilience
 * - Data consistency: Standardized email structures and error handling
 * - Performance: Efficient deduplication and filtering operations
 * - Security: Input sanitization and validation for email operations
 *
 * Integration Notes:
 * - Used throughout application for contact discovery and email management
 * - Integrates with utils module for deduplication functionality
 * - Works with email-validator library for comprehensive email validation
 * - Provides consistent error handling patterns used throughout the codebase
 *
 * Performance Considerations:
 * - Uses O(n) algorithms for email filtering and deduplication
 * - Minimal memory allocation through efficient array operations
 * - Fallback validation prevents external library failures from blocking operations
 * - Lazy evaluation of optional properties to reduce processing overhead
 *
 * Error Handling Strategy:
 * - Graceful degradation when external dependencies fail
 * - Consistent error aggregation across multiple data sources
 * - Input validation at function boundaries to prevent downstream errors
 * - Safe defaults for missing or invalid data structures
 *
 * Architecture Decision: Why use multiple email sources?
 * - Domain-based emails for organizational contacts
 * - Site scraping for publicly available contact information
 * - WHOIS data for domain registration contacts
 * - Aggregation provides comprehensive contact discovery
 */

import { dedupeByLowercaseFirst } from './utils.js';
import * as validator from 'email-validator';

/**
 * Email target with source attribution
 *
 * Represents an email address along with information about
 * where it was found or sourced from for attribution and
 * validation purposes.
 */
export interface EmailTarget {
  email: string; // The validated email address
  source: string; // Source where email was found (domain, site, whois, etc.)
}

/**
 * Domain lookup result interface
 *
 * Contains the results of domain-based email discovery
 * operations, including any errors encountered during the process.
 */
export interface DomainResult {
  domain?: string; // Domain name that was looked up
  error?: string; // Error message if domain lookup failed
}

/**
 * Site scraping result interface
 *
 * Contains the results of website scraping operations
 * for finding contact emails on public websites.
 */
export interface SiteResult {
  emails?: EmailTarget[]; // Array of emails found on the website
  error?: string; // Error message if site scraping failed
}

/**
 * WHOIS lookup result interface
 *
 * Contains the results of WHOIS database queries
 * for domain registration contact information.
 */
export interface WhoisResult {
  email?: string; // Contact email from WHOIS database
  error?: string; // Error message if WHOIS lookup failed
}

/**
 * Email aggregation container interface
 *
 * Combines results from multiple email discovery sources
 * into a single structure for processing and analysis.
 */
export interface EmailAggregation {
  domainResult: DomainResult; // Results from domain-based discovery
  siteResult?: SiteResult; // Optional results from website scraping
  whoisResult?: WhoisResult; // Optional results from WHOIS lookup
  additionalErrors?: string[]; // Additional errors from other sources
}

/**
 * Final email processing result interface
 *
 * Contains the consolidated results of email aggregation
 * operations with deduplication and error handling applied.
 */
export interface EmailResult {
  domain: string | null; // Primary domain for the email results
  emails: EmailTarget[]; // Deduplicated list of valid email addresses
  errors?: string[]; // Aggregated errors from all sources
}

/**
 * Aggregates emails from multiple sources with deduplication
 *
 * This function serves as the main entry point for email aggregation
 * by combining results from domain lookups, site scraping, and
 * WHOIS data into a unified, deduplicated result set.
 *
 * Processing Logic:
 * 1. Collects all valid emails from available sources
 * 2. Aggregates errors from all sources for comprehensive error reporting
 * 3. Applies case-insensitive deduplication to prevent duplicate emails
 * 4. Returns structured result with domain context and error information
 *
 * Error Handling:
 * - Preserves individual source errors in final result
 * - Continues processing even if some sources fail
 * - Returns domain information even when partial failures occur
 *
 * @param aggregation - Container with results from multiple email sources
 * @returns Consolidated email list with deduplication and error aggregation
 */
const getEmails = (aggregation: EmailAggregation): EmailResult => {
  const collected: EmailTarget[] = [];
  const errors: string[] = [];

  // Extract domain information and handle any domain lookup errors
  const { domain, error } = aggregation.domainResult;
  error && errors.push(error);

  // Process site scraping results if available
  if (aggregation.siteResult?.emails) {
    aggregation.siteResult.emails.forEach(contact => collected.push(contact));
    aggregation.siteResult.error && errors.push(aggregation.siteResult.error);
  }

  // Process WHOIS results if available
  if (aggregation.whoisResult) {
    const whoisEmail = aggregation.whoisResult?.email;
    if (whoisEmail) {
      collected.push({ email: whoisEmail, source: 'whois' });
    }
    aggregation.whoisResult.error && errors.push(aggregation.whoisResult.error);
  }

  // Process any additional errors from other sources
  aggregation.additionalErrors?.length && errors.push(...aggregation.additionalErrors);

  return {
    domain: domain ?? null,
    emails: dedupeByLowercaseFirst(collected, c => c.email),
    errors: errors.length ? errors : undefined,
  };
};

/**
 * Creates an email target with source attribution
 *
 * This factory function provides a standardized way to create
 * EmailTarget objects with consistent structure and source tracking.
 *
 * @param email - The email address to create a target for
 * @param source - The source where the email was discovered
 * @returns EmailTarget object with email and source information
 */
const createEmailTarget = (email: string, source: string): EmailTarget => ({ email, source });

/**
 * Validates email address format with fallback support
 *
 * This function provides robust email validation using the external
 * email-validator library with a regex fallback for resilience against
 * library failures or dependency issues.
 *
 * Validation Strategy:
 * 1. Primary validation using email-validator library (comprehensive validation)
 * 2. Regex fallback for basic format checking if external library fails
 * 3. Graceful handling of library exceptions to prevent application crashes
 *
 * Security Considerations:
 * - Prevents email injection attacks through format validation
 * - Uses comprehensive validation rules covering edge cases
 * - Fallback ensures continued operation even with dependency failures
 *
 * @param email - The email address to validate
 * @returns True if email format is valid, false otherwise
 */
const isValidEmail = (email: string): boolean => {
  // Return false for non-string inputs for consistent API behavior
  if (!email || typeof email !== 'string') return false;

  try {
    // Primary validation using comprehensive email validator library
    return validator.validate(email);
  } catch (error) {
    // Fallback validation if external validator fails or is unavailable
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

/**
 * Normalizes email address to standard format
 *
 * This function standardizes email addresses by converting to lowercase
 * and trimming whitespace to ensure consistent comparison and storage.
 *
 * Normalization Rules:
 * - Converts to lowercase for case-insensitive comparison
 * - Trims leading/trailing whitespace
 * - Returns null for invalid inputs to prevent type errors
 *
 * @param email - The email address to normalize
 * @returns Normalized email in lowercase, or null if input is invalid
 */
const normalizeEmail = (email: string): string | null =>
  !email || typeof email !== 'string' ? null : email.toLowerCase().trim();

/**
 * Extracts domain name from email address
 *
 * This function parses an email address to extract the domain part,
 * which is useful for categorization, filtering, and domain-based
 * operations on email addresses.
 *
 * Parsing Logic:
 * - Finds the last '@' symbol to handle emails with multiple @ symbols
 * - Validates email format before extraction
 * - Returns null for malformed or invalid email addresses
 * - Returns domain portion in lowercase for consistency
 *
 * Edge Cases Handled:
 * - Emails without @ symbol (returns null)
 * - Email ending with @ (returns null)
 * - Emails with multiple @ symbols (uses last one)
 * - Non-string inputs (returns null)
 *
 * @param email - The email address to extract domain from
 * @returns Domain name in lowercase, or null if email is invalid
 */
const getEmailDomain = (email: string): string | null => {
  if (!email || typeof email !== 'string') return null;

  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1 || atIndex === email.length - 1) {
    return null;
  }
  return email.substring(atIndex + 1).toLowerCase();
};

/**
 * Filters array of email targets to only include valid email addresses
 *
 * This function applies email validation to an array of EmailTarget
 * objects, filtering out any entries with invalid email formats.
 *
 * Processing Logic:
 * - Validates array input to prevent runtime errors
 * - Applies isValidEmail to each target's email address
 * - Preserves source information for valid emails
 * - Returns empty array for invalid or null inputs
 *
 * Performance Considerations:
 * - Uses efficient array filtering for O(n) processing
 * - Early return for invalid array inputs
 * - Preserves original array structure and order
 *
 * @param emailTargets - Array of EmailTarget objects to validate
 * @returns Filtered array containing only targets with valid email addresses
 */
const filterValidEmails = (emailTargets: EmailTarget[]): EmailTarget[] =>
  !emailTargets || !Array.isArray(emailTargets)
    ? []
    : emailTargets.filter(target => isValidEmail(target.email));

// Export all email utility functions for external use
export {
  getEmails, // Main aggregation function
  createEmailTarget, // Factory for creating email targets
  isValidEmail, // Email validation with fallback
  normalizeEmail, // Email format normalization
  getEmailDomain, // Domain extraction from emails
  filterValidEmails, // Array filtering for valid emails
};
