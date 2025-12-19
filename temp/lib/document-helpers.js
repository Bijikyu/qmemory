/**
 * Database Document Helper Utilities
 * Generic MongoDB CRUD operations with consistent error handling and type safety
 */
import { safeDbOperation } from './database-utils.js';
// Simple logger implementation
const logger = {
    logFunctionEntry: (functionName, data) => {
        console.log(`ENTRY: ${functionName}`, data || '');
    }
};
const findDocumentById = async (model, id) => {
    if (!model)
        throw new Error('Model is required');
    logger.logFunctionEntry('findDocumentById', { model: model.modelName, id });
    const result = await safeDbOperation(async () => model.findById(id), {}, 'findDocumentById');
    result ? console.log(`findDocumentById is returning ${result ? 'document found' : 'undefined'}`) : console.log(`findDocumentById is returning undefined due to error`);
    return result;
};
const updateDocumentById = async (model, id, updates) => {
    if (!model)
        throw new Error('Model is required');
    logger.logFunctionEntry('updateDocumentById', { model: model.modelName, id, updateFields: updates ? Object.keys(updates) : [] });
    const result = await safeDbOperation(async () => model.findByIdAndUpdate(id, updates, { new: true }), {}, 'updateDocumentById');
    result ? console.log(`updateDocumentById is returning ${result ? 'updated document' : 'undefined'}`) : console.log(`updateDocumentById is returning undefined due to error`);
    return result;
};
const deleteDocumentById = async (model, id) => {
    logger.logFunctionEntry('deleteDocumentById', { model: model.modelName, id });
    const result = await safeDbOperation(async () => !!(await model.findByIdAndDelete(id)), {}, 'deleteDocumentById');
    result !== null ? console.log(`deleteDocumentById is returning ${result}`) : console.log(`deleteDocumentById is returning false due to error`);
    return result !== null ? result : false;
};
const cascadeDeleteDocument = async (model, id, relatedModels = []) => {
    logger.logFunctionEntry('cascadeDeleteDocument', { model: model.modelName, id, relatedModels: relatedModels.map(m => m.modelName) });
    try {
        // First check if document exists
        const doc = await model.findById(id);
        if (!doc) {
            console.log('cascadeDeleteDocument: document not found');
            return false;
        }
        // Delete related documents
        for (const relatedModel of relatedModels) {
            const relatedDocs = await relatedModel.find({ [model.modelName.toLowerCase()]: id });
            for (const relatedDoc of relatedDocs) {
                await relatedModel.findByIdAndDelete(relatedDoc._id);
            }
        }
        // Delete the main document
        await model.findByIdAndDelete(id);
        console.log('cascadeDeleteDocument: document and related documents deleted successfully');
        return true;
    }
    catch (error) {
        console.error('cascadeDeleteDocument error:', error.message);
        return false;
    }
};
const createDocument = async (model, data) => {
    if (!model)
        throw new Error('Model is required');
    logger.logFunctionEntry('createDocument', { model: model.modelName, dataFields: data ? Object.keys(data) : [] });
    const result = await safeDbOperation(async () => model.create(data), {}, 'createDocument');
    result ? console.log(`createDocument is returning ${result ? 'created document' : 'undefined'}`) : console.log(`createDocument is returning undefined due to error`);
    return result;
};
const findDocuments = async (model, query = {}, options = {}) => {
    logger.logFunctionEntry('findDocuments', { model: model.modelName, query, options });
    const result = await safeDbOperation(async () => {
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
        return await queryBuilder.lean();
    }, {}, 'findDocuments');
    result ? console.log(`findDocuments is returning ${result.length} documents`) : console.log(`findDocuments is returning empty array due to error`);
    return result || [];
};
const findOneDocument = async (model, query) => {
    logger.logFunctionEntry('findOneDocument', { model: model.modelName, query });
    const result = await safeDbOperation(async () => model.findOne(query).lean(), {}, 'findOneDocument');
    result ? console.log(`findOneDocument is returning ${result ? 'document found' : 'undefined'}`) : console.log(`findOneDocument is returning undefined due to error`);
    return result;
};
const bulkUpdateDocuments = async (model, updates) => {
    if (!model)
        throw new Error('Model is required');
    logger.logFunctionEntry('bulkUpdateDocuments', { model: model.modelName, updateCount: updates.length });
    try {
        const results = await Promise.all(updates.map(async (update) => {
            const { filter, data, options = {} } = update;
            return await model.updateMany(filter, data, { ...options, new: true });
        }));
        console.log(`bulkUpdateDocuments is returning results for ${results.length} update operations`);
        return results;
    }
    catch (error) {
        console.error('bulkUpdateDocuments error:', error.message);
        return null;
    }
};
export { findDocumentById, updateDocumentById, deleteDocumentById, cascadeDeleteDocument, createDocument, findDocuments, findOneDocument, bulkUpdateDocuments };
