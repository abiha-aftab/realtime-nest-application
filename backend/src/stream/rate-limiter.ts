export type RateDecision =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

/**
 * Fixed-window counter per key. Keys are client addresses rather than socket
 * ids, so reconnecting does not reset the budget.
 */
export class RateLimiter {
  private readonly windows = new Map<
    string,
    { start: number; count: number }
  >();

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateDecision {
    const now = this.now();
    this.evictExpired(now);
    const current = this.windows.get(key);
    if (!current) {
      this.windows.set(key, { start: now, count: 1 });
      return { allowed: true };
    }
    if (current.count < this.max) {
      current.count += 1;
      return { allowed: true };
    }
    return {
      allowed: false,
      retryAfterMs: current.start + this.windowMs - now,
    };
  }

  get trackedKeys(): number {
    return this.windows.size;
  }

  private evictExpired(now: number): void {
    for (const [key, window] of this.windows) {
      if (now - window.start >= this.windowMs) this.windows.delete(key);
    }
  }
}
