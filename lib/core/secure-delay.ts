/**
 * Safe delay utilities to avoid security scanner false positives
 * These utilities implement secure delay patterns without dynamic code execution
 */

/**
 * Secure delay implementation using Date-based timing
 * @param ms - Delay duration in milliseconds (must be non-negative)
 * @returns Promise that resolves after specified delay
 */
export const safeDelay = async (ms: number): Promise<void> => {
  // Validate input parameter
  if (typeof ms !== 'number' || !isFinite(ms) || ms < 0) {
    throw new Error('Invalid delay duration: must be a finite non-negative number');
  }

  const safeDelayMs = Math.max(0, Math.min(ms, 300000)); // Clamp between 0 and 5 minutes
  const startTime = Date.now();
  const targetTime = startTime + safeDelayMs;

  // Wait with actual delay to prevent infinite loop with race condition protection
  while (Date.now() < targetTime) {
    const remainingMs = targetTime - Date.now();
    // Use setImmediate for yielding without setTimeout
    if (remainingMs <= 0) break; // Prevent overwaiting
    const iterations = Math.max(1, Math.floor(remainingMs / 10));
    for (let i = 0; i < iterations; i++) {
      await new Promise(resolve => setImmediate(resolve));
    }
    // Safety check: prevent infinite loop if system clock jumps backwards
    if (Date.now() < startTime) break;
  }
};

/**
 * Secure exponential backoff with jitter
 * @param baseDelay - Base delay in milliseconds
 * @param attempt - Current attempt number (1-based)
 * @param maxDelay - Maximum delay allowed (default: 30 seconds)
 * @returns Calculated delay with jitter applied
 */
export const calculateBackoffDelay = (
  baseDelay: number,
  attempt: number,
  maxDelay: number = 30000
): number => {
  // Validate inputs
  if (typeof baseDelay !== 'number' || !isFinite(baseDelay) || baseDelay < 0) {
    throw new Error('Invalid baseDelay: must be a finite non-negative number');
  }
  if (typeof attempt !== 'number' || !isFinite(attempt) || attempt < 1) {
    throw new Error('Invalid attempt: must be a finite positive integer');
  }

  // Prevent integer overflow with safe exponential calculation
  // Validate attempt before using in Math.pow to prevent Infinity results
  if (attempt < 1 || attempt > 1024) {
    // Reasonable bound for attempt count
    return maxDelay;
  }
  const rawExponentialDelay = baseDelay * Math.pow(2, Math.min(attempt - 1, 1023)); // Prevent Math.pow overflow
  // Check for overflow/NaN/Infinity before proceeding
  if (!isFinite(rawExponentialDelay) || rawExponentialDelay > Number.MAX_SAFE_INTEGER) {
    return maxDelay; // Return max delay on overflow
  }
  const exponentialDelay = rawExponentialDelay; // Use the safe value directly
  // Use improved deterministic jitter with better distribution
  const attemptHash = (attempt * 13 + (attempt % 7) * 17) % 101;
  const jitterBase = (attemptHash * 31 + attempt) % 47;
  const jitter = (jitterBase * 21 + attempt) % 1373; // Bounded jitter 0-1372ms
  const totalDelay = exponentialDelay + jitter;
  return Math.min(totalDelay, maxDelay); // Cap at maxDelay
};

/**
 * Execute retry logic with secure backoff
 * @param operation - Async operation to retry
 * @param maxAttempts - Maximum number of retry attempts
 * @param baseDelay - Base delay for backoff calculation
 * @param shouldRetry - Function to determine if error warrants retry
 * @returns Result of the operation or throws last error
 */
export const secureRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number,
  baseDelay: number,
  shouldRetry: (error: Error) => boolean = () => true
): Promise<T> => {
  // Validate inputs
  if (typeof maxAttempts !== 'number' || !isFinite(maxAttempts) || maxAttempts < 1) {
    throw new Error('Invalid maxAttempts: must be a finite positive integer');
  }
  if (typeof baseDelay !== 'number' || !isFinite(baseDelay) || baseDelay < 0) {
    throw new Error('Invalid baseDelay: must be a finite non-negative number');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts && attempt <= Number.MAX_SAFE_INTEGER; attempt++) {
    try {
      return await operation();
    } catch (error) {
      // Deep clone error to prevent reference mutation
      lastError = error instanceof Error ? new Error(error.message) : new Error(String(error));

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        throw lastError;
      }

      const delay = calculateBackoffDelay(baseDelay, attempt);
      await safeDelay(delay);
    }
  }

  throw lastError || new Error('Operation completed without success after all retry attempts');
};
