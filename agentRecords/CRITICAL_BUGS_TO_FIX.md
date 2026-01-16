// CRITICAL SECURITY BUGS FOUND AND FIXED

// Bug 1: Memory leak in rate limiter - add cleanup method
class BasicRateLimiter {
private store: RateLimitStore = {};
private windowMs: number;
private maxRequests: number;
private cleanupInterval: NodeJS.Timeout;

constructor(windowMs: number, maxRequests: number) {
this.windowMs = windowMs;
this.maxRequests = maxRequests;

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 60000);

}

destroy(): void {
if (this.cleanupInterval) {
clearInterval(this.cleanupInterval);
}
}
