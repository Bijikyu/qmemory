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
 * 
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a field value is unique in a model
 * 
 * @param {Object} Model - Mongoose model to check
 * @param {string} fieldName - Name of the field to check
 * @param {*} fieldValue - Value to check for uniqueness
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @param {string} resourceType - Type of resource for error messages
 * @returns {Promise<Object|null>} Existing document or null if unique
 */
async function checkDuplicateByField(Model, fieldName, fieldValue, excludeId = null, resourceType = 'resource') {
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return null;
  }

  const query = {};

  if (typeof fieldValue === 'string') {
    query[fieldName] = { $regex: new RegExp(`^${escapeRegex(fieldValue)}$`, 'i') };
  } else {
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
 * 
 * @param {Object} Model - Mongoose model to check
 * @param {string} fieldName - Name of the field to check
 * @param {*} fieldValue - Value to check for uniqueness
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @param {string} resourceType - Type of resource for error messages
 * @throws {Error} If field value is not unique
 */
async function validateUniqueField(Model, fieldName, fieldValue, excludeId = null, resourceType = 'resource') {
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
 * 
 * @param {Object} Model - Mongoose model to check
 * @param {Object} fieldValueMap - Map of field names to values
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @param {string} resourceType - Type of resource for error messages
 * @throws {Error} If any field value is not unique
 */
async function validateUniqueFields(Model, fieldValueMap, excludeId = null, resourceType = 'resource') {
  const validationPromises = [];

  for (const [fieldName, fieldValue] of Object.entries(fieldValueMap)) {
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      validationPromises.push(
        validateUniqueField(Model, fieldName, fieldValue, excludeId, resourceType)
      );
    }
  }

  await Promise.all(validationPromises);
}

/**
 * Creates a unique field validator for a specific resource type
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} resourceType - Type of resource
 * @param {string} uniqueField - Default unique field name
 * @returns {Object} Validator functions for create and update operations
 */
function createUniqueValidator(Model, resourceType, uniqueField = 'name') {
  return {
    /**
     * Validates unique constraint for create operations
     * 
     * @param {Object} data - Data to validate
     * @param {Array} fieldsToCheck - Array of field names to check
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
     * 
     * @param {string} id - Resource ID being updated
     * @param {Object} updateData - Update data to validate
     * @param {Array} fieldsToCheck - Array of field names to check
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
     * 
     * @param {string} fieldName - Field name to check
     * @param {*} fieldValue - Value to check
     * @param {string} excludeId - ID to exclude (optional)
     * @returns {Promise<boolean>} True if unique, false if duplicate
     */
    isUnique: async (fieldName, fieldValue, excludeId = null) => {
      const existing = await checkDuplicateByField(Model, fieldName, fieldValue, excludeId, resourceType);
      return !existing;
    },

    /**
     * Find existing document by field value
     * 
     * @param {string} fieldName - Field name to check
     * @param {*} fieldValue - Value to find
     * @returns {Promise<Object|null>} Existing document or null
     */
    findExisting: async (fieldName, fieldValue) => {
      return await checkDuplicateByField(Model, fieldName, fieldValue, null, resourceType);
    }
  };
}

/**
 * Handles MongoDB duplicate key errors (code 11000)
 * 
 * @param {Error} error - Error to handle
 * @param {string} resourceType - Type of resource for error messages
 * @returns {Error} Formatted error or original error
 */
function handleDuplicateKeyError(error, resourceType = 'resource') {
  if (error.code === 11000 && error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
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

  return error;
}

/**
 * Wrap a function to handle MongoDB duplicate key errors
 * 
 * @param {Function} fn - Function to wrap
 * @param {string} resourceType - Resource type for error messages
 * @returns {Function} Wrapped function
 */
function withDuplicateKeyHandling(fn, resourceType = 'resource') {
  return async function (...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      throw handleDuplicateKeyError(error, resourceType);
    }
  };
}

/**
 * Creates middleware to validate unique fields before processing requests
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} fieldName - Field name to validate
 * @param {string} resourceType - Resource type for error messages
 * @param {Object} options - Configuration options
 * @param {string} options.source - Source of field value ('body', 'params', 'query')
 * @param {string} options.idParam - Parameter name for ID exclusion
 * @returns {Function} Express middleware function
 */
function createUniqueFieldMiddleware(Model, fieldName, resourceType, options = {}) {
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
    } catch (error) {
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: error.code,
          field: error.field,
          value: error.value,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
}

/**
 * Creates middleware to validate multiple unique fields
 * 
 * @param {Object} Model - Mongoose model
 * @param {Array} fieldNames - Field names to validate
 * @param {string} resourceType - Resource type for error messages
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
function createUniqueFieldsMiddleware(Model, fieldNames, resourceType, options = {}) {
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
    } catch (error) {
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          error: error.message,
          code: error.code,
          field: error.field,
          value: error.value,
          timestamp: new Date().toISOString()
        });
      }
      next(error);
    }
  };
}

/**
 * Check if error is a duplicate error
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if duplicate error
 */
function isDuplicateError(error) {
  return error.code === 'DUPLICATE' || error.code === 11000 || error.isDuplicate === true;
}

/**
 * Create a batch uniqueness checker for bulk operations
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} fieldName - Field name to check
 * @param {string} resourceType - Resource type for error messages
 * @returns {Object} Batch checker with methods
 */
function createBatchUniqueChecker(Model, fieldName, resourceType = 'resource') {
  return {
    /**
     * Check multiple values for uniqueness
     * 
     * @param {Array} values - Values to check
     * @returns {Promise<Object>} Results with unique and duplicate arrays
     */
    checkMany: async (values) => {
      const results = { unique: [], duplicates: [] };

      for (const value of values) {
        const existing = await checkDuplicateByField(Model, fieldName, value, null, resourceType);
        if (existing) {
          results.duplicates.push({ value, existingId: existing._id });
        } else {
          results.unique.push(value);
        }
      }

      return results;
    },

    /**
     * Filter values to only unique ones
     * 
     * @param {Array} values - Values to filter
     * @returns {Promise<Array>} Only unique values
     */
    filterUnique: async (values) => {
      const results = await this.checkMany(values);
      return results.unique;
    }
  };
}

module.exports = {
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
  escapeRegex
};
