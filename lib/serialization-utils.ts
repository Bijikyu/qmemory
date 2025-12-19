/**
 * Serialization Utilities
 * Utilities for serializing MongoDB/Mongoose documents and handling object transformations
 */
// 🚩AI: ENTRY_POINT_FOR_SERIALIZATION_UTILS
// 🚩AI: MUST_UPDATE_IF_SERIALIZATION_CONTRACTS_CHANGE

import type { Document, LeanDocument, HydratedDocument } from 'mongoose';

/**
 * Helper type that extracts the "lean" representation of a Mongoose document
 * without losing inference for schema-defined shapes.
 */
export type SerializedDocument<T> =
  T extends null | undefined ? T :
  T extends Document ? LeanDocument<T> :
  T extends HydratedDocument<infer U> ? U :
  T extends { toObject(): infer TObject } ? TObject :
  T extends { toJSON(): infer TJson } ? TJson :
  T;

/**
 * Serialize a document to a plain object while preserving the caller's type
 * expectations through conditional types.
 * @param doc - Document to serialize
 * @returns Serialized document or null/undefined if input is null/undefined
 */
export const serializeDocument = <T>(doc: T): SerializedDocument<T> => {
  if (doc == null) {
    return doc as SerializedDocument<T>;
  }

  const candidate: Record<string, unknown> & {
    toObject?: () => unknown;
    toJSON?: () => unknown;
  } = doc as unknown as Record<string, unknown> & {
    toObject?: () => unknown;
    toJSON?: () => unknown;
  };

  if (typeof candidate.toObject === 'function') {
    return candidate.toObject() as SerializedDocument<T>;
  }

  if (typeof candidate.toJSON === 'function') {
    return candidate.toJSON() as SerializedDocument<T>;
  }

  return { ...candidate } as SerializedDocument<T>;
};

/**
 * Serialize a Mongoose document (alias for serializeDocument)
 * @param doc - Mongoose document to serialize
 * @returns Serialized document
 */
export const serializeMongooseDocument = <T extends Document | HydratedDocument<unknown>>(doc: T): SerializedDocument<T> =>
  serializeDocument<T>(doc);

/**
 * Map and serialize an array of items
 * @param items - Array of items to serialize
 * @returns Array of serialized items
 */
export const mapAndSerialize = <T>(items: T[]): SerializedDocument<T>[] =>
  items.map(item => serializeDocument(item));

/**
 * Save a document and then serialize it. Restricting the input to Document
 * keeps the save call sound while still returning the serialised shape.
 * @param doc - Document to save and serialize
 * @returns Serialized document after saving
 */
export const saveAndSerialize = async <T extends Document>(doc: T): Promise<SerializedDocument<T>> => {
  await doc.save();
  return serializeMongooseDocument(doc);
};

/**
 * Map and serialize items within an object structure
 * @param input - Object containing items array
 * @returns Object with serialized items
 */
export const mapAndSerializeObj = <T>(input: { items: T[] }): { items: SerializedDocument<T>[] } => ({
  items: mapAndSerialize(input.items)
});

/**
 * Serialize a document within an object structure
 * @param input - Object containing doc
 * @returns Object with serialized doc
 */
export const serializeDocumentObj = <T>(input: { doc: T }): { doc: SerializedDocument<T> } => ({
  doc: serializeDocument(input.doc)
});

/**
 * Serialize a Mongoose document within an object structure
 * @param input - Object containing doc
 * @returns Object with serialized doc
 */
export const serializeMongooseDocumentObj = <T extends Document | HydratedDocument<unknown>>(input: { doc: T }): { doc: SerializedDocument<T> } => ({
  doc: serializeMongooseDocument(input.doc)
});

/**
 * Save and serialize a document within an object structure
 * @param input - Object containing doc
 * @returns Object with saved and serialized doc
 */
export const saveAndSerializeObj = async <T extends Document>(input: { doc: T }): Promise<{ doc: SerializedDocument<T> }> => ({
  doc: await saveAndSerialize(input.doc)
});

/**
 * Safely serialize a document with a default value for null/undefined
 * @param doc - Document to serialize
 * @param defaultValue - Default value if doc is null/undefined
 * @returns Serialized document or default value
 */
export const safeSerializeDocument = <T, TDefault = null>(doc: T, defaultValue: TDefault | SerializedDocument<T> = null as TDefault): SerializedDocument<T> | TDefault =>
  doc == null ? defaultValue : serializeDocument(doc);

/**
 * Safely map and serialize an array with null/undefined checks
 * @param items - Array to serialize
 * @returns Array of serialized items or empty array if input is invalid
 */
export const safeMapAndSerialize = <T>(items: T[] | null | undefined): SerializedDocument<T>[] =>
  !items || !Array.isArray(items) ? [] : mapAndSerialize(items);

/**
 * Serialize only specific fields from a document
 * @param doc - Document to serialize
 * @param fields - Array of field names to include
 * @returns Object with only specified fields
 */
export const serializeFields = <T extends Record<string, unknown>, TField extends keyof SerializedDocument<T>>(doc: T, fields: TField[]): Pick<SerializedDocument<T>, TField> | null => {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result: Partial<SerializedDocument<T>> = {};
  for (const field of fields) {
    if (field in serialized) result[field] = serialized[field];
  }
  return result as Pick<SerializedDocument<T>, TField>;
};

/**
 * Serialize a document excluding specific fields
 * @param doc - Document to serialize
 * @param excludeFields - Array of field names to exclude
 * @returns Object without specified fields
 */
export const serializeWithoutFields = <T extends Record<string, unknown>, TField extends keyof SerializedDocument<T>>(doc: T, excludeFields: TField[]): Omit<SerializedDocument<T>, TField> | null => {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result = { ...serialized } as SerializedDocument<T>;
  for (const field of excludeFields) delete result[field];
  return result as Omit<SerializedDocument<T>, TField>;
};
