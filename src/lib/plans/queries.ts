import { cache } from "react";
import type { PlanKey } from "@/lib/billing/plans";
import { applyPlanOverride } from "@/lib/enterprise/limits";
import { getPlanOverride } from "@/lib/enterprise/queries";
import { getEnabledModuleLabels } from "@/lib/plans/features";
import {
  resolveEffectivePlanFromSubscriptionRows,
  type EffectivePlanSubscriptionRow,
} from "@/lib/plans/effective-plan";
import type {
  ClientLimitUsage,
  OrganizationPlanContext,
  OrganizationPlanUsageSummary,
} from "@/lib/plans/types";
import { countActiveClients } from "@/lib/clients/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";

const SUBSCRIPTION_SELECT =
  "stripe_price_id, provider_price_id, provider_subscription_id, billing_provider, provider_status, status, cancel_at_period_end, current_period_end, sync_pending, updated_at";

/** Resolve the effective plan key for an organization. */
export async function getCurrentPlan(organizationId: string): Promise<PlanKey> {
  const context = await getOrganizationPlanContext(organizationId);
  return context.planKey;
}

/** Alias for effective plan resolution. */
export const getEffectivePlan = getCurrentPlan;

/**
 * Full plan context for an organization.
 * Canonical path: Mollie (or historical ownership) subscription row -> mapped plan.
 * Never uses organizations.plan as an entitlement source. Fail closed to starter.
 */
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

  const rows = (data ?? []) as EffectivePlanSubscriptionRow[];
  const resolved = resolveEffectivePlanFromSubscriptionRows({
    organizationId,
    rows,
    planOverride: planOverride
      ? { status: planOverride.status, plan: planOverride.plan }
      : null,
  });

  const mergedFeatures = applyPlanOverride(resolved.planKey, planOverride);

  return {
    organizationId,
    planKey: resolved.planKey,
    planLabel: resolved.planLabel,
    isActiveSubscription: resolved.isActiveSubscription,
    features: mergedFeatures,
    planSource: resolved.planSource,
    devOverrideActive: resolved.devOverrideActive,
    planOverrideActive: resolved.planOverrideActive,
    subscriptionPriceId: resolved.subscriptionPriceId,
    subscriptionStatus: resolved.subscriptionStatus,
    mappedPlanKeyFromPriceId: resolved.mappedPlanKeyFromPriceId,
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

/** Billing usage summary for Settings -> Billing. */
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
