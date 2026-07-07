import "server-only";

import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { getPlanByPriceId } from "@/lib/billing/plans.server";
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

/** Resolve live entitlements from subscription state — never from organizations.plan alone. */
export async function resolveOrganizationEntitlements(
  organizationId: string,
): Promise<ResolvedEntitlements> {
  const admin = createAdminClient();

  const [{ data, error }, planOverride] = await Promise.all([
    admin
      .from("organization_subscriptions")
      .select("stripe_price_id, status")
      .eq("organization_id", organizationId)
      .maybeSingle(),
    getPlanOverride(organizationId),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const subscription = data as { stripe_price_id: string | null; status: string | null } | null;
  const subscriptionStatus = subscription?.status ?? null;
  const isPaidAccess = isSubscriptionUsable(subscriptionStatus);

  if (!isPaidAccess) {
    return {
      planKey: null,
      planLabel: "No active subscription",
      isPaidAccess: false,
      subscriptionStatus,
      ...MINIMAL_ENTITLEMENTS,
    };
  }

  let planKey: PlanKey = getDefaultPlanKey();

  if (subscription?.stripe_price_id) {
    const mapped = getPlanByPriceId(subscription.stripe_price_id);
    if (mapped) {
      planKey = mapped.key;
    }
  }

  const devOverride = getDevForcePlanOverride();
  if (devOverride) {
    planKey = devOverride;
  } else if (planOverride?.status === "active") {
    planKey = planOverride.plan;
  }

  const base = getEntitlementsForPlan(planKey);
  const effectiveLimits = getEffectiveLimits(planKey, planOverride);

  return {
    planKey,
    planLabel: getPlanByKey(planKey).name,
    isPaidAccess: true,
    subscriptionStatus,
    maxClients: effectiveLimits.maxClients ?? base.maxClients,
    maxSeats: effectiveLimits.seats ?? base.maxSeats,
    maxReportsPerMonth: base.maxReportsPerMonth,
    aiCreditsPerMonth: base.aiCreditsPerMonth,
    features: base.features,
  };
}
