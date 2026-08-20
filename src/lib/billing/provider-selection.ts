import "server-only";

import {
  hasVerifiedFastSpringSubscription,
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
  hasVerifiedMollieSubscription,
} from "@/lib/billing/active-billing";
import type { BillingProvider } from "@/lib/billing/provider-types";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { isMollieProductionCheckoutEligible } from "@/lib/billing/providers/mollie/rollout";
import { isSubscriptionUsable } from "@/lib/billing/status";
import type { OrganizationSubscription } from "@/types/database";

export type OrganizationBillingProviderResolution = {
  /** Provider that drives checkout, entitlements, and preferred-row selection for this org. */
  provider: BillingProvider;
  /** Why this provider was chosen — sanitized for diagnostics. */
  reason:
    | "global_default_fastspring"
    | "existing_mollie_subscription"
    | "mollie_allowlist_eligible"
    | "fastspring_blocks_mollie";
};

function isUsableFastSpringRow(row: OrganizationSubscription | null | undefined): boolean {
  if (!isFastSpringBackedSubscription(row)) {
    return false;
  }
  if (hasVerifiedFastSpringSubscription(row) && isSubscriptionUsable(row?.provider_status ?? row?.status)) {
    return true;
  }
  return false;
}

/**
 * Resolve which billing provider owns this organization.
 *
 * Safety:
 * - Global getActiveBillingProvider() remains FastSpring (never blindly Mollie).
 * - Existing usable FastSpring subscriptions stay FastSpring.
 * - Mollie only when allowlisted (+ rollout) OR already persisted as Mollie.
 * - No silent migration of paid FastSpring orgs.
 */
export function resolveOrganizationBillingProvider(input: {
  organizationId: string;
  subscription?: OrganizationSubscription | null;
}): OrganizationBillingProviderResolution {
  const subscription = input.subscription ?? null;

  if (isMollieBackedSubscription(subscription) && hasVerifiedMollieSubscription(subscription)) {
    return { provider: "mollie", reason: "existing_mollie_subscription" };
  }

  if (isMollieBackedSubscription(subscription)) {
    // Mollie row present (including incomplete/sync_pending) — stay on Mollie path.
    return { provider: "mollie", reason: "existing_mollie_subscription" };
  }

  if (isUsableFastSpringRow(subscription)) {
    return { provider: "fastspring", reason: "fastspring_blocks_mollie" };
  }

  if (isFastSpringBackedSubscription(subscription) && hasVerifiedFastSpringSubscription(subscription)) {
    // Non-usable but verified FastSpring (past_due / canceled with id) — do not steal.
    return { provider: "fastspring", reason: "fastspring_blocks_mollie" };
  }

  if (isMollieProductionCheckoutEligible(input.organizationId)) {
    return { provider: "mollie", reason: "mollie_allowlist_eligible" };
  }

  const global = getActiveBillingProvider();
  return {
    provider: global,
    reason: "global_default_fastspring",
  };
}

/** Convenience: provider id only. */
export function getOrganizationBillingProvider(input: {
  organizationId: string;
  subscription?: OrganizationSubscription | null;
}): BillingProvider {
  return resolveOrganizationBillingProvider(input).provider;
}
