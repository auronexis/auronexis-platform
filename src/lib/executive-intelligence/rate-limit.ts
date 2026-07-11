import "server-only";

import { AI_RATE_LIMIT_PER_DAY, AI_RATE_LIMIT_PER_MINUTE } from "@/lib/executive-intelligence/constants";
import { checkSlidingWindowRateLimit } from "@/lib/security/rate-limit";

export function checkExecutiveIntelligenceRateLimit(
  organizationId: string,
  userId: string,
): { allowed: boolean; retryAfterSeconds: number } {
  const minute = checkSlidingWindowRateLimit({
    key: `ei_ai_min:${organizationId}:${userId}`,
    limit: AI_RATE_LIMIT_PER_MINUTE,
    windowMs: 60_000,
  });
  if (!minute.allowed) {
    return { allowed: false, retryAfterSeconds: minute.retryAfterSeconds };
  }

  const day = checkSlidingWindowRateLimit({
    key: `ei_ai_day:${organizationId}`,
    limit: AI_RATE_LIMIT_PER_DAY,
    windowMs: 86_400_000,
  });
  if (!day.allowed) {
    return { allowed: false, retryAfterSeconds: day.retryAfterSeconds };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
