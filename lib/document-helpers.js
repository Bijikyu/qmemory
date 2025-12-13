/**
 * Database Document Helper Utilities
 * Generic MongoDB CRUD operations with consistent error handling and type safety
 */

const { safeDbOperation } = require('./database-utils');
const { logFunctionEntry } = require('./logging-utils');

const findDocumentById = async (model, id) => {
    if (!model) throw new Error('Model is required');
    logFunctionEntry('findDocumentById', { model: model.modelName, id });
    const result = await safeDbOperation(async () => model.findById(id), 'findDocumentById', { model: model.modelName, id });
    result.success ? console.log(`findDocumentById is returning ${result.data ? 'document found' : 'undefined'}`) : console.log(`findDocumentById is returning undefined due to error`);
    return result.success ? result.data : undefined;
};

const updateDocumentById = async (model, id, updates) => {
    if (!model) throw new Error('Model is required');
    logFunctionEntry('updateDocumentById', { model: model.modelName, id, updateFields: updates ? Object.keys(updates) : [] });
    const result = await safeDbOperation(async () => model.findByIdAndUpdate(id, updates, { new: true }), 'updateDocumentById', { model: model.modelName, id, updateFields: updates ? Object.keys(updates) : [] });
    result.success ? console.log(`updateDocumentById is returning ${result.data ? 'updated document' : 'undefined'}`) : console.log(`updateDocumentById is returning undefined due to error`);
    return result.success ? result.data : undefined;
};

const deleteDocumentById = async (model, id) => {
    logFunctionEntry('deleteDocumentById', { model: model.modelName, id });
    const result = await safeDbOperation(async () => !!(await model.findByIdAndDelete(id)), 'deleteDocumentById', { model: model.modelName, id });
    result.success ? console.log(`deleteDocumentById is returning ${result.data}`) : console.log(`deleteDocumentById is returning false due to error`);
    return result.success ? result.data : false;
};

const cascadeDeleteDocument = async (mainModel, mainId, cascadeOperations = []) => {
    logFunctionEntry('cascadeDeleteDocument', { model: mainModel.modelName, id: mainId, cascadeOperationsCount: cascadeOperations.length });
    const result = await safeDbOperation(async () => {
        for (let i = 0; i < cascadeOperations.length; i++) {
            try { await cascadeOperations[i](); console.log(`[DEBUG] Cascade operation ${i + 1} completed successfully`); } 
            catch (error) { console.warn(`[WARN] Cascade operation ${i + 1} failed:`, error.message); }
        }
        return (await mainModel.findByIdAndDelete(mainId)) !== null;
    }, 'cascadeDeleteDocument', { model: mainModel.modelName, id: mainId, cascadeCount: cascadeOperations.length });
    result.success ? console.log(`cascadeDeleteDocument is returning ${result.data}`) : console.log(`cascadeDeleteDocument is returning false due to error`);
    return result.success ? result.data : false;
};

const createDocument = async (model, data) => {
    if (!model) throw new Error('Model is required');
    logFunctionEntry('createDocument', { model: model.modelName, dataFields: data ? Object.keys(data) : [] });
    const result = await safeDbOperation(async () => await (new model(data)).save(), 'createDocument', { model: model.modelName, dataFields: Object.keys(data) });
    if (result.success) {
        console.log(`createDocument is returning created document`);
        return result.data;
    } else {
        console.log(`createDocument is throwing error due to failure`);
        const error = new Error(result.error.message);
        error.code = result.error.statusCode;
        error.type = result.error.type;
        throw error;
    }
};

const findDocuments = async (model, condition, sortOptions = null) => {
    if (!model) throw new Error('Model is required');
    logFunctionEntry('findDocuments', { model: model.modelName, condition, hasSort: !!sortOptions });
    const result = await safeDbOperation(async () => {
        let query = model.find(condition);
        sortOptions && (query = query.sort(sortOptions));
        return await query;
    }, 'findDocuments', { model: model.modelName, condition, hasSort: !!sortOptions });
    result.success ? console.log(`findDocuments is returning ${result.data.length} documents`) : console.log(`findDocuments is returning empty array due to error`);
    return result.success ? result.data : [];
};

const findOneDocument = async (model, condition) => {
    if (!model) throw new Error('Model is required');
    logFunctionEntry('findOneDocument', { model: model.modelName, condition });
    const result = await safeDbOperation(async () => model.findOne(condition), 'findOneDocument', { model: model.modelName, condition });
    result.success ? console.log(`findOneDocument is returning ${result.data ? 'document found' : 'undefined'}`) : console.log(`findOneDocument is returning undefined due to error`);
    return result.success ? result.data : undefined;
};

const bulkUpdateDocuments = async (model, updates) => {
    if (!model) throw new Error('Model is required');
    if (!Array.isArray(updates)) throw new Error('Updates must be an array');
    logFunctionEntry('bulkUpdateDocuments', { model: model.modelName, updateCount: updates.length });
    let successCount = 0;
    for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        const result = await safeDbOperation(async () => (await model.findByIdAndUpdate(update.id, update.data)) !== null, 'bulkUpdateDocuments_single', { model: model.modelName, updateIndex: i, id: update.id });
        result.success && result.data && successCount++;
    }
    console.log(`bulkUpdateDocuments is returning ${successCount} successful updates`);
    return successCount;
};

module.exports = {
    findDocumentById,
    updateDocumentById,
    deleteDocumentById,
    cascadeDeleteDocument,
    createDocument,
    findDocuments,
    findOneDocument,
    bulkUpdateDocuments
};