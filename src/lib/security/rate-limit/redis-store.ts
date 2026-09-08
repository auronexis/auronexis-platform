import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RateLimitStore, SlidingWindowRateLimitResult } from "@/lib/security/rate-limit/types";

type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

function durationFromMs(windowMs: number): Duration {
  if (windowMs % 86_400_000 === 0) {
    return `${windowMs / 86_400_000} d`;
  }
  if (windowMs % 3_600_000 === 0) {
    return `${windowMs / 3_600_000} h`;
  }
  if (windowMs % 60_000 === 0) {
    return `${windowMs / 60_000} m`;
  }
  if (windowMs % 1_000 === 0) {
    return `${windowMs / 1_000} s`;
  }
  return `${windowMs} ms`;
}

export type UpstashRedisCredentials = {
  url: string;
  token: string;
};

/** Upstash Redis-backed store. timeout:0 so network failures surface as errors (caller applies failurePolicy). */
export function createRedisRateLimitStore(credentials: UpstashRedisCredentials): RateLimitStore {
  const redis = new Redis({ url: credentials.url, token: credentials.token });
  const limiters = new Map<string, Ratelimit>();

  function getLimiter(limit: number, windowMs: number): Ratelimit {
    const cacheKey = `${limit}:${windowMs}`;
    const existing = limiters.get(cacheKey);
    if (existing) {
      return existing;
    }
    const created = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, durationFromMs(windowMs)),
      prefix: "auroranexis:rl",
      analytics: false,
      ephemeralCache: false,
      timeout: 0,
    });
    limiters.set(cacheKey, created);
    return created;
  }

  return {
    async checkSlidingWindow(input): Promise<SlidingWindowRateLimitResult> {
      const limiter = getLimiter(input.limit, input.windowMs);
      const result = await limiter.limit(input.key);
      const retryAfterSeconds = result.success
        ? 0
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

      if (!result.success) {
        return {
          allowed: false,
          limit: result.limit,
          remaining: 0,
          retryAfterSeconds,
          reason: "rate_limit_exceeded",
        };
      }

      return {
        allowed: true,
        limit: result.limit,
        remaining: Math.max(0, result.remaining),
        retryAfterSeconds: 0,
      };
    },
  };
}