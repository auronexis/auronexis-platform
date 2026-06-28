export type SlidingWindowRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

/** In-memory sliding-window rate limiter for auth, forms, and public endpoints. */
export function checkSlidingWindowRateLimit(input: {
  key: string;
  limit: number;
  windowMs?: number;
}): SlidingWindowRateLimitResult {
  const windowMs = input.windowMs ?? 60_000;
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(input.key, { count: 1, windowStart: now });
    return {
      allowed: true,
      limit: input.limit,
      remaining: input.limit - 1,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      limit: input.limit,
      remaining: 0,
      retryAfterSeconds: Math.ceil((windowMs - (now - existing.windowStart)) / 1000),
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
}

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
