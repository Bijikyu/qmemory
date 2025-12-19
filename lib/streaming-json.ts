const safeJsonParse = <T = any>(jsonString: string, defaultValue: T | null = null): T | null => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return defaultValue;
  }
};

const safeJsonStringify = (obj: any, indent: number = 0): string => {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return JSON.stringify({
      error: 'Serialization failed',
      message: (error as Error).message,
      type: typeof obj
    });
  }
};

// Re-export native JSON for convenience
export const SafeJSON = JSON;

export {
  safeJsonParse,
  safeJsonStringify
};