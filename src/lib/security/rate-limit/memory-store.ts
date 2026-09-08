import type { RateLimitStore, SlidingWindowRateLimitResult } from "@/lib/security/rate-limit/types";

type Bucket = {
  count: number;
  windowStart: number;
};

/** Process-local sliding-window store — for development, test DI, and non-production fallback. */
export function createMemoryRateLimitStore(): RateLimitStore {
  const buckets = new Map<string, Bucket>();

  return {
    async checkSlidingWindow(input): Promise<SlidingWindowRateLimitResult> {
      const now = Date.now();
      const existing = buckets.get(input.key);

      if (!existing || now - existing.windowStart >= input.windowMs) {
        buckets.set(input.key, { count: 1, windowStart: now });
        return {
          allowed: true,
          limit: input.limit,
          remaining: Math.max(0, input.limit - 1),
          retryAfterSeconds: 0,
        };
      }

      if (existing.count >= input.limit) {
        return {
          allowed: false,
          limit: input.limit,
          remaining: 0,
          retryAfterSeconds: Math.ceil((input.windowMs - (now - existing.windowStart)) / 1000),
          reason: "rate_limit_exceeded",
        };
      }

      existing.count += 1;
      buckets.set(input.key, existing);
      return {
        allowed: true,
        limit: input.limit,
        remaining: Math.max(0, input.limit - existing.count),
        retryAfterSeconds: 0,
      };
    },
    reset() {
      buckets.clear();
    },
  };
}