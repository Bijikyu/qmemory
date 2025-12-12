/**
 * Email Aggregation Utilities
 * Utilities for combining and deduplicating email contacts from multiple sources
 * 
 * This module addresses the common need to aggregate email contacts from various
 * discovery mechanisms (site scraping, WHOIS lookup, etc.) while maintaining
 * provenance information and deduplicating results.
 * 
 * Design philosophy:
 * - Source attribution: Every contact maintains its discovery channel
 * - Graceful error handling: Soft failures are collected, not thrown
 * - Deduplication: Case-insensitive email matching with first-seen precedence
 * - Clean payloads: Empty arrays/error lists are omitted from results
 * 
 * Use cases:
 * - Lead generation systems
 * - Contact discovery tools
 * - Domain reconnaissance utilities
 * - Marketing data consolidation
 */

const { dedupeByLowercaseFirst } = require('./utils');
const validator = require('email-validator');

/**
 * Aggregates all discoverable contact emails from supplied lookup results
 * 
 * Combines email contacts from multiple discovery sources (site scraping, WHOIS, etc.)
 * while maintaining source attribution and handling errors gracefully. Results are
 * deduplicated by email address (case-insensitive) with first-seen precedence.
 * 
 * Error handling strategy:
 * - Soft failures are collected into an errors array
 * - Processing continues even when individual sources fail
 * - Empty error arrays are omitted from the result for clean payloads
 * 
 * @param {Object} aggregation - Precomputed domain, site scrape, and WHOIS results
 * @param {Object} aggregation.domainResult - Result from domain normalization
 * @param {string|null} aggregation.domainResult.domain - Normalized domain
 * @param {string} [aggregation.domainResult.error] - Domain parsing error if any
 * @param {Object} [aggregation.siteResult] - Precomputed site scraping outcome
 * @param {Array} [aggregation.siteResult.emails] - Emails found via site scraping
 * @param {string} [aggregation.siteResult.error] - Scraping error if any
 * @param {Object} [aggregation.whoisResult] - Precomputed WHOIS lookup outcome
 * @param {Object} [aggregation.whoisResult.email] - Email found via WHOIS
 * @param {string} [aggregation.whoisResult.error] - WHOIS lookup error if any
 * @param {Array<string>} [aggregation.additionalErrors] - Extra orchestration errors
 * @returns {Object} Aggregated result with deduped contacts and any non-fatal errors
 */
function getEmails(aggregation) {
  const collected = [];
  const errors = [];
  
  const domainResult = aggregation.domainResult;
  const domain = domainResult.domain ?? null;
  
  if (domainResult.error) {
    errors.push(domainResult.error);
  }
  
  if (aggregation.siteResult) {
    if (aggregation.siteResult.emails) {
      aggregation.siteResult.emails.forEach(contact => collected.push(contact));
    }
    if (aggregation.siteResult.error) {
      errors.push(aggregation.siteResult.error);
    }
  }
  
  if (aggregation.whoisResult) {
    const whoisEmail = aggregation.whoisResult.email;
    if (whoisEmail) {
      collected.push(whoisEmail);
    }
    if (aggregation.whoisResult.error) {
      errors.push(aggregation.whoisResult.error);
    }
  }
  
  if (aggregation.additionalErrors?.length) {
    errors.push(...aggregation.additionalErrors);
  }
  
  return {
    domain,
    emails: dedupeByLowercaseFirst(collected, c => c.email),
    errors: errors.length ? errors : undefined
  };
}

/**
 * Creates an email target object with source attribution
 * 
 * Helper for creating properly structured email contact objects
 * with provenance information for downstream auditing.
 * 
 * @param {string} email - Email address
 * @param {string} source - Originating discovery channel ('site', 'whois', etc.)
 * @returns {Object} Email target object with email and source properties
 */
function createEmailTarget(email, source) {
  return {
    email: email,
    source: source
  };
}

/**
 * Validates email format using email-validator
 * 
 * Uses email-validator for RFC 5322 compliant email validation
 * across the application. This provides comprehensive validation
 * including international email addresses and edge cases.
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email appears valid, false otherwise
 */
function isValidEmail(email) {
  return validator.validate(email);
}

/**
 * Normalizes an email address to lowercase
 * 
 * Email addresses are case-insensitive per RFC 5321, so normalizing
 * to lowercase ensures consistent comparison and storage.
 * 
 * @param {string} email - Email address to normalize
 * @returns {string|null} Lowercase email or null if invalid input
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  return email.toLowerCase().trim();
}

/**
 * Extracts domain from an email address
 * 
 * Useful for grouping emails by domain or validating
 * that emails belong to expected domains.
 * 
 * @param {string} email - Email address
 * @returns {string|null} Domain portion of email or null if invalid
 */
function getEmailDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1 || atIndex === email.length - 1) return null;
  return email.substring(atIndex + 1).toLowerCase();
}

/**
 * Filters an array of email targets to only include valid emails
 * 
 * Removes entries with invalid email formats from the collection.
 * 
 * @param {Array} emailTargets - Array of email target objects
 * @returns {Array} Filtered array with only valid emails
 */
function filterValidEmails(emailTargets) {
  if (!emailTargets || !Array.isArray(emailTargets)) return [];
  return emailTargets.filter(target => isValidEmail(target.email));
}

module.exports = {
  getEmails,
  createEmailTarget,
  isValidEmail,
  normalizeEmail,
  getEmailDomain,
  filterValidEmails
};
