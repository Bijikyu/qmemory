const getMongoType = (paramType: string): string => {
  if (typeof paramType !== 'string' || !paramType.trim()) return 'Mixed';
  
  const aliases: Record<string, string> = {
    'str': 'string', 'text': 'string', 'num': 'number', 'int': 'number', 'integer': 'number',
    'float': 'number', 'double': 'number', 'bool': 'boolean', 'datetime': 'date',
    'timestamp': 'date', 'id': 'objectid', 'oid': 'objectid', 'uuid': 'objectid'
  };
  
  const normalizedType = aliases[paramType.toLowerCase()] || paramType.toLowerCase();
  
  switch (normalizedType) {
    case 'string': return 'String';
    case 'number': return 'Number';
    case 'boolean': return 'Boolean';
    case 'object': return 'Object';
    case 'array': return 'Array';
    case 'date': return 'Date';
    case 'objectid': return 'ObjectId';
    case 'mixed': return 'Mixed';
    case 'buffer': return 'Buffer';
    case 'decimal': 
    case 'decimal128': 
      return 'Decimal128';
    case 'map': return 'Map';
    default: return 'Mixed';
  }
};

const getSupportedTypes = (): Record<string, string> => ({
  'string': 'String', 'number': 'Number', 'boolean': 'Boolean', 'object': 'Object', 'array': 'Array', 'date': 'Date',
  'objectid': 'ObjectId', 'mixed': 'Mixed', 'buffer': 'Buffer', 'decimal': 'Decimal128',
  'decimal128': 'Decimal128', 'map': 'Map', 'str': 'String', 'text': 'String', 'num': 'Number',
  'int': 'Number', 'integer': 'Number', 'float': 'Number', 'double': 'Number', 'bool': 'Boolean',
  'datetime': 'Date', 'timestamp': 'Date', 'id': 'ObjectId', 'oid': 'ObjectId', 'uuid': 'ObjectId'
});

const isSupportedType = (type: string): boolean => {
  if (typeof type !== 'string' || !type.trim()) return false;
  const supportedTypes = getSupportedTypes();
  return Object.prototype.hasOwnProperty.call(supportedTypes, type.toLowerCase());
};

export {
  getMongoType,
  getSupportedTypes,
  isSupportedType
};