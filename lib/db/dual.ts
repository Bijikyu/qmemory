/**
 * Dual-DB selector exports
 *
 * Exposes:
 * - Explicit namespaces: `mongo.*` and `postgres.*`
 * - DBTYPE-selected wrappers for DB-centric functions (e.g., `findUserDoc`)
 *
 * Rationale:
 * - Namespaces provide deterministic behavior and clean typing.
 * - Wrappers enable `DBTYPE`-based routing for consumers that want a single import path.
 */

import { getDbType, type DbType } from './dbtype.js';
import { NotSupportedForDbTypeError } from './errors.js';
import * as mongo from './mongo/index.js';
import * as postgres from './postgres/index.js';

export { mongo, postgres };
export { getDbType };
export type { DbType };

function getDbImplementation(): typeof mongo | typeof postgres {
  const dbType = getDbType();
  return dbType === 'postgres' ? postgres : mongo;
}

/**
 * DBTYPE-selected safe operation wrapper.
 */
export async function safeDbOperation<TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  res: unknown = null
): Promise<TResult | null> {
  const impl = getDbImplementation() as any;
  return impl.safeDbOperation(operation, operationName, res);
}

export async function retryDbOperation<TResult>(
  operation: () => Promise<TResult>,
  operationName: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<TResult | null> {
  const impl = getDbImplementation() as any;
  return impl.retryDbOperation(operation, operationName, maxRetries, baseDelay);
}

/**
 * DBTYPE-selected uniqueness helper.
 */
export async function ensureUnique(
  modelOrResource: unknown,
  queryOrFilter: unknown,
  res: unknown,
  duplicateMsg?: string
): Promise<boolean> {
  const impl = getDbImplementation() as any;
  return impl.ensureUnique(modelOrResource, queryOrFilter, res, duplicateMsg);
}

/**
 * DBTYPE-selected idempotency helper.
 */
export async function ensureIdempotency<TResult>(
  modelOrConfig: unknown,
  idempotencyKey: string,
  operation: () => Promise<TResult>
): Promise<TResult> {
  const impl = getDbImplementation() as any;
  return impl.ensureIdempotency(modelOrConfig, idempotencyKey, operation);
}

// --- Document helpers (DBTYPE-selected) ---

export async function findDocumentById(modelOrResource: unknown, id: unknown): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.findDocumentById(modelOrResource, id);
}

export async function updateDocumentById(
  modelOrResource: unknown,
  id: unknown,
  updates: unknown
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.updateDocumentById(modelOrResource, id, updates);
}

export async function deleteDocumentById(modelOrResource: unknown, id: unknown): Promise<boolean> {
  const impl = getDbImplementation() as any;
  return impl.deleteDocumentById(modelOrResource, id);
}

export async function cascadeDeleteDocument(
  modelOrResource: unknown,
  id: unknown,
  related: unknown[] = []
): Promise<boolean> {
  const impl = getDbImplementation() as any;
  return impl.cascadeDeleteDocument(modelOrResource, id, related);
}

export async function createDocument(modelOrResource: unknown, data: unknown): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.createDocument(modelOrResource, data);
}

export async function findDocuments(
  modelOrResource: unknown,
  queryOrFilter: unknown = {},
  options: unknown = {}
): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.findDocuments(modelOrResource, queryOrFilter, options);
}

export async function findOneDocument(
  modelOrResource: unknown,
  queryOrFilter: unknown = {},
  options: unknown = {}
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.findOneDocument(modelOrResource, queryOrFilter, options);
}

export async function bulkUpdateDocuments(modelOrResource: unknown, updates: unknown): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.bulkUpdateDocuments(modelOrResource, updates);
}

export async function findManyByFieldIgnoreCase(
  modelOrResource: unknown,
  field: unknown,
  value: unknown,
  options: unknown = {}
): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.findManyByFieldIgnoreCase(modelOrResource, field, value, options);
}

export async function existsByField(
  modelOrResource: unknown,
  field: unknown,
  value: unknown
): Promise<boolean> {
  const impl = getDbImplementation() as any;
  return impl.existsByField(modelOrResource, field, value);
}

export async function getDistinctValues(
  modelOrResource: unknown,
  field: unknown,
  filters: unknown = {}
): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.getDistinctValues(modelOrResource, field, filters);
}

export async function bulkDeleteDocuments(
  modelOrResource: unknown,
  filters: unknown
): Promise<{ deletedCount: number }> {
  const impl = getDbImplementation() as any;
  return impl.bulkDeleteDocuments(modelOrResource, filters);
}

export async function aggregateDocuments(modelOrResource: unknown, pipelineOrQuery: unknown): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.aggregateDocuments(modelOrResource, pipelineOrQuery);
}

export async function getByDateRange(
  modelOrResource: unknown,
  dateField: unknown,
  startDate: Date,
  endDate: Date,
  additionalFilters: unknown = {}
): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.getByDateRange(modelOrResource, dateField, startDate, endDate, additionalFilters);
}

export async function softDeleteDocument(modelOrResource: unknown, id: unknown): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.softDeleteDocument(modelOrResource, id);
}

export async function getActiveDocuments(modelOrResource: unknown, filters: unknown = {}): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.getActiveDocuments(modelOrResource, filters);
}

export async function textSearchDocuments(
  modelOrResource: unknown,
  query: string,
  searchFields: unknown,
  options: unknown = {}
): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  return impl.textSearchDocuments(modelOrResource, query, searchFields, options);
}

export async function getPaginatedDocuments(
  modelOrResource: unknown,
  filters: unknown = {},
  pagination: unknown = {},
  sort: unknown = undefined
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.getPaginatedDocuments(modelOrResource, filters, pagination, sort);
}

// --- User-owned document ops (DBTYPE-selected) ---

export async function performUserDocOp(
  modelOrResource: unknown,
  id: unknown,
  username: string,
  opCallback: unknown
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.performUserDocOp(modelOrResource, id, username, opCallback);
}

export async function findUserDoc(modelOrResource: unknown, id: unknown, username: string): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.findUserDoc(modelOrResource, id, username);
}

export async function deleteUserDoc(modelOrResource: unknown, id: unknown, username: string): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.deleteUserDoc(modelOrResource, id, username);
}

export async function userDocActionOr404(
  modelOrResource: unknown,
  id: unknown,
  user: string,
  res: unknown,
  action: unknown,
  msg: string
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.userDocActionOr404(modelOrResource, id, user, res, action, msg);
}

export async function fetchUserDocOr404(
  modelOrResource: unknown,
  id: unknown,
  user: string,
  res: unknown,
  msg: string
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.fetchUserDocOr404(modelOrResource, id, user, res, msg);
}

export async function deleteUserDocOr404(
  modelOrResource: unknown,
  id: unknown,
  user: string,
  res: unknown,
  msg: string
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.deleteUserDocOr404(modelOrResource, id, user, res, msg);
}

export async function listUserDocs(
  modelOrResource: unknown,
  username: string,
  options: unknown = {}
): Promise<unknown[]> {
  const impl = getDbImplementation() as any;
  // Back-compat: prefer listUserDocs if present, else listUserDocsLean.
  return impl.listUserDocs
    ? impl.listUserDocs(modelOrResource, username, options)
    : impl.listUserDocsLean(modelOrResource, username, options);
}

/**
 * Back-compat alias for callers that imported `listUserDocsLean`.
 * Rationale: older code/tests expect `listUserDocs`, newer code may expect `listUserDocsLean`.
 */
export async function listUserDocsLean(
  modelOrResource: unknown,
  username: string,
  options: unknown = {}
): Promise<unknown[]> {
  return listUserDocs(modelOrResource, username, options);
}

export async function createUniqueDoc(
  modelOrResource: unknown,
  fields: unknown,
  uniqueQueryOrFilter: unknown,
  res: unknown,
  duplicateMsg?: string
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.createUniqueDoc(modelOrResource, fields, uniqueQueryOrFilter, res, duplicateMsg);
}

export async function updateUserDoc(
  modelOrResource: unknown,
  id: unknown,
  username: string,
  fieldsToUpdate: unknown,
  uniqueQueryOrFilter: unknown,
  res: unknown,
  duplicateMsg?: string
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.updateUserDoc(modelOrResource, id, username, fieldsToUpdate, uniqueQueryOrFilter, res, duplicateMsg);
}

export async function validateDocumentUniqueness(
  modelOrResource: unknown,
  uniqueQueryOrFilter: unknown,
  res: unknown,
  duplicateMsg?: string
): Promise<boolean> {
  const impl = getDbImplementation() as any;
  return impl.validateDocumentUniqueness(modelOrResource, uniqueQueryOrFilter, res, duplicateMsg);
}

export function hasUniqueFieldChanges(doc: unknown, fieldsToUpdate: unknown, uniqueQueryOrFilter: unknown): boolean {
  const impl = getDbImplementation() as any;
  return impl.hasUniqueFieldChanges(doc, fieldsToUpdate, uniqueQueryOrFilter);
}

// --- Unique validator + CRUD factory (DBTYPE-selected) ---

export async function checkDuplicateByField(
  modelOrResource: unknown,
  fieldName: unknown,
  fieldValue: unknown,
  excludeId: unknown = null,
  resourceType: string = 'resource'
): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.checkDuplicateByField(modelOrResource, fieldName, fieldValue, excludeId, resourceType);
}

export async function validateUniqueField(
  modelOrResource: unknown,
  fieldName: unknown,
  fieldValue: unknown,
  excludeId: unknown = null,
  resourceType: string = 'resource'
): Promise<void> {
  const impl = getDbImplementation() as any;
  return impl.validateUniqueField(modelOrResource, fieldName, fieldValue, excludeId, resourceType);
}

export async function validateUniqueFields(
  modelOrResource: unknown,
  fieldValueMap: unknown,
  excludeId: unknown = null,
  resourceType: string = 'resource'
): Promise<void> {
  const impl = getDbImplementation() as any;
  return impl.validateUniqueFields(modelOrResource, fieldValueMap, excludeId, resourceType);
}

export function createUniqueValidator(modelOrResource: unknown, resourceType: string = 'resource'): unknown {
  const impl = getDbImplementation() as any;
  return impl.createUniqueValidator(modelOrResource, resourceType);
}

export function handleDuplicateKeyError(error: unknown, resourceType: string = 'resource'): Error {
  const impl = getDbImplementation() as any;
  return impl.handleDuplicateKeyError(error, resourceType);
}

export function withDuplicateKeyHandling<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  resourceType: string = 'resource'
): (...args: TArgs) => Promise<TResult> {
  const impl = getDbImplementation() as any;
  return impl.withDuplicateKeyHandling(fn, resourceType);
}

export function createUniqueFieldMiddleware(
  modelOrResource: unknown,
  fieldName: unknown,
  resourceType: string,
  options: unknown = {}
): unknown {
  const impl = getDbImplementation() as any;
  return impl.createUniqueFieldMiddleware(modelOrResource, fieldName, resourceType, options);
}

export function createUniqueFieldsMiddleware(
  modelOrResource: unknown,
  fieldNames: unknown,
  resourceType: string,
  options: unknown = {}
): unknown {
  const impl = getDbImplementation() as any;
  return impl.createUniqueFieldsMiddleware(modelOrResource, fieldNames, resourceType, options);
}

export function isDuplicateError(error: unknown): boolean {
  const impl = getDbImplementation() as any;
  return impl.isDuplicateError(error);
}

export function createBatchUniqueChecker(
  modelOrResource: unknown,
  fieldName: unknown,
  resourceType: string = 'resource'
): unknown {
  const impl = getDbImplementation() as any;
  return impl.createBatchUniqueChecker(modelOrResource, fieldName, resourceType);
}

export function createCrudService(modelOrResource: unknown, resourceType: string, options: unknown = {}): unknown {
  const impl = getDbImplementation() as any;
  return impl.createCrudService(modelOrResource, resourceType, options);
}

export function createPaginatedService(modelOrResource: unknown, resourceType: string, options: unknown = {}): unknown {
  const impl = getDbImplementation() as any;
  return impl.createPaginatedService(modelOrResource, resourceType, options);
}

export function createValidatedService(
  modelOrResource: unknown,
  resourceType: string,
  validationRules: unknown = {}
): unknown {
  const impl = getDbImplementation() as any;
  return impl.createValidatedService(modelOrResource, resourceType, validationRules);
}

export function findByFieldIgnoreCase(modelOrResource: unknown, field: unknown, value: unknown): Promise<unknown> {
  const impl = getDbImplementation() as any;
  return impl.findByFieldIgnoreCase(modelOrResource, field, value);
}

export function optimizeQuery(...args: unknown[]): unknown {
  const dbType = getDbType();
  if (dbType !== 'mongodb') {
    throw new NotSupportedForDbTypeError(
      dbType,
      'optimizeQuery',
      'Use `mongo.optimizeQuery()` when using MongoDB/Mongoose.'
    );
  }
  return (mongo as any).optimizeQuery(...args);
}

export function createAggregationPipeline(...args: unknown[]): unknown {
  const dbType = getDbType();
  if (dbType !== 'mongodb') {
    throw new NotSupportedForDbTypeError(
      dbType,
      'createAggregationPipeline',
      'Use `mongo.createAggregationPipeline()` when using MongoDB/Mongoose.'
    );
  }
  return (mongo as any).createAggregationPipeline(...args);
}
