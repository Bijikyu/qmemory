/**
 * Redis Reconnection Strategy
 * Computes resilient reconnection strategy with capped delay escalation
 */

export class CacheReconnectStrategy {
  private static readonly MAX_RETRIES = Number(process.env.REDIS_MAX_RETRIES) || 10;
  private static readonly BASE_DELAY = Number(process.env.REDIS_BASE_DELAY) || 50;
  private static readonly MAX_DELAY = Number(process.env.REDIS_MAX_DELAY) || 1000;

  /**
   * Computes reconnection Strategy with delay capping
   */
  static getStrategy(retries: number): number | Error {
    if (retries > this.MAX_RETRIES) {
      return new Error(`Redis reconnection failed after ${this.MAX_RETRIES} attempts`);
    }

    return Math.min(retries * this.BASE_DELAY, this.MAX_DELAY);
  }

  static asNumber(value: string | number, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
