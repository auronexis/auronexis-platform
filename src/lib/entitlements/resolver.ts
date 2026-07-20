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
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import {
  isPaddleBackedSubscription,
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

export type EntitlementFallbackPath = "paid_plan" | "minimal_access" | "starter_default";

type ResolveOrganizationEntitlementsOptions = {
  session?: SessionContext;
};

async function loadOrganizationSubscription(
  organizationId: string,
  session?: SessionContext,
): Promise<OrganizationSubscription | null> {
  const activeProvider = getActiveBillingProvider();

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

  return selectPreferredSubscriptionRow(
    (data ?? []) as OrganizationSubscription[],
    activeProvider,
  );
}

function resolveMappedPlanKey(
  subscription: OrganizationSubscription | null,
  planOverride: Awaited<ReturnType<typeof getPlanOverride>>,
  activeProvider: ReturnType<typeof getActiveBillingProvider>,
): PlanKey | null {
  let planKey: PlanKey | null = null;

  if (activeProvider === "paddle") {
    if (!isPaddleBackedSubscription(subscription)) {
      planKey = null;
    } else {
      planKey = safeGetPlanKeyFromSubscriptionPrice({
        billingProvider: "paddle",
        stripePriceId: null,
        providerPriceId: subscription?.provider_price_id,
      });
    }
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

/** Resolve live entitlements from verified active-provider subscription state. */
/**
 * Authoritative entitlement resolution for a workspace.
 *
 * Single source of truth for plan features/limits used by product gates:
 * Paddle subscription row → price → PLAN_ENTITLEMENTS (+ enterprise overrides).
 * Parallel helpers in `src/lib/plans/queries` should defer to this path for access control.
 */
export async function resolveOrganizationEntitlements(
  organizationId: string,
  options?: ResolveOrganizationEntitlementsOptions,
): Promise<ResolvedEntitlements> {
  const activeProvider = getActiveBillingProvider();
  const [subscription, planOverride] = await Promise.all([
    loadOrganizationSubscription(organizationId, options?.session),
    getPlanOverride(organizationId),
  ]);

  const flags = resolveActiveBillingStatusFlags(subscription, activeProvider);
  const status = flags.rawStatus;
  const activeAccess = flags.isUsable;
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
