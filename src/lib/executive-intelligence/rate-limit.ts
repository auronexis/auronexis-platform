import "server-only";

import { AI_RATE_LIMIT_PER_DAY, AI_RATE_LIMIT_PER_MINUTE } from "@/lib/executive-intelligence/constants";
import {
  checkSlidingWindowRateLimit,
  executiveIntelligenceDayKey,
  executiveIntelligenceMinuteKey,
} from "@/lib/security/rate-limit";

export async function checkExecutiveIntelligenceRateLimit(
  organizationId: string,
  userId: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number; backendUnavailable?: boolean }> {
  const minute = await checkSlidingWindowRateLimit({
    key: executiveIntelligenceMinuteKey(organizationId, userId),
    limit: AI_RATE_LIMIT_PER_MINUTE,
    windowMs: 60_000,
    failurePolicy: "fail_closed",
    bucketClass: "ei.ai.minute",
  });
  if (!minute.allowed) {
    return {
      allowed: false,
      retryAfterSeconds: minute.retryAfterSeconds,
      backendUnavailable: minute.backendUnavailable,
    };
  }

  const day = await checkSlidingWindowRateLimit({
    key: executiveIntelligenceDayKey(organizationId),
    limit: AI_RATE_LIMIT_PER_DAY,
    windowMs: 86_400_000,
    failurePolicy: "fail_closed",
    bucketClass: "ei.ai.day",
  });
  if (!day.allowed) {
    return {
      allowed: false,
      retryAfterSeconds: day.retryAfterSeconds,
      backendUnavailable: day.backendUnavailable,
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}