import { dedupeByLowercaseFirst } from './utils.js';
import * as validator from 'email-validator';

interface EmailTarget {
  email: string;
  source: string;
}

interface DomainResult {
  domain?: string;
  error?: string;
}

interface SiteResult {
  emails?: EmailTarget[];
  error?: string;
}

interface WhoisResult {
  email?: string;
  error?: string;
}

interface EmailAggregation {
  domainResult: DomainResult;
  siteResult?: SiteResult;
  whoisResult?: WhoisResult;
  additionalErrors?: string[];
}

interface EmailResult {
  domain: string | null;
  emails: EmailTarget[];
  errors?: string[];
}

const getEmails = (aggregation: EmailAggregation): EmailResult => {
  const collected: EmailTarget[] = [];
  const errors: string[] = [];
  const { domain, error } = aggregation.domainResult;
  error && errors.push(error);
  aggregation.siteResult &&
    (aggregation.siteResult.emails &&
      aggregation.siteResult.emails.forEach(contact => collected.push(contact)),
    aggregation.siteResult.error && errors.push(aggregation.siteResult.error));
  if (aggregation.whoisResult) {
    const whoisEmail = aggregation.whoisResult.email;
    whoisEmail && collected.push({ email: whoisEmail, source: 'whois' });
    aggregation.whoisResult.error && errors.push(aggregation.whoisResult.error);
  }
  aggregation.additionalErrors?.length && errors.push(...aggregation.additionalErrors);
  return {
    domain: domain ?? null,
    emails: dedupeByLowercaseFirst(collected, c => c.email),
    errors: errors.length ? errors : undefined,
  };
};

const createEmailTarget = (email: string, source: string): EmailTarget => ({ email, source });
const isValidEmail = (email: string): boolean => {
  try {
    return validator.validate(email);
  } catch (error) {
    // Fallback validation if external validator fails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};
const normalizeEmail = (email: string): string | null =>
  !email || typeof email !== 'string' ? null : email.toLowerCase().trim();
const getEmailDomain = (email: string): string | null => {
  if (!email || typeof email !== 'string') return null;
  const atIndex = email.lastIndexOf('@');
  return atIndex === -1 || atIndex === email.length - 1
    ? null
    : email.substring(atIndex + 1).toLowerCase();
};
const filterValidEmails = (emailTargets: EmailTarget[]): EmailTarget[] =>
  !emailTargets || !Array.isArray(emailTargets)
    ? []
    : emailTargets.filter(target => isValidEmail(target.email));

export {
  getEmails,
  createEmailTarget,
  isValidEmail,
  normalizeEmail,
  getEmailDomain,
  filterValidEmails,
};
