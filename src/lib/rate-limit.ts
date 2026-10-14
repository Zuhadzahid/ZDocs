/**
 * Small fixed-window rate limiter kept in process memory.
 *
 * Good enough to blunt password guessing on a single instance and to keep the
 * sign-in path honest in tests. On a multi-instance deployment (Vercel scales
 * horizontally) each instance keeps its own counters, so for a hard guarantee
 * swap the Map for Upstash Redis or Vercel KV using the same interface.
 */
export interface RateLimiter {
  /** Returns true when the key is still within its allowance. */
  check(key: string): boolean;
  reset(key: string): void;
}

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key) {
      const t = now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= t) {
        hits.set(key, { count: 1, resetAt: t + windowMs });
        // Opportunistic cleanup so the map cannot grow without bound.
        if (hits.size > 10_000) {
          for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
        }
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

/** 10 sign-in attempts per email per minute. */
export const signInLimiter = createRateLimiter(10, 60_000);
