/**
 * Database Document Helper Utilities
 * Generic MongoDB CRUD operations with consistent error handling and type safety
 */
import {
  Model,
  HydratedDocument,
  FilterQuery,
  UpdateQuery,
  ProjectionType,
  QueryOptions,
  Types,
  AnyKeys,
  AnyObject,
} from 'mongoose';

// LeanDocument type alias for compatibility
type LeanDocument<T> = T;
import type { UpdateResult } from 'mongodb';
import { safeDbOperation } from './database-utils.js';
import qerrors from 'qerrors';

interface Logger {
  logFunctionEntry(functionName: string, data?: Record<string, unknown>): void;
  logDebug(message: string, data?: Record<string, unknown>): void;
  logError(message: string, error: unknown): void;
}

// Lightweight console logger keeps deterministic logging for agents and tests
const logger: Logger = {
  logFunctionEntry: (functionName: string, data?: Record<string, unknown>) =>
    console.log(`ENTRY: ${functionName}`, data ?? ''),
  logDebug: (message: string, data?: Record<string, unknown>) =>
    console.log(`DEBUG: ${message}`, data ?? ''),
  logError: (message: string, error: unknown) => console.error(`ERROR: ${message}`, error),
};

type AnyDocumentShape = AnyObject;
type DocumentId = Types.ObjectId | string;

interface FindDocumentsOptions<TSchema extends AnyDocumentShape> {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  select?: ProjectionType<TSchema>;
}

interface BulkUpdateInstruction<TSchema extends AnyDocumentShape> {
  filter: FilterQuery<TSchema>;
  data: UpdateQuery<TSchema>;
  options?: QueryOptions<TSchema>;
}

/**
 * Retrieves a single document by identifier.
 * @param model Mongoose model used for retrieval.
 * @param id Identifier value that can be a string or ObjectId.
 * @returns The hydrated document when present, otherwise null.
 */
const findDocumentById = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  id: DocumentId
): Promise<HydratedDocument<TSchema> | null> => {
  if (!model) {
    throw new Error('Model is required');
  }
  logger.logFunctionEntry('findDocumentById', { model: model.modelName, id });
  try {
    const result = await safeDbOperation(() => model.findById(id).exec(), null, 'findDocumentById');
    logger.logDebug('findDocumentById returning result', { hasResult: Boolean(result) });
    return result;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-helpers.findDocumentById', {
      modelName: model.modelName,
      id,
      operation: 'findById',
    });
    logger.logError('findDocumentById encountered an error', error);
    throw error; // Re-throw to preserve error propagation
  }
};

/**
 * Updates a document by identifier and returns the modified document.
 * @param model Target Mongoose model.
 * @param id Identifier to update.
 * @param updates Partial update payload.
 * @returns Updated hydrated document or null when not found.
 */
const updateDocumentById = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  id: DocumentId,
  updates: UpdateQuery<TSchema>
): Promise<HydratedDocument<TSchema> | null> => {
  if (!model) {
    throw new Error('Model is required');
  }
  logger.logFunctionEntry('updateDocumentById', {
    model: model.modelName,
    id,
    updateFields: Object.keys(updates ?? {}),
  });
  try {
    const result = await safeDbOperation(
      () => model.findByIdAndUpdate(id, updates, { new: true }).exec(),
      null,
      'updateDocumentById'
    );
    logger.logDebug('updateDocumentById returning result', { hasResult: Boolean(result) });
    return result;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-helpers.updateDocumentById', {
      modelName: model.modelName,
      id,
      updateFieldCount: Object.keys(updates ?? {}).length,
      operation: 'findByIdAndUpdate',
    });
    logger.logError('updateDocumentById encountered an error', error);
    throw error; // Re-throw to preserve error propagation
  }
};

/**
 * Deletes a document by identifier.
 * @param model Target Mongoose model.
 * @param id Identifier to delete.
 * @returns true when a document was deleted, false otherwise.
 */
const deleteDocumentById = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  id: DocumentId
): Promise<boolean> => {
  logger.logFunctionEntry('deleteDocumentById', { model: model.modelName, id });
  const result = await safeDbOperation(
    async () => {
      const deleted = await model.findByIdAndDelete(id).exec();
      return Boolean(deleted);
    },
    null,
    'deleteDocumentById'
  );
  logger.logDebug('deleteDocumentById returning result', { result });
  return result ?? false;
};

/**
 * Deletes a document and all related documents that reference it.
 * @param model Primary model that owns document.
 * @param id Identifier of document being removed.
 * @param relatedModels Optional list of related models that store references.
 * @returns true when primary document (and related docs) were deleted.
 */
const cascadeDeleteDocument = async <
  TSchema extends AnyDocumentShape,
  TRelatedSchema extends AnyDocumentShape,
>(
  model: Model<TSchema>,
  id: DocumentId,
  relatedModels: Array<Model<TRelatedSchema>> = []
): Promise<boolean> => {
  logger.logFunctionEntry('cascadeDeleteDocument', {
    model: model.modelName,
    id,
    relatedModels: relatedModels.map(m => m.modelName),
  });
  const session = await model.startSession();
  try {
    session.startTransaction();

    const doc = await model.findById(id).session(session).exec();
    if (!doc) {
      logger.logDebug('cascadeDeleteDocument aborted - primary document missing');
      await session.abortTransaction();
      return false;
    }

    for (const relatedModel of relatedModels) {
      const foreignKey = model.modelName.toLowerCase();
      const relatedDocs = await relatedModel
        .find({ [foreignKey]: id } as FilterQuery<TRelatedSchema>)
        .session(session)
        .exec();
      for (const relatedDoc of relatedDocs) {
        await relatedModel.findByIdAndDelete(relatedDoc._id).session(session).exec();
      }
    }
    await model.findByIdAndDelete(id).session(session).exec();
    await session.commitTransaction();
    logger.logDebug('cascadeDeleteDocument removed primary and related documents');
    return true;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      qerrors.qerrors(abortError as Error, 'document-helpers.cascadeDeleteDocument.abort', {
        originalError: (error as Error).message,
        abortError: (abortError as Error).message,
      });
      logger.logError('Failed to abort transaction during cascade delete', abortError);
    }

    qerrors.qerrors(error as Error, 'document-helpers.cascadeDeleteDocument', {
      modelName: model.modelName,
      id,
      relatedModelCount: relatedModels.length,
      relatedModelNames: relatedModels.map(m => m.modelName),
    });
    logger.logError('cascadeDeleteDocument encountered an error', error);
    return false;
  } finally {
    try {
      await session.endSession();
    } catch (sessionError) {
      qerrors.qerrors(sessionError as Error, 'document-helpers.cascadeDeleteDocument.session', {
        error: (sessionError as Error).message,
      });
      logger.logError('Failed to end session during cascade delete', sessionError);
    }
  }
};

/**
 * Creates a document with safe error handling.
 * @param model Target model.
 * @param data Document payload to persist.
 * @returns Created hydrated document or null when creation failed.
 */
const createDocument = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  data: AnyKeys<TSchema>
): Promise<HydratedDocument<TSchema> | null> => {
  if (!model) {
    throw new Error('Model is required');
  }
  logger.logFunctionEntry('createDocument', {
    model: model.modelName,
    dataFields: Object.keys((data as Record<string, unknown>) ?? {}),
  });
  try {
    const result = await safeDbOperation(() => model.create(data), null, 'createDocument');
    logger.logDebug('createDocument returning result', { hasResult: Boolean(result) });
    return result;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-helpers.createDocument', {
      modelName: model.modelName,
      dataFieldCount: Object.keys((data as Record<string, unknown>) ?? {}).length,
      operation: 'create',
    });
    logger.logError('createDocument encountered an error', error);
    throw error; // Re-throw to preserve error propagation
  }
};

/**
 * Finds documents using flexible query options.
 * @param model Target model.
 * @param query Filter applied to the query.
 * @param options Optional projection, sorting, pagination controls.
 * @returns Array of lean documents (empty array when none found or errors).
 */
const findDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  query: FilterQuery<TSchema> = {},
  options: FindDocumentsOptions<TSchema> = {}
): Promise<Array<LeanDocument<TSchema>>> => {
  logger.logFunctionEntry('findDocuments', { model: model.modelName, query, options });
  try {
    const result = await safeDbOperation(
      async () => {
        let queryBuilder = model.find(query);
        if (options.sort) {
          queryBuilder = queryBuilder.sort(options.sort);
        }
        if (options.limit) {
          queryBuilder = queryBuilder.limit(options.limit);
        }
        if (options.skip) {
          queryBuilder = queryBuilder.skip(options.skip);
        }
        if (options.select) {
          queryBuilder = queryBuilder.select(options.select);
        }
        return queryBuilder.lean().exec();
      },
      null,
      'findDocuments'
    );
    logger.logDebug('findDocuments returning documents', {
      count: Array.isArray(result) ? result.length : 0,
    });
    return (result ?? []) as TSchema[];
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-helpers.findDocuments', {
      modelName: model.modelName,
      queryFieldCount: Object.keys(query).length,
      hasSort: options.sort !== undefined,
      hasLimit: options.limit !== undefined,
      hasSkip: options.skip !== undefined,
      hasSelect: options.select !== undefined,
      operation: 'find',
    });
    logger.logError('findDocuments encountered an error', error);
    throw error; // Re-throw to preserve error propagation
  }
};

/**
 * Finds a single document using the provided filter.
 * @param model Target model.
 * @param query Filter used to locate the document.
 * @returns Lean document or null when not found.
 */
const findOneDocument = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  query: FilterQuery<TSchema>
): Promise<LeanDocument<TSchema> | null> => {
  logger.logFunctionEntry('findOneDocument', { model: model.modelName, query });
  try {
    const result = await safeDbOperation(
      () => model.findOne(query).lean().exec(),
      null,
      'findOneDocument'
    );
    logger.logDebug('findOneDocument returning result', { hasResult: Boolean(result) });
    return result as LeanDocument<TSchema> | null;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-helpers.findOneDocument', {
      modelName: model.modelName,
      queryFieldCount: Object.keys(query).length,
      operation: 'findOne',
    });
    logger.logError('findOneDocument encountered an error', error);
    throw error; // Re-throw to preserve error propagation
  }
};

/**
 * Performs multiple update operations and returns all update results.
 * @param model Target model.
 * @param updates Array of update instructions (filter + payload).
 * @returns Array of Mongo update results or null when the batch fails.
 */
const bulkUpdateDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  updates: Array<BulkUpdateInstruction<TSchema>>
): Promise<Array<UpdateResult> | null> => {
  if (!model) {
    throw new Error('Model is required');
  }
  logger.logFunctionEntry('bulkUpdateDocuments', {
    model: model.modelName,
    updateCount: updates.length,
  });
  try {
    const results = await Promise.all(
      updates.map(async updateInstruction => {
        const { filter, data, options = {} } = updateInstruction;
        return await model.updateMany(filter, data, options as any).exec();
      })
    );
    logger.logDebug('bulkUpdateDocuments returning batch results', { count: results.length });
    return results;
  } catch (error) {
    qerrors.qerrors(error as Error, 'document-helpers.bulkUpdateDocuments', {
      modelName: model.modelName,
      updateCount: updates.length,
      updateFields: updates.map(u => (u.filter ? Object.keys(u.filter) : [])),
    });
    logger.logError('bulkUpdateDocuments error', error);
    return null;
  }
};

export {
  findDocumentById,
  updateDocumentById,
  deleteDocumentById,
  cascadeDeleteDocument,
  createDocument,
  findDocuments,
  findOneDocument,
  bulkUpdateDocuments,
};
