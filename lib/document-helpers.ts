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
  PipelineStage,
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
      const result = await safeDbOperation(() => model.create(data), 'createDocument');
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

/**
 * Escapes special characters in RegExp to prevent NoSQL injection.
 * @param string - String to escape.
 * @returns Escaped string safe for RegExp.
 */
const escapeRegExpForQuery = (value: string): string => {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Finds multiple documents by field with case-insensitive regex.
 * @param model Target Mongoose model.
 * @param field Field name to search.
 * @param value Value to search for.
 * @param options Query options (limit, sort).
 * @returns Array of found documents.
 */
const findManyByFieldIgnoreCase = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  field: keyof TSchema & string,
  value: string,
  options: { limit?: number; sort?: Record<string, 1 | -1> } = {}
): Promise<Array<LeanDocument<TSchema>>> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const { limit = 50, sort = { createdAt: -1 } } = options;
      const escapedValue = escapeRegExpForQuery(value);
      const filters = { [field]: { $regex: new RegExp(`^${escapedValue}$`, 'i') } } as FilterQuery<TSchema>;
      
      const result = await safeDbOperation(
        () => model.find(filters).sort(sort).limit(limit).lean().exec(),
        'findManyByFieldIgnoreCase'
      );
      utils
        .getFunctionLogger('findManyByFieldIgnoreCase')
        .debug('returning results', { count: Array.isArray(result) ? result.length : 0 });
      return (result ?? []) as LeanDocument<TSchema>[];
    },
    'findManyByFieldIgnoreCase',
    { model: model.modelName, field, limit: options.limit }
  );
};

/**
 * Checks if a document exists by field value.
 * @param model Target Mongoose model.
 * @param field Field name to check.
 * @param value Value to check for.
 * @returns True if document exists.
 */
const existsByField = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  field: keyof TSchema & string,
  value: unknown
): Promise<boolean> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () => model.findOne({ [field]: value } as FilterQuery<TSchema>).select('_id').lean().exec(),
        'existsByField'
      );
      return result !== null;
    },
    'existsByField',
    { model: model.modelName, field }
  );
};

/**
 * Gets distinct values for a field.
 * @param model Target Mongoose model.
 * @param field Field name to get distinct values for.
 * @param filters Optional filter criteria.
 * @returns Array of distinct values.
 */
const getDistinctValues = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  field: keyof TSchema & string,
  filters: FilterQuery<TSchema> = {}
): Promise<unknown[]> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () => model.distinct(field, filters).exec(),
        'getDistinctValues'
      );
      utils
        .getFunctionLogger('getDistinctValues')
        .debug('returning distinct values', { count: Array.isArray(result) ? result.length : 0 });
      return result ?? [];
    },
    'getDistinctValues',
    { model: model.modelName, field }
  );
};

/**
 * Performs a bulk delete operation.
 * @param model Target Mongoose model.
 * @param filters Filter criteria for documents to delete.
 * @returns Delete result with count.
 */
const bulkDeleteDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  filters: FilterQuery<TSchema>
): Promise<{ deletedCount: number }> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () => model.deleteMany(filters).exec(),
        'bulkDeleteDocuments'
      );
      const deletedCount = result?.deletedCount ?? 0;
      utils
        .getFunctionLogger('bulkDeleteDocuments')
        .debug('returning delete result', { deletedCount });
      return { deletedCount };
    },
    'bulkDeleteDocuments',
    { model: model.modelName }
  );
};

/**
 * Aggregates data using MongoDB aggregation pipeline.
 * @param model Target Mongoose model.
 * @param pipeline Aggregation pipeline stages.
 * @returns Aggregation results.
 */
const aggregateDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  pipeline: PipelineStage[]
): Promise<unknown[]> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () => model.aggregate(pipeline).exec(),
        'aggregateDocuments'
      );
      utils
        .getFunctionLogger('aggregateDocuments')
        .debug('returning aggregation results', { count: Array.isArray(result) ? result.length : 0 });
      return result ?? [];
    },
    'aggregateDocuments',
    { model: model.modelName, pipelineLength: pipeline.length }
  );
};

/**
 * Gets documents by date range.
 * @param model Target Mongoose model.
 * @param dateField Date field name.
 * @param startDate Start date (inclusive).
 * @param endDate End date (inclusive).
 * @param additionalFilters Optional additional filter criteria.
 * @returns Array of documents within the date range.
 */
const getByDateRange = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  dateField: keyof TSchema & string,
  startDate: Date,
  endDate: Date,
  additionalFilters: FilterQuery<TSchema> = {}
): Promise<Array<LeanDocument<TSchema>>> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const filters = {
        ...additionalFilters,
        [dateField]: {
          $gte: startDate,
          $lte: endDate,
        },
      } as FilterQuery<TSchema>;
      
      const result = await safeDbOperation(
        () => model.find(filters).sort({ [dateField]: -1 } as Record<string, 1 | -1>).lean().exec(),
        'getByDateRange'
      );
      utils
        .getFunctionLogger('getByDateRange')
        .debug('returning date range results', { count: Array.isArray(result) ? result.length : 0 });
      return (result ?? []) as LeanDocument<TSchema>[];
    },
    'getByDateRange',
    { model: model.modelName, dateField, startDate, endDate }
  );
};

/**
 * Soft deletes a document by setting a deleted flag.
 * @param model Target Mongoose model.
 * @param id Document ID.
 * @returns Updated document with deleted flag or null.
 */
const softDeleteDocument = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  id: DocumentId
): Promise<HydratedDocument<TSchema> | null> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const result = await safeDbOperation(
        () =>
          model.findByIdAndUpdate(
            id,
            { deleted: true, deletedAt: new Date() } as UpdateQuery<TSchema>,
            { new: true }
          ).exec(),
        'softDeleteDocument'
      );
      utils
        .getFunctionLogger('softDeleteDocument')
        .debug('returning soft delete result', { hasResult: Boolean(result) });
      return result;
    },
    'softDeleteDocument',
    { model: model.modelName, id }
  );
};

/**
 * Gets documents that are not soft deleted.
 * @param model Target Mongoose model.
 * @param filters Optional additional filter criteria.
 * @returns Array of non-deleted documents.
 */
const getActiveDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  filters: FilterQuery<TSchema> = {}
): Promise<Array<LeanDocument<TSchema>>> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const activeFilters = { ...filters, deleted: { $ne: true } } as FilterQuery<TSchema>;
      const result = await safeDbOperation(
        () => model.find(activeFilters).lean().exec(),
        'getActiveDocuments'
      );
      utils
        .getFunctionLogger('getActiveDocuments')
        .debug('returning active documents', { count: Array.isArray(result) ? result.length : 0 });
      return (result ?? []) as LeanDocument<TSchema>[];
    },
    'getActiveDocuments',
    { model: model.modelName }
  );
};

/**
 * Performs a text search across multiple fields.
 * @param model Target Mongoose model.
 * @param query Search query string.
 * @param searchFields Fields to search in.
 * @param options Query options (limit, page).
 * @returns Array of found documents.
 */
const textSearchDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  query: string,
  searchFields: Array<keyof TSchema & string>,
  options: { limit?: number; page?: number } = {}
): Promise<Array<LeanDocument<TSchema>>> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const { limit = 50, page = 1 } = options;
      const skip = (page - 1) * limit;
      const escapedQuery = escapeRegExpForQuery(query);
      
      const searchCriteria = {
        $or: searchFields.map(field => ({
          [field]: { $regex: escapedQuery, $options: 'i' },
        })),
      } as FilterQuery<TSchema>;
      
      const result = await safeDbOperation(
        () => model.find(searchCriteria).sort({ createdAt: -1 } as Record<string, 1 | -1>).skip(skip).limit(limit).lean().exec(),
        'textSearchDocuments'
      );
      utils
        .getFunctionLogger('textSearchDocuments')
        .debug('returning search results', { count: Array.isArray(result) ? result.length : 0 });
      return (result ?? []) as LeanDocument<TSchema>[];
    },
    'textSearchDocuments',
    { model: model.modelName, query, searchFieldCount: searchFields.length }
  );
};

/**
 * Gets paginated results with filtering and sorting.
 * @param model Target Mongoose model.
 * @param filters Filter criteria.
 * @param pagination Pagination options.
 * @param sort Sort options.
 * @returns Paginated results with metadata.
 */
const getPaginatedDocuments = async <TSchema extends AnyDocumentShape>(
  model: Model<TSchema>,
  filters: FilterQuery<TSchema> = {},
  pagination: { page?: number; limit?: number } = {},
  sort: Record<string, 1 | -1> = { createdAt: -1 }
): Promise<{
  data: Array<LeanDocument<TSchema>>;
  pagination: { page: number; limit: number; total: number; pages: number };
}> => {
  return utils.safeAsync(
    async () => {
      validateModel(model);
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        safeDbOperation(
          () => model.find(filters).sort(sort).skip(skip).limit(limit).lean().exec(),
          'getPaginatedDocuments.find'
        ),
        safeDbOperation(
          () => model.countDocuments(filters).exec(),
          'getPaginatedDocuments.count'
        ),
      ]);
      
      utils
        .getFunctionLogger('getPaginatedDocuments')
        .debug('returning paginated results', { count: Array.isArray(data) ? data.length : 0, total });
      
      return {
        data: (data ?? []) as LeanDocument<TSchema>[],
        pagination: {
          page,
          limit,
          total: total ?? 0,
          pages: Math.ceil((total ?? 0) / limit),
        },
      };
    },
    'getPaginatedDocuments',
    { model: model.modelName, page: pagination.page, limit: pagination.limit }
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
  findManyByFieldIgnoreCase,
  existsByField,
  getDistinctValues,
  bulkDeleteDocuments,
  aggregateDocuments,
  getByDateRange,
  softDeleteDocument,
  getActiveDocuments,
  textSearchDocuments,
  getPaginatedDocuments,
};
