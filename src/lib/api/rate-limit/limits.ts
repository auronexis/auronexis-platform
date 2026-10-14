import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import {
  apiKeyRpmKey,
  checkSlidingWindowRateLimit,
  type SlidingWindowRateLimitResult,
} from "@/lib/security/rate-limit";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  backendUnavailable?: boolean;
};

const PLAN_LIMITS_PER_MINUTE: Record<PlanKey, number> = {
  starter: 30,
  professional: 60,
  business: 120,
  enterprise: 300,
};

const WINDOW_MS = 60_000;

export function getRateLimitForPlan(planKey: PlanKey): number {
  return PLAN_LIMITS_PER_MINUTE[planKey];
}

export async function checkApiRateLimit(input: {
  apiKeyId: string;
  planKey: PlanKey;
}): Promise<RateLimitResult> {
  const limit = getRateLimitForPlan(input.planKey);
  const result: SlidingWindowRateLimitResult = await checkSlidingWindowRateLimit({
    key: apiKeyRpmKey(input.apiKeyId),
    limit,
    windowMs: WINDOW_MS,
    failurePolicy: "fail_closed",
    bucketClass: "api.key.rpm",
  });

  return {
    allowed: result.allowed,
    limit: result.limit,
    remaining: result.remaining,
    retryAfterSeconds: result.retryAfterSeconds,
    backendUnavailable: result.backendUnavailable,
  };
}