import { dedupeByLowercaseFirst } from './utils.js';
import validator from 'email-validator';
const getEmails = (aggregation) => {
    const collected = [];
    const errors = [];
    const { domain, error } = aggregation.domainResult;
    error && errors.push(error);
    aggregation.siteResult && (aggregation.siteResult.emails && aggregation.siteResult.emails.forEach(contact => collected.push(contact)), aggregation.siteResult.error && errors.push(aggregation.siteResult.error));
    if (aggregation.whoisResult) {
        const whoisEmail = aggregation.whoisResult.email;
        whoisEmail && collected.push({ email: whoisEmail, source: 'whois' });
        aggregation.whoisResult.error && errors.push(aggregation.whoisResult.error);
    }
    aggregation.additionalErrors?.length && errors.push(...aggregation.additionalErrors);
    return {
        domain: domain ?? null,
        emails: dedupeByLowercaseFirst(collected, c => c.email),
        errors: errors.length ? errors : undefined
    };
};
const createEmailTarget = (email, source) => ({ email, source });
const isValidEmail = (email) => validator.validate(email);
const normalizeEmail = (email) => (!email || typeof email !== 'string') ? null : email.toLowerCase().trim();
const getEmailDomain = (email) => {
    if (!email || typeof email !== 'string')
        return null;
    const atIndex = email.lastIndexOf('@');
    return (atIndex === -1 || atIndex === email.length - 1) ? null : email.substring(atIndex + 1).toLowerCase();
};
const filterValidEmails = (emailTargets) => (!emailTargets || !Array.isArray(emailTargets)) ? [] : emailTargets.filter(target => isValidEmail(target.email));
export { getEmails, createEmailTarget, isValidEmail, normalizeEmail, getEmailDomain, filterValidEmails };
