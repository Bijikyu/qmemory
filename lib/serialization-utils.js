/**
 * Document Serialization Utilities
 * Generic serialization functions for database entities
 * 
 * Provides generic serialization functions for converting database documents
 * (mongoose-like) to plain objects. This is a common need across applications
 * using ORMs/ODMs, ensuring consistent API response formatting and data transformation.
 * 
 * Design philosophy:
 * - Type-safe transformations: Generic type support for consistent typing
 * - Multiple serialization strategies: toObject(), toJSON(), spread operator
 * - Flexible input/output wrappers: Object-based interfaces for structured calls
 * - Async support: Handles save-and-serialize patterns for document persistence
 * 
 * Use cases:
 * - API response formatting: Convert Mongoose documents to JSON-safe objects
 * - Data transformation: Strip Mongoose internals before sending to clients
 * - Batch processing: Map arrays of documents to plain objects efficiently
 * - Save workflows: Persist and serialize in a single operation
 */

/**
 * Serializes a single document to a plain object
 * 
 * Handles Mongoose documents with toObject/toJSON methods as well as
 * plain objects. Uses a priority strategy: toObject() > toJSON() > spread.
 * 
 * Serialization strategy:
 * 1. If doc is falsy, return as-is (null/undefined passthrough)
 * 2. If doc has toObject method, use it (Mongoose documents)
 * 3. If doc has toJSON method, use it (custom serializable objects)
 * 4. Otherwise, spread the object (plain objects)
 * 
 * @template T
 * @param {T} doc - Document to serialize (Mongoose document or plain object)
 * @returns {T} Serialized plain object
 */
function serializeDocument(doc) {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  if (typeof doc.toJSON === 'function') return doc.toJSON();
  return { ...doc };
}

/**
 * Serializes a Mongoose document to a plain object
 * 
 * Wrapper around serializeDocument specifically for Mongoose documents.
 * Provides semantic clarity when working with Mongoose-specific code.
 * 
 * @template T
 * @param {T} doc - Mongoose document to serialize
 * @returns {T} Serialized plain object
 */
function serializeMongooseDocument(doc) {
  return serializeDocument(doc);
}

/**
 * Maps an array of items and serializes each to a plain object
 * 
 * Efficiently converts an array of Mongoose documents to an array of
 * plain objects. Uses map for functional transformation.
 * 
 * @template T
 * @param {Array<T>} items - Array of documents to serialize
 * @returns {Array<any>} Array of serialized plain objects
 */
function mapAndSerialize(items) {
  return items.map(item => serializeMongooseDocument(item));
}

/**
 * Saves a document and returns the serialized result
 * 
 * Combines document persistence with serialization in a single async operation.
 * Useful for create/update workflows where you want to return a plain object.
 * 
 * Workflow:
 * 1. Call save() on the document (persists to database)
 * 2. Serialize the saved document to a plain object
 * 3. Return the serialized result
 * 
 * @template T
 * @param {Object} doc - Mongoose document with save() method
 * @returns {Promise<T>} Serialized plain object after saving
 */
async function saveAndSerialize(doc) {
  await doc.save();
  return serializeMongooseDocument(doc);
}

/**
 * Object-based wrapper for mapAndSerialize
 * 
 * Provides a structured interface for mapping and serializing arrays.
 * Useful when working with parameter objects or functional composition.
 * 
 * @template T
 * @param {Object} input - Input object containing items array
 * @param {Array<T>} input.items - Array of documents to serialize
 * @returns {Object} Output object with serialized items array
 */
function mapAndSerializeObj(input) {
  return {
    items: mapAndSerialize(input.items)
  };
}

/**
 * Object-based wrapper for serializeDocument
 * 
 * Provides a structured interface for single document serialization.
 * Useful when working with parameter objects or functional composition.
 * 
 * @template T
 * @param {Object} input - Input object containing doc to serialize
 * @param {T} input.doc - Document to serialize
 * @returns {Object} Output object with serialized doc
 */
function serializeDocumentObj(input) {
  return {
    doc: serializeDocument(input.doc)
  };
}

/**
 * Object-based wrapper for serializeMongooseDocument
 * 
 * Provides a structured interface for Mongoose document serialization.
 * Semantic wrapper for Mongoose-specific workflows.
 * 
 * @template T
 * @param {Object} input - Input object containing Mongoose doc
 * @param {T} input.doc - Mongoose document to serialize
 * @returns {Object} Output object with serialized doc
 */
function serializeMongooseDocumentObj(input) {
  return {
    doc: serializeMongooseDocument(input.doc)
  };
}

/**
 * Object-based wrapper for saveAndSerialize
 * 
 * Provides a structured async interface for save-and-serialize workflows.
 * Useful when working with parameter objects or functional composition.
 * 
 * @template T
 * @param {Object} input - Input object containing doc to save
 * @param {Object} input.doc - Mongoose document with save() method
 * @returns {Promise<Object>} Output object with serialized doc after saving
 */
async function saveAndSerializeObj(input) {
  return {
    doc: await saveAndSerialize(input.doc)
  };
}

/**
 * Safely serializes a document with null/undefined handling
 * 
 * Extended version of serializeDocument that provides explicit
 * null/undefined handling and optional default value support.
 * 
 * @template T
 * @param {T} doc - Document to serialize (may be null/undefined)
 * @param {T} [defaultValue=null] - Default value if doc is null/undefined
 * @returns {T|null} Serialized document or default value
 */
function safeSerializeDocument(doc, defaultValue = null) {
  if (doc == null) return defaultValue;
  return serializeDocument(doc);
}

/**
 * Serializes an array with empty array fallback
 * 
 * Safe version of mapAndSerialize that handles null/undefined arrays
 * and provides consistent empty array fallback.
 * 
 * @template T
 * @param {Array<T>} items - Array of documents (may be null/undefined)
 * @returns {Array<any>} Serialized array or empty array
 */
function safeMapAndSerialize(items) {
  if (!items || !Array.isArray(items)) return [];
  return mapAndSerialize(items);
}

/**
 * Serializes selected fields from a document
 * 
 * Allows selective serialization of specific fields, useful for
 * creating API responses with only needed data.
 * 
 * @template T
 * @param {T} doc - Document to serialize
 * @param {Array<string>} fields - Field names to include in output
 * @returns {Object} Object containing only specified fields
 */
function serializeFields(doc, fields) {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result = {};
  for (const field of fields) {
    if (field in serialized) {
      result[field] = serialized[field];
    }
  }
  return result;
}

/**
 * Serializes document and excludes specified fields
 * 
 * Useful for removing sensitive or internal fields from API responses.
 * 
 * @template T
 * @param {T} doc - Document to serialize
 * @param {Array<string>} excludeFields - Field names to exclude from output
 * @returns {Object} Serialized object without excluded fields
 */
function serializeWithoutFields(doc, excludeFields) {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result = { ...serialized };
  for (const field of excludeFields) {
    delete result[field];
  }
  return result;
}

module.exports = {
  serializeDocument,
  serializeMongooseDocument,
  mapAndSerialize,
  saveAndSerialize,
  mapAndSerializeObj,
  serializeDocumentObj,
  serializeMongooseDocumentObj,
  saveAndSerializeObj,
  safeSerializeDocument,
  safeMapAndSerialize,
  serializeFields,
  serializeWithoutFields
};
