import type { PlanKey } from "@/lib/billing/plans";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const PLAN_LIMITS_PER_MINUTE: Record<PlanKey, number> = {
  starter: 30,
  professional: 60,
  business: 120,
  enterprise: 300,
};

type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export function getRateLimitForPlan(planKey: PlanKey): number {
  return PLAN_LIMITS_PER_MINUTE[planKey];
}

export function checkApiRateLimit(input: {
  apiKeyId: string;
  planKey: PlanKey;
}): RateLimitResult {
  const limit = getRateLimitForPlan(input.planKey);
  const now = Date.now();
  const key = input.apiKeyId;
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, limit, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - existing.windowStart)) / 1000);
    return { allowed: false, limit, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
  };
}
