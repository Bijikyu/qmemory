/**
 * CRUD Service Factory
 * Generates standardized CRUD service layers for MongoDB/Mongoose models
 * 
 * Eliminates repetitive CRUD service code by providing a factory pattern that
 * creates complete service objects with standard operations. Provides lifecycle
 * hooks for customization while reducing code duplication.
 * 
 * Features:
 * - Complete CRUD operations (create, read, update, delete)
 * - Built-in duplicate detection
 * - Lifecycle hooks (before/after create, update, delete)
 * - Search with configurable searchable fields
 * - Pagination with consistent response format
 * - Query enhancement and result transformation
 * 
 * Use cases:
 * - Mongoose applications
 * - MongoDB-based APIs
 * - Microservices with data models
 * - Any application needing standardized data access
 */

/**
 * Find document by field value (case-insensitive)
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @returns {Promise<Object|null>} Found document or null
 */
async function findByFieldIgnoreCase(Model, field, value) {
  if (!value || typeof value !== 'string') {
    return await Model.findOne({ [field]: value });
  }
  return await Model.findOne({
    [field]: { $regex: new RegExp(`^${escapeRegex(value)}$`, 'i') }
  });
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a duplicate error
 */
function createDuplicateError(resourceType, field, value) {
  const error = new Error(`${resourceType} with ${field} "${value}" already exists`);
  error.code = 'DUPLICATE';
  error.field = field;
  error.value = value;
  return error;
}

/**
 * Creates a CRUD service factory for a given Mongoose model
 * 
 * @param {Object} Model - Mongoose model to create service for
 * @param {string} resourceType - Type of resource for logging and error messages
 * @param {Object} options - Configuration options
 * @param {string} options.uniqueField - Field to check for duplicates (default: 'name')
 * @param {Array} options.searchableFields - Fields that can be searched (default: ['name'])
 * @param {Function} options.beforeCreate - Hook to run before create
 * @param {Function} options.afterCreate - Hook to run after create
 * @param {Function} options.beforeUpdate - Hook to run before update
 * @param {Function} options.afterUpdate - Hook to run after update
 * @param {Function} options.beforeDelete - Hook to run before delete
 * @param {Function} options.afterDelete - Hook to run after delete
 * @param {Object} options.defaultSort - Default sort order (default: { createdAt: -1 })
 * @param {number} options.defaultLimit - Default page limit (default: 50)
 * @returns {Object} CRUD service object with standard methods
 */
function createCrudService(Model, resourceType, options = {}) {
  const {
    uniqueField = 'name',
    searchableFields = ['name'],
    beforeCreate = null,
    afterCreate = null,
    beforeUpdate = null,
    afterUpdate = null,
    beforeDelete = null,
    afterDelete = null,
    defaultSort = { createdAt: -1 },
    defaultLimit = 50
  } = options;

  /**
   * Creates a new resource
   * 
   * @param {Object} data - Resource data to create
   * @returns {Promise<Object>} Created resource
   */
  async function create(data) {
    if (data[uniqueField]) {
      const existing = await findByFieldIgnoreCase(Model, uniqueField, data[uniqueField]);
      if (existing) {
        throw createDuplicateError(resourceType, uniqueField, data[uniqueField]);
      }
    }

    let processedData = { ...data };
    if (beforeCreate) {
      processedData = await beforeCreate(processedData);
    }

    const item = new Model(processedData);
    const saved = await item.save();

    if (afterCreate) {
      await afterCreate(saved);
    }

    console.log(`[crud] ${resourceType} created: ${saved._id}`);
    return saved;
  }

  /**
   * Gets a resource by ID
   * 
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Resource
   */
  async function getById(id) {
    const item = await Model.findById(id);
    if (!item) {
      const error = new Error(`${resourceType} not found`);
      error.code = 'NOT_FOUND';
      throw error;
    }
    return item;
  }

  /**
   * Gets all resources with optional filtering and pagination
   * 
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} sort - Sort options
   * @returns {Promise<Object>} Paginated results
   */
  async function getAll(filters = {}, pagination = {}, sort = defaultSort) {
    const { page = 1, limit = defaultLimit } = pagination;
    const skip = (page - 1) * limit;

    const query = Model.find(filters);
    query.sort(sort);

    const [data, total] = await Promise.all([
      query.skip(skip).limit(limit),
      Model.countDocuments(filters)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      }
    };
  }

  /**
   * Updates a resource by ID
   * 
   * @param {string} id - Resource ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated resource
   */
  async function update(id, updateData) {
    const existing = await Model.findById(id);
    if (!existing) {
      const error = new Error(`${resourceType} not found`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (updateData[uniqueField] && updateData[uniqueField] !== existing[uniqueField]) {
      const duplicate = await findByFieldIgnoreCase(Model, uniqueField, updateData[uniqueField]);
      if (duplicate && duplicate._id.toString() !== id) {
        throw createDuplicateError(resourceType, uniqueField, updateData[uniqueField]);
      }
    }

    let processedData = { ...updateData };
    if (beforeUpdate) {
      processedData = await beforeUpdate(processedData, existing);
    }

    const updated = await Model.findByIdAndUpdate(id, processedData, { 
      new: true, 
      runValidators: true 
    });

    if (afterUpdate) {
      await afterUpdate(updated);
    }

    console.log(`[crud] ${resourceType} updated: ${updated._id}`);
    return updated;
  }

  /**
   * Deletes a resource by ID
   * 
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Deleted resource
   */
  async function deleteById(id) {
    const existing = await Model.findById(id);
    if (!existing) {
      const error = new Error(`${resourceType} not found`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (beforeDelete) {
      await beforeDelete(existing);
    }

    const deleted = await Model.findByIdAndDelete(id);

    if (afterDelete) {
      await afterDelete(deleted);
    }

    console.log(`[crud] ${resourceType} deleted: ${deleted._id}`);
    return deleted;
  }

  /**
   * Searches resources by text query
   * 
   * @param {string} query - Search query
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Search results
   */
  async function search(query, pagination = {}) {
    const { page = 1, limit = defaultLimit } = pagination;
    const skip = (page - 1) * limit;

    const searchCriteria = {
      $or: searchableFields.map(field => ({
        [field]: { $regex: escapeRegex(query), $options: 'i' }
      }))
    };

    const [data, total] = await Promise.all([
      Model.find(searchCriteria).skip(skip).limit(limit).sort(defaultSort),
      Model.countDocuments(searchCriteria)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
      },
      query
    };
  }

  /**
   * Gets resources by field value
   * 
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {Promise<Array>} Array of resources
   */
  async function getByField(field, value) {
    return await Model.find({ [field]: value });
  }

  /**
   * Counts resources matching criteria
   * 
   * @param {Object} filters - Filter criteria
   * @returns {Promise<number>} Count of resources
   */
  async function count(filters = {}) {
    return await Model.countDocuments(filters);
  }

  /**
   * Check if resource exists by ID
   * 
   * @param {string} id - Resource ID
   * @returns {Promise<boolean>} True if exists
   */
  async function exists(id) {
    const doc = await Model.findById(id).select('_id').lean();
    return !!doc;
  }

  /**
   * Bulk create resources
   * 
   * @param {Array} items - Array of resource data
   * @returns {Promise<Array>} Created resources
   */
  async function bulkCreate(items) {
    const results = [];
    for (const data of items) {
      try {
        const created = await create(data);
        results.push({ success: true, data: created });
      } catch (error) {
        results.push({ success: false, error: error.message, data });
      }
    }
    return results;
  }

  /**
   * Upsert a resource (create or update)
   * 
   * @param {Object} query - Query to find existing
   * @param {Object} data - Data to create or update
   * @returns {Promise<Object>} Created or updated resource
   */
  async function upsert(query, data) {
    const existing = await Model.findOne(query);
    
    if (existing) {
      return await update(existing._id.toString(), data);
    }
    
    return await create({ ...query, ...data });
  }

  return {
    create,
    getById,
    getAll,
    update,
    deleteById,
    search,
    getByField,
    count,
    exists,
    bulkCreate,
    upsert
  };
}

/**
 * Creates a paginated service function with standardized response format
 * 
 * @param {Object} Model - Mongoose model to query
 * @param {string} resourceType - Type of resource for response naming
 * @param {Object} options - Configuration options
 * @returns {Function} Paginated service function
 */
function createPaginatedService(Model, resourceType, options = {}) {
  const {
    defaultSort = { createdAt: -1 },
    defaultLimit = 50,
    queryEnhancer = null,
    resultEnhancer = null,
    additionalData = null
  } = options;

  return async function getPaginatedResources(filters = {}, serviceOptions = {}) {
    const {
      page = 1,
      limit = defaultLimit,
      sort = defaultSort
    } = serviceOptions;
    
    const skip = (page - 1) * limit;

    let query = Model.find(filters);

    if (queryEnhancer) {
      query = queryEnhancer(query, filters);
    }

    const [resources, totalCount] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit).lean(),
      Model.countDocuments(filters)
    ]);

    let enhancedResources = resources;
    if (resultEnhancer) {
      enhancedResources = await resultEnhancer(resources, filters);
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    const response = {
      [resourceType]: enhancedResources,
      totalCount,
      currentPage: page,
      totalPages,
      hasMore
    };

    if (additionalData) {
      const extraDataResult = additionalData(filters, enhancedResources);
      const extraData = extraDataResult && typeof extraDataResult.then === 'function'
        ? await extraDataResult
        : extraDataResult;
      Object.assign(response, extraData);
    }

    return response;
  };
}

/**
 * Create service with validation for a specific domain
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} resourceType - Resource type name
 * @param {Object} validationRules - Field validation rules
 * @returns {Object} Service with validation
 */
function createValidatedService(Model, resourceType, validationRules = {}) {
  const baseService = createCrudService(Model, resourceType, {
    beforeCreate: async (data) => {
      validateData(data, validationRules);
      return data;
    },
    beforeUpdate: async (data, existing) => {
      validateData(data, validationRules, true);
      return data;
    }
  });

  return baseService;
}

/**
 * Validate data against rules
 */
function validateData(data, rules, isUpdate = false) {
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && !isUpdate && (value === undefined || value === null || value === '')) {
      throw new Error(`${field} is required`);
    }
    
    if (value !== undefined && value !== null) {
      if (rule.type === 'string' && typeof value !== 'string') {
        throw new Error(`${field} must be a string`);
      }
      
      if (rule.type === 'number' && typeof value !== 'number') {
        throw new Error(`${field} must be a number`);
      }
      
      if (rule.enum && !rule.enum.includes(value)) {
        throw new Error(`${field} must be one of: ${rule.enum.join(', ')}`);
      }
      
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        throw new Error(`${field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        throw new Error(`${field} must be at most ${rule.maxLength} characters`);
      }
      
      if (rule.min && typeof value === 'number' && value < rule.min) {
        throw new Error(`${field} must be at least ${rule.min}`);
      }
      
      if (rule.max && typeof value === 'number' && value > rule.max) {
        throw new Error(`${field} must be at most ${rule.max}`);
      }
      
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        throw new Error(`${field} has invalid format`);
      }
    }
  }
}

module.exports = {
  createCrudService,
  createPaginatedService,
  createValidatedService,
  findByFieldIgnoreCase,
  createDuplicateError,
  escapeRegex,
  validateData
};
