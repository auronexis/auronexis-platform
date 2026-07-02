import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { getPlanByPriceId, getPlanKeyByPriceId } from "@/lib/billing/plans.server";
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
import { isActiveSubscriptionStatus } from "@/lib/stripe/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

const SUBSCRIPTION_SELECT = "stripe_price_id, status";

/** Resolve the effective plan key for an organization. */
export async function getCurrentPlan(organizationId: string): Promise<PlanKey> {
  const context = await getOrganizationPlanContext(organizationId);
  return context.planKey;
}

/** Alias for effective plan resolution. */
export const getEffectivePlan = getCurrentPlan;

/** Full plan context for an organization — override > Stripe > starter fallback. */
export async function getOrganizationPlanContext(
  organizationId: string,
): Promise<OrganizationPlanContext> {
  const admin = createAdminClient();

  const [{ data, error }, planOverride] = await Promise.all([
    admin
      .from("organization_subscriptions")
      .select(SUBSCRIPTION_SELECT)
      .eq("organization_id", organizationId)
      .maybeSingle(),
    getPlanOverride(organizationId),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const subscription = data as { stripe_price_id: string | null; status: string } | null;
  const subscriptionPriceId = subscription?.stripe_price_id ?? null;
  const subscriptionStatus = subscription?.status ?? null;
  const isActiveSubscription = Boolean(
    subscriptionPriceId && subscriptionStatus && isActiveSubscriptionStatus(subscriptionStatus),
  );

  let basePlanKey: PlanKey = getDefaultPlanKey();
  let planSource: PlanResolutionSource = "starter_fallback";
  let mappedPlanKeyFromPriceId: PlanKey | null = null;

  if (isActiveSubscription && subscriptionPriceId) {
    mappedPlanKeyFromPriceId = getPlanKeyByPriceId(subscriptionPriceId);
    const plan = getPlanByPriceId(subscriptionPriceId);

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
  const plan = getPlanByKey(basePlanKey);

  return {
    organizationId,
    planKey: basePlanKey,
    planLabel: planOverrideActive ? `${plan.name} (Enterprise override)` : plan.name,
    isActiveSubscription,
    features: mergedFeatures,
    planSource,
    devOverrideActive: devOverride !== null,
    planOverrideActive,
    subscriptionPriceId,
    subscriptionStatus,
    mappedPlanKeyFromPriceId,
  };
}

export async function getOrganizationPlanContextForSession(
  session: SessionContext,
): Promise<OrganizationPlanContext> {
  return getOrganizationPlanContext(session.organization.id);
}

/** Count non-archived clients for plan limit enforcement. */
export async function getClientLimitUsage(organizationId: string): Promise<ClientLimitUsage> {
  const admin = createAdminClient();
  const plan = await getOrganizationPlanContext(organizationId);
  const limit = plan.features.max_clients;

  const { count, error } = await admin
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .neq("status", "archived");

  if (error) {
    throw new Error(error.message);
  }

  const used = count ?? 0;

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
  const supabase = await createClient();
  const plan = await getOrganizationPlanContextForSession(session);
  const limit = plan.features.max_clients;

  const { count, error } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .neq("status", "archived");

  if (error) {
    throw new Error(error.message);
  }

  const used = count ?? 0;

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
