const serializeDocument = (doc) => {
  if (!doc) return doc;
  if (typeof doc.toObject === 'function') return doc.toObject();
  if (typeof doc.toJSON === 'function') return doc.toJSON();
  return { ...doc };
};

const serializeMongooseDocument = (doc) => serializeDocument(doc);

const mapAndSerialize = (items) => items.map(item => serializeMongooseDocument(item));

const saveAndSerialize = async (doc) => {
  await doc.save();
  return serializeMongooseDocument(doc);
};

const mapAndSerializeObj = (input) => ({ items: mapAndSerialize(input.items) });

const serializeDocumentObj = (input) => ({ doc: serializeDocument(input.doc) });

const serializeMongooseDocumentObj = (input) => ({ doc: serializeMongooseDocument(input.doc) });

const saveAndSerializeObj = async (input) => ({ doc: await saveAndSerialize(input.doc) });

const safeSerializeDocument = (doc, defaultValue = null) => (doc == null ? defaultValue : serializeDocument(doc));

const safeMapAndSerialize = (items) => (!items || !Array.isArray(items)) ? [] : mapAndSerialize(items);

const serializeFields = (doc, fields) => {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result = {};
  for (const field of fields) {
    if (field in serialized) result[field] = serialized[field];
  }
  return result;
};

const serializeWithoutFields = (doc, excludeFields) => {
  if (!doc) return null;
  const serialized = serializeDocument(doc);
  const result = { ...serialized };
  for (const field of excludeFields) delete result[field];
  return result;
};

module.exports = { serializeDocument, serializeMongooseDocument, mapAndSerialize, saveAndSerialize, mapAndSerializeObj, serializeDocumentObj, serializeMongooseDocumentObj, saveAndSerializeObj, safeSerializeDocument, safeMapAndSerialize, serializeFields, serializeWithoutFields };