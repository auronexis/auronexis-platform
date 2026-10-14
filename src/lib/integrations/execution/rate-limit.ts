import "server-only";

import type { IntegrationProviderId } from "@/lib/integrations/types";
import {
  checkSlidingWindowRateLimit,
  integrationOrgProviderKey,
  resetRateLimitBucketsForTests,
} from "@/lib/security/rate-limit";

/** Per-provider limits (requests per rolling minute). */
const PROVIDER_LIMITS: Partial<Record<IntegrationProviderId, number>> = {
  slack: 30,
  microsoft_teams: 30,
  discord: 30,
  webhook: 60,
};

const DEFAULT_LIMIT = 30;
const WINDOW_MS = 60_000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number; limit: number; backendUnavailable?: boolean };

export async function checkIntegrationRateLimit(
  organizationId: string,
  providerId: IntegrationProviderId,
): Promise<RateLimitResult> {
  const limit = PROVIDER_LIMITS[providerId] ?? DEFAULT_LIMIT;
  const result = await checkSlidingWindowRateLimit({
    key: integrationOrgProviderKey(organizationId, providerId),
    limit,
    windowMs: WINDOW_MS,
    failurePolicy: "fail_closed",
    bucketClass: "integration.provider",
  });

  if (!result.allowed) {
    return {
      allowed: false,
      retryAfterMs: Math.max(result.retryAfterSeconds * 1000, 1_000),
      limit: result.limit,
      backendUnavailable: result.backendUnavailable,
    };
  }

  return { allowed: true };
}

export function getRateLimitForProvider(providerId: IntegrationProviderId): number {
  return PROVIDER_LIMITS[providerId] ?? DEFAULT_LIMIT;
}

export function resetRateLimitsForTests(): void {
  resetRateLimitBucketsForTests();
}