/**
 * PostgreSQL adapter exports
 *
 * This module provides an explicit `postgres.*` namespace for consumers that want
 * to avoid DBTYPE-based dynamic dispatch and use the Postgres implementations directly.
 */

export type { DbType } from '../dbtype.js';

export { createPostgresResource } from './types.js';
export type { PostgresResource, PostgresPoolLike, PostgresClientLike } from './types.js';

export { ensurePostgresDB } from './connection-utils.js';

export { handlePostgresError } from './errors.js';

export {
  safeDbOperationPostgres as safeDbOperation,
  retryDbOperationPostgres as retryDbOperation,
  ensureUniquePostgres as ensureUnique,
  ensureIdempotencyPostgres as ensureIdempotency,
} from './database-utils.js';

export {
  findDocumentByIdPostgres as findDocumentById,
  updateDocumentByIdPostgres as updateDocumentById,
  deleteDocumentByIdPostgres as deleteDocumentById,
  cascadeDeleteDocumentPostgres as cascadeDeleteDocument,
  createDocumentPostgres as createDocument,
  findDocumentsPostgres as findDocuments,
  findOneDocumentPostgres as findOneDocument,
  bulkUpdateDocumentsPostgres as bulkUpdateDocuments,
  findManyByFieldIgnoreCasePostgres as findManyByFieldIgnoreCase,
  existsByFieldPostgres as existsByField,
  getDistinctValuesPostgres as getDistinctValues,
  bulkDeleteDocumentsPostgres as bulkDeleteDocuments,
  aggregateDocumentsPostgres as aggregateDocuments,
  getByDateRangePostgres as getByDateRange,
  softDeleteDocumentPostgres as softDeleteDocument,
  getActiveDocumentsPostgres as getActiveDocuments,
  textSearchDocumentsPostgres as textSearchDocuments,
  getPaginatedDocumentsPostgres as getPaginatedDocuments,
} from './document-helpers.js';

export {
  performUserDocOpPostgres as performUserDocOp,
  findUserDocPostgres as findUserDoc,
  deleteUserDocPostgres as deleteUserDoc,
  userDocActionOr404Postgres as userDocActionOr404,
  fetchUserDocOr404Postgres as fetchUserDocOr404,
  deleteUserDocOr404Postgres as deleteUserDocOr404,
  listUserDocsLeanPostgres as listUserDocs,
  listUserDocsLeanPostgres as listUserDocsLean,
  createUniqueDocPostgres as createUniqueDoc,
  updateUserDocPostgres as updateUserDoc,
  validateDocumentUniquenessPostgres as validateDocumentUniqueness,
  hasUniqueFieldChangesPostgres as hasUniqueFieldChanges,
} from './document-ops.js';

export {
  findByFieldIgnoreCasePostgres as findByFieldIgnoreCase,
  createCrudServicePostgres as createCrudService,
  createPaginatedServicePostgres as createPaginatedService,
  createValidatedServicePostgres as createValidatedService,
  // Re-export DB-agnostic helpers for parity.
  createDuplicateError,
  escapeRegex,
  validateData,
} from './crud-service-factory.js';

export {
  checkDuplicateByFieldPostgres as checkDuplicateByField,
  validateUniqueFieldPostgres as validateUniqueField,
  validateUniqueFieldsPostgres as validateUniqueFields,
  createUniqueValidatorPostgres as createUniqueValidator,
  handleDuplicateKeyErrorPostgres as handleDuplicateKeyError,
  withDuplicateKeyHandlingPostgres as withDuplicateKeyHandling,
  createUniqueFieldMiddlewarePostgres as createUniqueFieldMiddleware,
  createUniqueFieldsMiddlewarePostgres as createUniqueFieldsMiddleware,
  isDuplicateErrorPostgres as isDuplicateError,
  createBatchUniqueCheckerPostgres as createBatchUniqueChecker,
} from './unique-validator.js';

