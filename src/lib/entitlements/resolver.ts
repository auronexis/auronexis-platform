import "server-only";

import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  maskStripePriceId,
  safeGetPlanKeyFromSubscriptionPrice,
} from "@/lib/billing/plans.server";
import {
  getOrganizationSubscription,
  ORGANIZATION_SUBSCRIPTION_SELECT,
} from "@/lib/billing/queries";
import { pickSubscriptionProviderHintRow } from "@/lib/billing/legacy-quarantine";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import {
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
  resolveActiveBillingStatusFlags,
} from "@/lib/billing/active-billing";
import { getEffectiveLimits } from "@/lib/enterprise/limits";
import { getPlanOverride } from "@/lib/enterprise/queries";
import {
  getEntitlementsForPlan,
  MINIMAL_ENTITLEMENTS,
} from "@/lib/entitlements/definitions";
import type { ResolvedEntitlements } from "@/lib/entitlements/types";
import { getDefaultPlanKey } from "@/lib/plans/features";
import { getDevForcePlanOverride } from "@/lib/plans/dev-override";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationSubscription } from "@/types/database";
import type { BillingProvider } from "@/lib/billing/provider-types";

export type EntitlementFallbackPath = "paid_plan" | "minimal_access" | "starter_default";

type ResolveOrganizationEntitlementsOptions = {
  session?: SessionContext;
};

async function loadOrganizationSubscription(
  organizationId: string,
  session?: SessionContext,
): Promise<OrganizationSubscription | null> {
  if (session && session.organization.id === organizationId) {
    return getOrganizationSubscription(session);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select(ORGANIZATION_SUBSCRIPTION_SELECT)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as OrganizationSubscription[];
  const preferredHint = pickSubscriptionProviderHintRow(rows);
  const activeProvider = getOrganizationBillingProvider({
    organizationId,
    subscription: preferredHint,
  });

  return selectPreferredSubscriptionRow(rows, activeProvider);
}

function resolveMappedPlanKey(
  subscription: OrganizationSubscription | null,
  planOverride: Awaited<ReturnType<typeof getPlanOverride>>,
  activeProvider: BillingProvider,
): PlanKey | null {
  let planKey: PlanKey | null = null;

  if (activeProvider === "fastspring") {
    planKey = isFastSpringBackedSubscription(subscription)
      ? safeGetPlanKeyFromSubscriptionPrice({
          billingProvider: "fastspring",
          stripePriceId: null,
          providerPriceId: subscription?.provider_price_id,
        })
      : null;
  } else if (activeProvider === "mollie") {
    planKey = isMollieBackedSubscription(subscription)
      ? safeGetPlanKeyFromSubscriptionPrice({
          billingProvider: "mollie",
          stripePriceId: null,
          providerPriceId: subscription?.provider_price_id,
        })
      : null;
  } else {
    planKey = safeGetPlanKeyFromSubscriptionPrice({
      billingProvider: subscription?.billing_provider,
      stripePriceId: subscription?.stripe_price_id,
      providerPriceId: subscription?.provider_price_id,
    });
  }

  if (subscription && !planKey && (subscription.stripe_price_id || subscription.provider_price_id)) {
    console.warn("[entitlements] Unmapped provider price id", {
      billingProvider: subscription.billing_provider,
      activeProvider,
      maskedPriceId: maskStripePriceId(
        subscription.provider_price_id ?? subscription.stripe_price_id ?? "",
      ),
    });
  }

  const devOverride = getDevForcePlanOverride();
  if (devOverride) {
    return devOverride;
  }

  if (planOverride?.status === "active") {
    return planOverride.plan;
  }

  return planKey;
}

/**
 * Authoritative entitlement resolution for a workspace.
 *
 * Mollie is the sole active billing provider. Paid access requires either:
 * - a usable authoritative Mollie subscription row, or
 * - an active platform-admin plan override / explicit dev force-plan (pilot / enterprise manual).
 * Legacy stripe/paddle/fastspring rows never grant access. organizations.plan is never an entitlement source.
 * Return-page callbacks never activate entitlements.
 * Must stay aligned with resolveEffectivePlanFromSubscriptionRows isPaidAccess rules.
 */
export async function resolveOrganizationEntitlements(
  organizationId: string,
  options?: ResolveOrganizationEntitlementsOptions,
): Promise<ResolvedEntitlements> {
  const [subscription, planOverride] = await Promise.all([
    loadOrganizationSubscription(organizationId, options?.session),
    getPlanOverride(organizationId),
  ]);

  const activeProvider = getOrganizationBillingProvider({
    organizationId,
    subscription,
  });

  const flags = resolveActiveBillingStatusFlags(subscription, activeProvider);
  const status = flags.rawStatus;
  const subscriptionAccess = flags.isUsable;
  const overrideAccess =
    Boolean(getDevForcePlanOverride()) || planOverride?.status === "active";
  const activeAccess = subscriptionAccess || overrideAccess;
  const mappedPlanKey = resolveMappedPlanKey(subscription, planOverride, activeProvider);

  let fallbackPath: EntitlementFallbackPath = "minimal_access";

  if (activeAccess) {
    fallbackPath = mappedPlanKey ? "paid_plan" : "starter_default";
  }

  if (!activeAccess) {
    return {
      planKey: null,
      resolvedPlanKey: mappedPlanKey,
      planLabel: mappedPlanKey
        ? (safeGetPlanByKey(mappedPlanKey)?.name ?? "No active subscription")
        : "No active subscription",
      isPaidAccess: false,
      subscriptionStatus: status,
      fallbackPath,
      ...MINIMAL_ENTITLEMENTS,
    };
  }

  const planKey = mappedPlanKey ?? getDefaultPlanKey();
  const base = getEntitlementsForPlan(planKey);
  const effectiveLimits = getEffectiveLimits(planKey, planOverride);

  return {
    planKey,
    resolvedPlanKey: mappedPlanKey ?? planKey,
    planLabel: safeGetPlanByKey(planKey)?.name ?? "Plan",
    isPaidAccess: true,
    subscriptionStatus: status,
    fallbackPath,
    maxClients: effectiveLimits.maxClients ?? base.maxClients,
    maxSeats: effectiveLimits.seats ?? base.maxSeats,
    maxReportsPerMonth: base.maxReportsPerMonth,
    aiCreditsPerMonth: base.aiCreditsPerMonth,
    features: base.features,
  };
}
