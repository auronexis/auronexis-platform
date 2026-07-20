import { cache } from "react";
import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  getPlanByPriceId,
  safeGetPlanKeyFromSubscriptionPrice,
} from "@/lib/billing/plans.server";
import { selectPreferredSubscriptionSummaryRow } from "@/lib/billing/subscription-selection";
import { applyPlanOverride } from "@/lib/enterprise/limits";
import { getPlanOverride } from "@/lib/enterprise/queries";
import { getDefaultPlanKey,
  getEnabledModuleLabels,
} from "@/lib/plans/features";
import { getDevForcePlanOverride } from "@/lib/plans/dev-override";
import type {
  ClientLimitUsage,
  OrganizationPlanContext,
  OrganizationPlanUsageSummary,
  PlanResolutionSource,
} from "@/lib/plans/types";
import { isSubscriptionUsable } from "@/lib/billing/status";
import { countActiveClients } from "@/lib/clients/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";

const SUBSCRIPTION_SELECT =
  "stripe_price_id, provider_price_id, provider_subscription_id, billing_provider, status, updated_at";

/** Resolve the effective plan key for an organization. */
export async function getCurrentPlan(organizationId: string): Promise<PlanKey> {
  const context = await getOrganizationPlanContext(organizationId);
  return context.planKey;
}

/** Alias for effective plan resolution. */
export const getEffectivePlan = getCurrentPlan;

/** Full plan context for an organization — override > Stripe/Paddle > starter fallback. */
export const getOrganizationPlanContext = cache(async function getOrganizationPlanContext(
  organizationId: string,
): Promise<OrganizationPlanContext> {
  const admin = createAdminClient();

  const [{ data, error }, planOverride] = await Promise.all([
    admin
      .from("organization_subscriptions")
      .select(SUBSCRIPTION_SELECT)
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false }),
    getPlanOverride(organizationId),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const subscription = selectPreferredSubscriptionSummaryRow(
    (data ?? []) as Array<{
      stripe_price_id: string | null;
      provider_price_id: string | null;
      provider_subscription_id: string | null;
      billing_provider: string | null;
      status: string;
      updated_at?: string;
    }>,
  );
  const billingProvider = subscription?.billing_provider ?? "paddle";
  const subscriptionPriceId =
    billingProvider === "paddle"
      ? (subscription?.provider_price_id ?? null)
      : (subscription?.stripe_price_id ?? subscription?.provider_price_id ?? null);
  const subscriptionStatus = subscription?.status ?? null;
  // Align with entitlements: only active/trialing grant paid plan features.
  const isActiveSubscription = Boolean(
    subscriptionPriceId && subscriptionStatus && isSubscriptionUsable(subscriptionStatus),
  );

  let basePlanKey: PlanKey = getDefaultPlanKey();
  let planSource: PlanResolutionSource = "starter_fallback";
  let mappedPlanKeyFromPriceId: PlanKey | null = null;

  if (isActiveSubscription && subscriptionPriceId) {
    mappedPlanKeyFromPriceId = safeGetPlanKeyFromSubscriptionPrice({
      billingProvider,
      stripePriceId: subscription?.stripe_price_id,
      providerPriceId: subscription?.provider_price_id ?? subscriptionPriceId,
    });
    const plan = mappedPlanKeyFromPriceId
      ? safeGetPlanByKey(mappedPlanKeyFromPriceId)
      : billingProvider === "paddle"
        ? null
        : getPlanByPriceId(subscriptionPriceId);

    if (plan) {
      basePlanKey = plan.key;
      planSource = "active_subscription";
    } else {
      planSource = "unmapped_price_id";
    }
  }

  const devOverride = getDevForcePlanOverride();
  let planOverrideActive = false;

  if (devOverride) {
    basePlanKey = devOverride;
    planSource = "dev_override";
  } else if (planOverride?.status === "active") {
    basePlanKey = planOverride.plan;
    planSource = "plan_override";
    planOverrideActive = true;
  }

  const mergedFeatures = applyPlanOverride(basePlanKey, planOverride);
  const plan = safeGetPlanByKey(basePlanKey) ?? safeGetPlanByKey(getDefaultPlanKey());

  return {
    organizationId,
    planKey: basePlanKey,
    planLabel: planOverrideActive
      ? `${plan?.name ?? "Plan"} (Enterprise override)`
      : (plan?.name ?? "Plan"),
    isActiveSubscription,
    features: mergedFeatures,
    planSource,
    devOverrideActive: devOverride !== null,
    planOverrideActive,
    subscriptionPriceId,
    subscriptionStatus,
    mappedPlanKeyFromPriceId,
  };
});

export async function getOrganizationPlanContextForSession(
  session: SessionContext,
): Promise<OrganizationPlanContext> {
  return getOrganizationPlanContext(session.organization.id);
}

/** Count non-archived clients for plan limit enforcement. */
export async function getClientLimitUsage(organizationId: string): Promise<ClientLimitUsage> {
  const plan = await getOrganizationPlanContext(organizationId);
  const limit = plan.features.max_clients;
  const used = await countActiveClients(organizationId);

  return {
    used,
    limit,
    isAtLimit: limit !== null && used >= limit,
    isOverLimit: limit !== null && used > limit,
  };
}

export async function getClientLimitUsageForSession(
  session: SessionContext,
): Promise<ClientLimitUsage> {
  const plan = await getOrganizationPlanContextForSession(session);
  const limit = plan.features.max_clients;
  const used = await countActiveClients(session.organization.id, { useUserClient: true });

  return {
    used,
    limit,
    isAtLimit: limit !== null && used >= limit,
    isOverLimit: limit !== null && used > limit,
  };
}

/** Billing usage summary for Settings → Billing. */
export async function getOrganizationPlanUsageSummary(
  session: SessionContext,
  seatUsed: number,
  seatLimit: number,
): Promise<OrganizationPlanUsageSummary> {
  const [plan, clients] = await Promise.all([
    getOrganizationPlanContextForSession(session),
    getClientLimitUsageForSession(session),
  ]);

  const seatOver = seatUsed > seatLimit;
  const hasUsageOverPlan = clients.isOverLimit || seatOver;

  return {
    plan,
    clients,
    enabledModules: getEnabledModuleLabels(plan.features),
    hasUsageOverPlan,
  };
}
