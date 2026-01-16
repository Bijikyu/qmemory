/**
 * MongoDB/Mongoose adapter exports
 *
 * This module provides an explicit `mongo.*` namespace for consumers that want
 * to avoid DBTYPE-based dynamic dispatch and use the Mongo implementations directly.
 */

export {
  ensureMongoDB,
  ensureUnique,
  handleMongoError,
  safeDbOperation,
  retryDbOperation,
  ensureIdempotency,
  optimizeQuery,
  createAggregationPipeline,
  createDocumentIndexes,
} from '../../database-utils.js';

export * from '../../document-helpers.js';

export {
  performUserDocOp,
  findUserDoc,
  deleteUserDoc,
  userDocActionOr404,
  fetchUserDocOr404,
  deleteUserDocOr404,
  // Back-compat: some consumers/tests expect listUserDocs.
  listUserDocsLean as listUserDocs,
  listUserDocsLean,
  createUniqueDoc,
  updateUserDoc,
  validateDocumentUniqueness,
  hasUniqueFieldChanges,
} from '../../document-ops.js';

// CRUD service factory exports (explicit to avoid star-export name collisions)
export {
  createCrudService,
  createPaginatedService,
  createValidatedService,
  findByFieldIgnoreCase,
  createDuplicateError,
  escapeRegex as escapeRegexCrud,
  validateData,
} from '../../crud-service-factory.js';

// Unique validator exports (explicit to avoid star-export name collisions)
export {
  checkDuplicateByField,
  validateUniqueField,
  validateUniqueFields,
  createUniqueValidator,
  handleDuplicateKeyError,
  withDuplicateKeyHandling,
  createUniqueFieldMiddleware,
  createUniqueFieldsMiddleware,
  isDuplicateError,
  createBatchUniqueChecker,
} from '../../unique-validator.js';

export {
  MongoDBOperations,
  MongoDBManager,
  createMongoDBOperations,
  getMongoDBManager,
  type FindManyOptions,
} from '../../database/mongodb-operations.js';
