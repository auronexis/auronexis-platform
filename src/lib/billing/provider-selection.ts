import "server-only";

import { isMollieBackedSubscription } from "@/lib/billing/active-billing";
import { isLegacyQuarantinedSubscriptionRow } from "@/lib/billing/legacy-quarantine";
import type { BillingProvider } from "@/lib/billing/provider-types";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import {
  isMollieDefaultForNewSubscriptions,
  isMollieProductionCheckoutEligible,
} from "@/lib/billing/providers/mollie/rollout";
import type { OrganizationSubscription } from "@/types/database";

/**
 * Ownership is authoritative when an external subscription already exists.
 * Rollout / allowlist / default-for-new never overwrite ownership.
 */
export type BillingProviderOwnership =
  | {
      kind: "owned";
      provider: "mollie";
      reason: "existing_mollie_subscription";
    }
  | {
      kind: "none";
      provider: null;
      reason: "no_external_subscription";
    };

export type OrganizationBillingProviderResolution = {
  /** Provider that drives checkout, entitlements, and preferred-row selection for this org. */
  provider: BillingProvider;
  /**
   * Why this provider was chosen.
   * Ownership reasons always win over rollout eligibility and global default.
   */
  reason:
    | "global_default_mollie"
    | "existing_mollie_subscription"
    | "mollie_allowlist_eligible"
    | "mollie_default_for_new";
  /** True when an existing external subscription owns the org (not merely rollout-eligible). */
  ownership: "mollie" | "none";
};

/**
 * Resolve existing provider ownership only — ignores rollout / allowlist / default-for-new.
 * Mollie is the sole authority. Legacy stripe/paddle/fastspring rows never own an org.
 */
export function resolveBillingProviderOwnership(input: {
  subscription?: OrganizationSubscription | null;
}): BillingProviderOwnership {
  const subscription = input.subscription ?? null;

  if (
    isMollieBackedSubscription(subscription) &&
    !isLegacyQuarantinedSubscriptionRow(subscription)
  ) {
    return {
      kind: "owned",
      provider: "mollie",
      reason: "existing_mollie_subscription",
    };
  }

  return {
    kind: "none",
    provider: null,
    reason: "no_external_subscription",
  };
}

/**
 * Resolve which billing provider owns / should serve this organization.
 *
 * Decision order (Mollie sole-provider):
 * 1. Existing authoritative Mollie ownership
 * 2. New-checkout eligibility → Mollie
 * 3. Global getActiveBillingProvider() → Mollie
 *
 * Legacy stripe/paddle/fastspring rows are quarantined — never ownership.
 */
export function resolveOrganizationBillingProvider(input: {
  organizationId: string;
  subscription?: OrganizationSubscription | null;
}): OrganizationBillingProviderResolution {
  const ownership = resolveBillingProviderOwnership({ subscription: input.subscription });

  if (ownership.kind === "owned" && ownership.provider === "mollie") {
    return {
      provider: "mollie",
      reason: "existing_mollie_subscription",
      ownership: "mollie",
    };
  }

  if (isMollieProductionCheckoutEligible(input.organizationId)) {
    return {
      provider: "mollie",
      reason: isMollieDefaultForNewSubscriptions()
        ? "mollie_default_for_new"
        : "mollie_allowlist_eligible",
      ownership: "none",
    };
  }

  const global = getActiveBillingProvider();
  return {
    provider: global,
    reason: "global_default_mollie",
    ownership: "none",
  };
}

/**
 * Canonical alias — ownership vs new-checkout eligibility vs global default.
 */
export function resolveBillingProviderForOrganization(input: {
  organizationId: string;
  subscription?: OrganizationSubscription | null;
}): OrganizationBillingProviderResolution {
  return resolveOrganizationBillingProvider(input);
}

/** Convenience: provider id only. */
export function getOrganizationBillingProvider(input: {
  organizationId: string;
  subscription?: OrganizationSubscription | null;
}): BillingProvider {
  return resolveOrganizationBillingProvider(input).provider;
}
