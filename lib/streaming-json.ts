const safeJsonParse = (jsonString, defaultValue = null) => {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        return defaultValue;
    }
};
const safeJsonStringify = (obj, indent = 0) => {
    try {
        return JSON.stringify(obj, null, indent);
    }
    catch (error) {
        return JSON.stringify({
            error: 'Serialization failed',
            message: error.message,
            type: typeof obj
        });
    }
};
// Re-export native JSON for convenience
export const SafeJSON = JSON;
export { safeJsonParse, safeJsonStringify };
