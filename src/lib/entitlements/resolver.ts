import "server-only";

import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  maskStripePriceId,
  safeGetPlanKeyByStripePriceId,
} from "@/lib/billing/plans.server";
import {
  getOrganizationSubscription,
} from "@/lib/billing/queries";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import { isSubscriptionUsable } from "@/lib/billing/status";
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

const SUBSCRIPTION_SELECT =
  "id, organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at";

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
    .select(SUBSCRIPTION_SELECT)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return selectPreferredSubscriptionRow((data ?? []) as OrganizationSubscription[]);
}

function resolveMappedPlanKey(
  subscription: OrganizationSubscription | null,
  planOverride: Awaited<ReturnType<typeof getPlanOverride>>,
): PlanKey | null {
  let planKey: PlanKey | null = null;

  if (subscription?.stripe_price_id) {
    planKey = safeGetPlanKeyByStripePriceId(subscription.stripe_price_id);

    if (!planKey) {
      console.warn("[entitlements] Unmapped stripe_price_id", {
        maskedPriceId: maskStripePriceId(subscription.stripe_price_id),
      });
    }
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

/** Resolve live entitlements from subscription state — never from organizations.plan alone. */
export async function resolveOrganizationEntitlements(
  organizationId: string,
  options?: ResolveOrganizationEntitlementsOptions,
): Promise<ResolvedEntitlements> {
  const [subscription, planOverride] = await Promise.all([
    loadOrganizationSubscription(organizationId, options?.session),
    getPlanOverride(organizationId),
  ]);

  const status = subscription?.status ?? null;
  const activeAccess = isSubscriptionUsable(status);
  const mappedPlanKey = resolveMappedPlanKey(subscription, planOverride);

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
