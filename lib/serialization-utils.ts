/**
 * Serialization Utilities
 * Utilities for serializing MongoDB/Mongoose documents and handling object transformations
 */

import { Document } from 'mongoose';

/**
 * Serialize a document to a plain object
 * @param doc - Document to serialize
 * @returns Serialized document or null/undefined if input is null/undefined
 */
export const serializeDocument = (doc: any): any => {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  if (typeof doc.toJSON === 'function') return doc.toJSON();
  return { ...doc };
};

/**
 * Serialize a Mongoose document (alias for serializeDocument)
 * @param doc - Mongoose document to serialize
 * @returns Serialized document
 */
export const serializeMongooseDocument = (doc: any): any => serializeDocument(doc);

/**
 * Map and serialize an array of items
 * @param items - Array of items to serialize
 * @returns Array of serialized items
 */
export const mapAndSerialize = (items: any[]): any[] => items.map(item => serializeMongooseDocument(item));

/**
 * Save a document and then serialize it
 * @param doc - Document to save and serialize
 * @returns Serialized document after saving
 */
export const saveAndSerialize = async (doc: Document): Promise<any> => {
  await doc.save();
  return serializeMongooseDocument(doc);
};

/**
 * Map and serialize items within an object structure
 * @param input - Object containing items array
 * @returns Object with serialized items
 */
export const mapAndSerializeObj = (input: { items: any[] }): { items: any[] } => ({ 
  items: mapAndSerialize(input.items) 
});

/**
 * Serialize a document within an object structure
 * @param input - Object containing doc
 * @returns Object with serialized doc
 */
export const serializeDocumentObj = (input: { doc: any }): { doc: any } => ({ 
  doc: serializeDocument(input.doc) 
});

/**
 * Serialize a Mongoose document within an object structure
 * @param input - Object containing doc
 * @returns Object with serialized doc
 */
export const serializeMongooseDocumentObj = (input: { doc: any }): { doc: any } => ({ 
  doc: serializeMongooseDocument(input.doc) 
});

/**
 * Save and serialize a document within an object structure
 * @param input - Object containing doc
 * @returns Object with saved and serialized doc
 */
export const saveAndSerializeObj = async (input: { doc: Document }): Promise<{ doc: any }> => ({ 
  doc: await saveAndSerialize(input.doc) 
});

/**
 * Safely serialize a document with a default value for null/undefined
 * @param doc - Document to serialize
 * @param defaultValue - Default value if doc is null/undefined
 * @returns Serialized document or default value
 */
export const safeSerializeDocument = (doc: any, defaultValue: any = null): any => 
  (doc == null ? defaultValue : serializeDocument(doc));

/**
 * Safely map and serialize an array with null/undefined checks
 * @param items - Array to serialize
 * @returns Array of serialized items or empty array if input is invalid
 */
export const safeMapAndSerialize = (items: any): any[] => 
  (!items || !Array.isArray(items)) ? [] : mapAndSerialize(items);

/**
 * Serialize only specific fields from a document
 * @param doc - Document to serialize
 * @param fields - Array of field names to include
 * @returns Object with only specified fields
 */
export const serializeFields = (doc: any, fields: string[]): any => {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result: any = {};
  for (const field of fields) {
    if (field in serialized) result[field] = serialized[field];
  }
  return result;
};

/**
 * Serialize a document excluding specific fields
 * @param doc - Document to serialize
 * @param excludeFields - Array of field names to exclude
 * @returns Object without specified fields
 */
export const serializeWithoutFields = (doc: any, excludeFields: string[]): any => {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result = { ...serialized };
  for (const field of excludeFields) delete result[field];
  return result;
};