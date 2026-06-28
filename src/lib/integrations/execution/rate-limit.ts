import "server-only";

import type { IntegrationProviderId } from "@/lib/integrations/types";

type RateLimitBucket = {
  timestamps: number[];
};

const buckets = new Map<string, RateLimitBucket>();

/** Per-provider limits (requests per rolling minute). */
const PROVIDER_LIMITS: Partial<Record<IntegrationProviderId, number>> = {
  slack: 30,
  microsoft_teams: 30,
  discord: 30,
  webhook: 60,
};

const DEFAULT_LIMIT = 30;
const WINDOW_MS = 60_000;

function bucketKey(organizationId: string, providerId: IntegrationProviderId): string {
  return `${organizationId}:${providerId}`;
}

function pruneBucket(bucket: RateLimitBucket, now: number): void {
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number; limit: number };

export function checkIntegrationRateLimit(
  organizationId: string,
  providerId: IntegrationProviderId,
): RateLimitResult {
  const limit = PROVIDER_LIMITS[providerId] ?? DEFAULT_LIMIT;
  const key = bucketKey(organizationId, providerId);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };

  pruneBucket(bucket, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterMs = Math.max(WINDOW_MS - (now - oldest), 1_000);
    buckets.set(key, bucket);
    return { allowed: false, retryAfterMs, limit };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}

export function getRateLimitForProvider(providerId: IntegrationProviderId): number {
  return PROVIDER_LIMITS[providerId] ?? DEFAULT_LIMIT;
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
