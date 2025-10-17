import { beforeEach, describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let now: number;
  const clock = () => now;

  beforeEach(() => {
    now = 1_000;
  });

  it('allows up to max calls per window, then reports when to retry', () => {
    const limiter = new RateLimiter(2, 1_000, clock);
    expect(limiter.check('a')).toEqual({ allowed: true });
    expect(limiter.check('a')).toEqual({ allowed: true });
    now += 400;
    expect(limiter.check('a')).toEqual({ allowed: false, retryAfterMs: 600 });
  });

  it('tracks keys independently', () => {
    const limiter = new RateLimiter(1, 1_000, clock);
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('opens a new window and forgets expired keys', () => {
    const limiter = new RateLimiter(1, 1_000, clock);
    limiter.check('a');
    limiter.check('b');
    now += 1_000;
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.trackedKeys).toBe(1);
  });
});
