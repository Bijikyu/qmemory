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
import type { Response } from 'express';
type LeanDocument<T> = T;
import type { UpdateResult } from 'mongodb';
import { safeDbOperation } from './database-utils.js';
import { createModuleUtilities } from './common-patterns.js';

const utils = createModuleUtilities('document-helpers');

// Helper function to eliminate duplicate model validation pattern
const validateModel = (model: Model<any>): void => {
  if (!model) {
    throw new Error('Model is required');
  }
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
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () => model.findById(id).exec(),
        null,
        'findDocumentById'
      );
      utils
        .getFunctionLogger('findDocumentById')
        .debug('returning result', { hasResult: Boolean(result) });
      return result;
    },
    'findDocumentById',
    { model: model.modelName, id }
  );
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
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () => model.findByIdAndUpdate(id, updates, { new: true }).exec(),
        null,
        'updateDocumentById'
      );
      utils
        .getFunctionLogger('updateDocumentById')
        .debug('returning result', { hasResult: Boolean(result) });
      return result;
    },
    'updateDocumentById',
    {
      model: model.modelName,
      id,
      updateFields: Object.keys(updates ?? {}),
    }
  );
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
  return utils.safeAsync(
    async () => {
      const result = await safeDbOperation(
        async () => {
          const deleted = await model.findByIdAndDelete(id).exec();
          return Boolean(deleted);
        },
        null,
        'deleteDocumentById'
      );
      utils.getFunctionLogger('deleteDocumentById').debug('returning result', { result });
      return result ?? false;
    },
    'deleteDocumentById',
    { model: model.modelName, id }
  );
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
  const funcLogger = utils.getFunctionLogger('cascadeDeleteDocument');
  funcLogger.entry({
    model: model.modelName,
    id,
    relatedModels: relatedModels.map(m => m.modelName),
  });

  const session = await model.startSession();
  try {
    session.startTransaction();

    const doc = await model.findById(id).session(session).exec();
    if (!doc) {
      funcLogger.debug('aborted - primary document missing');
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
    funcLogger.debug('removed primary and related documents');
    return true;
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      utils.logError(abortError as Error, 'cascadeDeleteDocument.abort', {
        originalError: (error as Error).message,
        abortError: (abortError as Error).message,
      });
    }

    utils.logError(error as Error, 'cascadeDeleteDocument', {
      modelName: model.modelName,
      id,
      relatedModelCount: relatedModels.length,
      relatedModelNames: relatedModels.map(m => m.modelName),
    });
    return false;
  } finally {
    try {
      await session.endSession();
    } catch (sessionError) {
      utils.logError(sessionError as Error, 'cascadeDeleteDocument.session', {
        error: (sessionError as Error).message,
      });
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
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(() => model.create(data), null, 'createDocument');
      utils
        .getFunctionLogger('createDocument')
        .debug('returning result', { hasResult: Boolean(result) });
      return result;
    },
    'createDocument',
    {
      model: model.modelName,
      dataFields: Object.keys((data as Record<string, unknown>) ?? {}),
    }
  );
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
  return utils.safeAsync(
    async () => {
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
      utils.getFunctionLogger('findDocuments').debug('returning documents', {
        count: Array.isArray(result) ? result.length : 0,
      });
      return (result ?? []) as TSchema[];
    },
    'findDocuments',
    { model: model.modelName, query, options }
  );
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
  return utils.safeAsync(
    async () => {
      const result = await safeDbOperation(
        () => model.findOne(query).lean().exec(),
        null,
        'findOneDocument'
      );
      utils
        .getFunctionLogger('findOneDocument')
        .debug('returning result', { hasResult: Boolean(result) });
      return result as LeanDocument<TSchema> | null;
    },
    'findOneDocument',
    { model: model.modelName, query }
  );
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
  return (
    utils.safeAsync(
      async () => {
        if (!model) {
          throw new Error('Model is required');
        }
        const results = await Promise.all(
          updates.map(async updateInstruction => {
            const { filter, data, options = {} } = updateInstruction;
            return await model.updateMany(filter, data, options as any).exec();
          })
        );
        utils
          .getFunctionLogger('bulkUpdateDocuments')
          .debug('returning batch results', { count: results.length });
        return results;
      },
      'bulkUpdateDocuments',
      {
        model: model.modelName,
        updateCount: updates.length,
      }
    ) || null
  );
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
