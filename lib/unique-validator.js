/**
 * Unique Validation Utility
 * Provides standardized unique field validation across all MongoDB services
 *
 * Features:
 * - Case-insensitive uniqueness checking
 * - Support for create and update operations (with ID exclusion)
 * - Multi-field validation
 * - MongoDB duplicate key error handling (code 11000)
 * - Express middleware for route-level validation
 *
 * Use cases:
 * - Mongoose applications with unique constraints
 * - MongoDB-based APIs
 * - Microservices with unique field requirements
 * - Data validation systems
 */
/**
 * Escape regex special characters
 */
export function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Checks if a field value is unique in a model
 */
export async function checkDuplicateByField(Model, fieldName, fieldValue, excludeId = null, resourceType = 'resource') {
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return null;
    }
    const query = {};
    if (typeof fieldValue === 'string') {
        query[fieldName] = { $regex: new RegExp(`^${escapeRegex(fieldValue)}$`, 'i') };
    }
    else {
        query[fieldName] = fieldValue;
    }
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    const existing = await Model.findOne(query).lean();
    return existing;
}
/**
 * Validates that a field value is unique and throws error if not
 */
export async function validateUniqueField(Model, fieldName, fieldValue, excludeId = null, resourceType = 'resource') {
    const existing = await checkDuplicateByField(Model, fieldName, fieldValue, excludeId, resourceType);
    if (existing) {
        const error = new Error(`A ${resourceType} with this ${fieldName} already exists`);
        error.code = 'DUPLICATE';
        error.status = 409;
        error.field = fieldName;
        error.value = fieldValue;
        error.existingId = existing._id;
        throw error;
    }
}
/**
 * Validates uniqueness for multiple fields
 */
export async function validateUniqueFields(Model, fieldValueMap, excludeId = null, resourceType = 'resource') {
    const validationPromises = [];
    for (const [fieldName, fieldValue] of Object.entries(fieldValueMap)) {
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
            validationPromises.push(validateUniqueField(Model, fieldName, fieldValue, excludeId, resourceType));
        }
    }
    await Promise.all(validationPromises);
}
/**
 * Creates a unique field validator for a specific resource type
 */
export function createUniqueValidator(Model, resourceType, uniqueField = 'name') {
    return {
        /**
         * Validates unique constraint for create operations
         */
        validateCreate: async (data, fieldsToCheck = [uniqueField]) => {
            const fieldValueMap = {};
            for (const field of fieldsToCheck) {
                if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
                    fieldValueMap[field] = data[field];
                }
            }
            if (Object.keys(fieldValueMap).length > 0) {
                await validateUniqueFields(Model, fieldValueMap, null, resourceType);
            }
        },
        /**
         * Validates unique constraint for update operations
         */
        validateUpdate: async (id, updateData, fieldsToCheck = [uniqueField]) => {
            const fieldValueMap = {};
            for (const field of fieldsToCheck) {
                if (updateData[field] !== undefined && updateData[field] !== null && updateData[field] !== '') {
                    fieldValueMap[field] = updateData[field];
                }
            }
            if (Object.keys(fieldValueMap).length > 0) {
                await validateUniqueFields(Model, fieldValueMap, id, resourceType);
            }
        },
        /**
         * Checks if a value is unique without throwing
         */
        isUnique: async (fieldName, fieldValue, excludeId = null) => {
            const existing = await checkDuplicateByField(Model, fieldName, fieldValue, excludeId, resourceType);
            return !existing;
        },
        /**
         * Find existing document by field value
         */
        findExisting: async (fieldName, fieldValue) => {
            return await checkDuplicateByField(Model, fieldName, fieldValue, null, resourceType);
        }
    };
}
/**
 * Handles MongoDB duplicate key errors (code 11000)
 */
export function handleDuplicateKeyError(error, resourceType = 'resource') {
    if (error.code === 11000 && error.keyValue) {
        const fieldKeys = Object.keys(error.keyValue);
        if (fieldKeys.length > 0) {
            const field = fieldKeys[0];
            const value = error.keyValue[field];
            const duplicateError = new Error(`A ${resourceType} with this ${field} already exists`);
            duplicateError.code = 'DUPLICATE';
            duplicateError.status = 409;
            duplicateError.field = field;
            duplicateError.value = value;
            duplicateError.isDuplicate = true;
            duplicateError.originalError = error;
            return duplicateError;
        }
    }
    return error;
}
/**
 * Wrap a function to handle MongoDB duplicate key errors
 */
export function withDuplicateKeyHandling(fn, resourceType = 'resource') {
    return async function (...args) {
        try {
            return await fn.apply(this, args);
        }
        catch (error) {
            throw handleDuplicateKeyError(error, resourceType);
        }
    };
}
/**
 * Creates middleware to validate unique fields before processing requests
 */
export function createUniqueFieldMiddleware(Model, fieldName, resourceType, options = {}) {
    const { source = 'body', idParam = 'id' } = options;
    return async (req, res, next) => {
        try {
            const fieldValue = req[source]?.[fieldName];
            if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
                return next();
            }
            const excludeId = req.params?.[idParam] || null;
            if (excludeId) {
                const existing = await Model.findById(excludeId).select(fieldName).lean();
                if (existing && existing[fieldName] === fieldValue) {
                    return next();
                }
            }
            await validateUniqueField(Model, fieldName, fieldValue, excludeId, resourceType);
            next();
        }
        catch (error) {
            if (error.status === 409) {
                res.status(409).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                    field: error.field,
                    value: error.value,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Creates middleware to validate multiple unique fields
 */
export function createUniqueFieldsMiddleware(Model, fieldNames, resourceType, options = {}) {
    const { source = 'body', idParam = 'id' } = options;
    return async (req, res, next) => {
        try {
            const fieldValueMap = {};
            for (const fieldName of fieldNames) {
                const value = req[source]?.[fieldName];
                if (value !== undefined && value !== null && value !== '') {
                    fieldValueMap[fieldName] = value;
                }
            }
            if (Object.keys(fieldValueMap).length === 0) {
                return next();
            }
            const excludeId = req.params?.[idParam] || null;
            await validateUniqueFields(Model, fieldValueMap, excludeId, resourceType);
            next();
        }
        catch (error) {
            if (error.status === 409) {
                res.status(409).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                    field: error.field,
                    value: error.value,
                    timestamp: new Date().toISOString()
                });
                return;
            }
            next(error);
        }
    };
}
/**
 * Check if error is a duplicate error
 */
export function isDuplicateError(error) {
    return error.code === 'DUPLICATE' || error.code === 11000 || error.isDuplicate === true;
}
/**
 * Create a batch uniqueness checker for bulk operations
 */
export function createBatchUniqueChecker(Model, fieldName, resourceType = 'resource') {
    return {
        /**
         * Check multiple values for uniqueness
         */
        checkMany: async (values) => {
            const results = { unique: [], duplicates: [] };
            for (const value of values) {
                const existing = await checkDuplicateByField(Model, fieldName, value, null, resourceType);
                if (existing) {
                    results.duplicates.push({ value, existingId: existing._id });
                }
                else {
                    results.unique.push(value);
                }
            }
            return results;
        },
        /**
         * Filter values to only unique ones
         */
        filterUnique: async (values) => {
            const checker = createBatchUniqueChecker(Model, fieldName, resourceType);
            const results = await checker.checkMany(values);
            return results.unique;
        }
    };
}
