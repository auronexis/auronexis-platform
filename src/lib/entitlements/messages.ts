import { ENTITLEMENT_LIMIT_LABELS } from "@/lib/entitlements/definitions";
import type { EntitlementLimitKey } from "@/lib/entitlements/types";

export const UPGRADE_PLANS_HREF = "/settings/plans" as const;

export function formatLimitReachedMessage(limitKey: EntitlementLimitKey): string {
  const limitName = ENTITLEMENT_LIMIT_LABELS[limitKey];
  return `You have reached the ${limitName} limit for your current plan.`;
}

export function formatFeatureDeniedMessage(featureLabel: string): string {
  return `${featureLabel} is not available on your current plan.`;
}

export function formatInactiveSubscriptionMessage(): string {
  return "An active subscription is required for this action. Manage billing or choose a plan.";
}
