import "server-only";

import type { IntegrationProviderId } from "@/lib/integrations/types";

/** Delivery retry schedule: immediate → 5s → 30s → 5min → dead letter. */
export const DEFAULT_RETRY_DELAYS_MS = [0, 5_000, 30_000, 300_000] as const;

export type RetryPolicy = {
  maxRetries: number;
  delaysMs: readonly number[];
};

const PROVIDER_RETRY_POLICIES: Partial<Record<IntegrationProviderId, RetryPolicy>> = {
  slack: { maxRetries: 4, delaysMs: DEFAULT_RETRY_DELAYS_MS },
  microsoft_teams: { maxRetries: 4, delaysMs: DEFAULT_RETRY_DELAYS_MS },
  discord: { maxRetries: 4, delaysMs: DEFAULT_RETRY_DELAYS_MS },
  webhook: { maxRetries: 4, delaysMs: DEFAULT_RETRY_DELAYS_MS },
};

export function getRetryPolicy(providerId: IntegrationProviderId): RetryPolicy {
  return (
    PROVIDER_RETRY_POLICIES[providerId] ?? {
      maxRetries: 4,
      delaysMs: DEFAULT_RETRY_DELAYS_MS,
    }
  );
}

export function getRetryDelayMs(retryCount: number, policy: RetryPolicy = getRetryPolicy("webhook")): number {
  const index = Math.min(retryCount, policy.delaysMs.length - 1);
  return policy.delaysMs[index] ?? policy.delaysMs[policy.delaysMs.length - 1] ?? 0;
}

export function computeNextRetryAt(
  retryCount: number,
  providerId: IntegrationProviderId,
  from: Date = new Date(),
): Date | null {
  const policy = getRetryPolicy(providerId);
  if (retryCount >= policy.maxRetries) {
    return null;
  }

  const delayMs = getRetryDelayMs(retryCount, policy);
  return new Date(from.getTime() + delayMs);
}

export function isDeadLetter(retryCount: number, providerId: IntegrationProviderId): boolean {
  const policy = getRetryPolicy(providerId);
  return retryCount >= policy.maxRetries;
}

export function describeRetrySchedule(providerId: IntegrationProviderId): string {
  const policy = getRetryPolicy(providerId);
  const labels = ["immediate", "5 sec", "30 sec", "5 min", "dead"];
  return labels.slice(0, policy.maxRetries + 1).join(" → ");
}
