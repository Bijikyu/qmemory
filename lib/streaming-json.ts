import qerrors from 'qerrors';

const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    qerrors.qerrors(error as Error, 'streaming-json.safeJsonParse', {
      stringLength: typeof jsonString === 'string' ? jsonString.length : -1,
      stringType: typeof jsonString,
      hasDefaultValue: defaultValue !== null,
      operation: 'json-parse',
    });
    return defaultValue;
  }
};
const safeJsonStringify = (obj, indent = 0) => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    qerrors.qerrors(error as Error, 'streaming-json.safeJsonStringify', {
      objectType: typeof obj,
      indent,
      hasCircularReference: error.message?.includes('circular') || false,
      operation: 'json-stringify',
    });
    return JSON.stringify({
      error: 'Serialization failed',
      message: (error as Error).message || 'Unknown serialization error',
      type: typeof obj,
    });
  }
};
// Re-export native JSON for convenience
export const SafeJSON = JSON;
export { safeJsonParse, safeJsonStringify };
