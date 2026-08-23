import "server-only";

import {
  hasVerifiedFastSpringSubscription,
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
} from "@/lib/billing/active-billing";
import type { BillingProvider } from "@/lib/billing/provider-types";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import {
  isMollieDefaultForNewSubscriptions,
  isMollieProductionCheckoutEligible,
} from "@/lib/billing/providers/mollie/rollout";
import { isSubscriptionUsable } from "@/lib/billing/status";
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
      kind: "owned";
      provider: "fastspring";
      reason: "existing_fastspring_subscription";
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
    | "existing_fastspring_subscription"
    | "mollie_allowlist_eligible"
    | "mollie_default_for_new"
    | "fastspring_blocks_mollie";
  /** True when an existing external subscription owns the org (not merely rollout-eligible). */
  ownership: "mollie" | "fastspring" | "none";
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
 * Resolve existing provider ownership only — ignores rollout / allowlist / default-for-new.
 * Used so rollback can disable NEW Mollie without rewriting Mollie-owned orgs.
 * Historical FastSpring rows remain owned so Mollie never silently double-bills them.
 */
export function resolveBillingProviderOwnership(input: {
  subscription?: OrganizationSubscription | null;
}): BillingProviderOwnership {
  const subscription = input.subscription ?? null;

  if (isMollieBackedSubscription(subscription)) {
    return {
      kind: "owned",
      provider: "mollie",
      reason: "existing_mollie_subscription",
    };
  }

  if (isUsableFastSpringRow(subscription)) {
    return {
      kind: "owned",
      provider: "fastspring",
      reason: "existing_fastspring_subscription",
    };
  }

  if (isFastSpringBackedSubscription(subscription) && hasVerifiedFastSpringSubscription(subscription)) {
    return {
      kind: "owned",
      provider: "fastspring",
      reason: "existing_fastspring_subscription",
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
 * 1. Existing Mollie ownership
 * 2. Existing FastSpring ownership (historical) — blocks Mollie new checkout
 * 3. New-checkout eligibility → Mollie
 * 4. Global getActiveBillingProvider() → Mollie
 *
 * FastSpring checkout is retired — ownership detection is for safety/entitlements only.
 * No silent migration of paid FastSpring orgs.
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

  if (ownership.kind === "owned" && ownership.provider === "fastspring") {
    return {
      provider: "fastspring",
      reason: "fastspring_blocks_mollie",
      ownership: "fastspring",
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
