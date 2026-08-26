import "server-only";

import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { safeGetPlanKeyFromSubscriptionPrice } from "@/lib/billing/plans.server";
import { resolveActiveBillingStatusFlags } from "@/lib/billing/active-billing";
import { pickSubscriptionProviderHintRow } from "@/lib/billing/legacy-quarantine";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import { selectPreferredSubscriptionSummaryRow } from "@/lib/billing/subscription-selection";
import type { BillingProvider } from "@/lib/billing/provider-types";
import { getDefaultPlanKey } from "@/lib/plans/features";
import { getDevForcePlanOverride } from "@/lib/plans/dev-override";
import type { PlanResolutionSource } from "@/lib/plans/types";
import type { OrganizationSubscription } from "@/types/database";

/** Minimal subscription fields required for effective-plan resolution. */
export type EffectivePlanSubscriptionRow = {
  stripe_price_id: string | null;
  provider_price_id: string | null;
  provider_subscription_id: string | null;
  billing_provider: string | null;
  provider_status?: string | null;
  status: string;
  cancel_at_period_end?: boolean | null;
  current_period_end?: string | null;
  sync_pending?: boolean | null;
  updated_at?: string;
  legacy_archived?: boolean | null;
};

export type EffectivePlanResolution = {
  planKey: PlanKey;
  planLabel: string;
  mappedPlanKeyFromPriceId: PlanKey | null;
  isActiveSubscription: boolean;
  isPaidAccess: boolean;
  planSource: PlanResolutionSource;
  devOverrideActive: boolean;
  planOverrideActive: boolean;
  subscriptionPriceId: string | null;
  subscriptionStatus: string | null;
  billingProvider: BillingProvider;
};

function resolveSubscriptionPriceId(
  subscription: EffectivePlanSubscriptionRow | null,
  billingProvider: string | null,
): string | null {
  if (!subscription) {
    return null;
  }

  // Mollie / FastSpring / Paddle store the commercial plan on provider_price_id.
  if (
    billingProvider === "mollie" ||
    billingProvider === "fastspring" ||
    billingProvider === "paddle"
  ) {
    return subscription.provider_price_id ?? null;
  }

  return subscription.provider_price_id ?? subscription.stripe_price_id ?? null;
}

/**
 * Pure effective-plan resolution from already-loaded subscription rows.
 * Fail closed: unknown / unusable subscriptions do not invent a paid plan.
 * organizations.plan is never used as an entitlement source.
 */
export function resolveEffectivePlanFromSubscriptionRows(input: {
  organizationId: string;
  rows: EffectivePlanSubscriptionRow[];
  planOverride: { status: string; plan: PlanKey } | null;
}): EffectivePlanResolution {
  const preferredHint = pickSubscriptionProviderHintRow(input.rows);
  const activeProvider = getOrganizationBillingProvider({
    organizationId: input.organizationId,
    subscription: preferredHint as OrganizationSubscription | null,
  });

  const subscription = selectPreferredSubscriptionSummaryRow(input.rows, activeProvider);
  const billingProvider =
    (subscription?.billing_provider as BillingProvider | null) ?? activeProvider;
  const subscriptionPriceId = resolveSubscriptionPriceId(subscription, billingProvider);
  const flags = resolveActiveBillingStatusFlags(
    subscription as OrganizationSubscription | null,
    activeProvider,
  );
  const subscriptionStatus = flags.rawStatus ?? subscription?.status ?? null;
  const isActiveSubscription = flags.isUsable;

  let mappedPlanKeyFromPriceId: PlanKey | null = null;
  if (subscriptionPriceId) {
    mappedPlanKeyFromPriceId = safeGetPlanKeyFromSubscriptionPrice({
      billingProvider,
      stripePriceId: subscription?.stripe_price_id,
      providerPriceId: subscription?.provider_price_id ?? subscriptionPriceId,
    });
  }

  let basePlanKey: PlanKey = getDefaultPlanKey();
  let planSource: PlanResolutionSource = "starter_fallback";

  if (isActiveSubscription && mappedPlanKeyFromPriceId) {
    basePlanKey = mappedPlanKeyFromPriceId;
    planSource = "active_subscription";
  } else if (isActiveSubscription && subscriptionPriceId && !mappedPlanKeyFromPriceId) {
    planSource = "unmapped_price_id";
  }

  const devOverride = getDevForcePlanOverride();
  let planOverrideActive = false;

  if (devOverride) {
    basePlanKey = devOverride;
    planSource = "dev_override";
  } else if (input.planOverride?.status === "active") {
    basePlanKey = input.planOverride.plan;
    planSource = "plan_override";
    planOverrideActive = true;
  }

  const plan = safeGetPlanByKey(basePlanKey) ?? safeGetPlanByKey(getDefaultPlanKey());
  const isPaidAccess =
    planSource === "plan_override" ||
    planSource === "dev_override" ||
    (isActiveSubscription && mappedPlanKeyFromPriceId !== null);

  return {
    planKey: basePlanKey,
    planLabel: planOverrideActive
      ? `${plan?.name ?? "Plan"} (Enterprise override)`
      : (plan?.name ?? "Plan"),
    mappedPlanKeyFromPriceId,
    isActiveSubscription,
    isPaidAccess,
    planSource,
    devOverrideActive: devOverride !== null,
    planOverrideActive,
    subscriptionPriceId,
    subscriptionStatus,
    billingProvider: activeProvider,
  };
}
