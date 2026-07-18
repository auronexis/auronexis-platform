import "server-only";

export {
  assertCanCreateClient,
  assertCanUseFeature,
  canCreateClient,
  canUseFeature,
  checkPlanFeature,
  checkPlanFeatureForSession,
  requireFeature,
} from "@/lib/plans/guards";

export { assertCanInviteTeamMember } from "@/lib/seats/guards";
export { assertWithinAIUsageLimit } from "@/lib/ai/usage/queries";
export { assertAutomationLimit } from "@/lib/automation/builder/limits";

import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { getCurrentPlan } from "@/lib/plans/queries";
import type { PlanKey } from "@/lib/billing/plans";
import {
  getSuggestedUpgradePlan,
  getUsageLimit,
} from "@/lib/billing/metering";
import type { UsageMetricKey } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";

const APPROACHING_THRESHOLD = 0.85;
const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type UsageLimitCheckResult =
  | { allowed: true; used: number; limit: number | null; remaining: number | null }
  | { allowed: false; used: number; limit: number; remaining: 0; message: string };

export async function checkUsageLimit(
  organizationId: string,
  metric: UsageMetricKey,
  used: number,
): Promise<UsageLimitCheckResult> {
  const planKey = await getCurrentPlan(organizationId);
  const limit = getUsageLimit(planKey, metric);

  if (limit === null) {
    return { allowed: true, used, limit: null, remaining: null };
  }

  if (used < limit) {
    return { allowed: true, used, limit, remaining: limit - used };
  }

  return {
    allowed: false,
    used,
    limit,
    remaining: 0,
    message: `Your plan limit for ${metric.replace(/_/g, " ")} has been reached. Upgrade to continue.`,
  };
}

export async function assertUsageWithinLimit(
  organizationId: string,
  metric: UsageMetricKey,
  used: number,
  actorUserId: string | null = null,
): Promise<void> {
  const check = await checkUsageLimit(organizationId, metric, used);
  if (check.allowed) {
    await maybeNotifyApproachingLimit(organizationId, metric, check.used, check.limit);
    return;
  }

  await recordLimitReachedSideEffects(organizationId, metric, check.limit, check.used, actorUserId);

  const { AuthorizationError } = await import("@/lib/rbac/guards");
  throw new AuthorizationError(check.message);
}

async function hasRecentBillingNotification(
  organizationId: string,
  type: "billing_limit_approaching" | "billing_limit_reached",
): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - NOTIFICATION_COOLDOWN_MS).toISOString();
  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("type", type)
    .gte("created_at", since);

  if (error) {
    return true;
  }
  return (count ?? 0) > 0;
}

async function maybeNotifyApproachingLimit(
  organizationId: string,
  metric: UsageMetricKey,
  used: number,
  limit: number | null,
): Promise<void> {
  if (limit === null || limit === 0) {
    return;
  }

  const ratio = used / limit;
  if (ratio < APPROACHING_THRESHOLD) {
    return;
  }

  if (await hasRecentBillingNotification(organizationId, "billing_limit_approaching")) {
    return;
  }

  const planKey = await getCurrentPlan(organizationId);
  const upgrade = getSuggestedUpgradePlan(planKey, metric);

  await createNotificationForOwnersAndAdmins(organizationId, {
    type: "billing_limit_approaching",
    title: "Usage limit approaching",
    message: `You have used ${used} of ${limit} ${metric.replace(/_/g, " ")} this month.${
      upgrade ? ` Consider upgrading to ${upgrade}.` : ""
    }`,
    entityType: "organization",
    entityId: organizationId,
  });
}

async function recordLimitReachedSideEffects(
  organizationId: string,
  metric: UsageMetricKey,
  limit: number,
  used: number,
  _actorUserId: string | null,
): Promise<void> {
  if (await hasRecentBillingNotification(organizationId, "billing_limit_reached")) {
    return;
  }

  await createNotificationForOwnersAndAdmins(organizationId, {
    type: "billing_limit_reached",
    title: "Usage limit reached",
    message: `Monthly limit reached for ${metric.replace(/_/g, " ")} (${used}/${limit}). Upgrade to continue.`,
    entityType: "organization",
    entityId: organizationId,
  });
}

export async function getPlanLimitsForOrganization(
  organizationId: string,
): Promise<Array<{ metric: UsageMetricKey; limit: number | null }>> {
  const planKey = await getCurrentPlan(organizationId);
  const metrics: UsageMetricKey[] = [
    "ai_generations",
    "ai_tokens",
    "api_requests",
    "automation_executions",
    "connector_syncs",
    "workflow_executions",
    "reports_generated",
    "reports_published",
    "storage_mb",
    "active_users",
    "active_clients",
    "portal_users",
    "email_sends",
  ];

  return metrics.map((metric) => ({
    metric,
    limit: getUsageLimit(planKey, metric),
  }));
}

export function getMinimumPlanForLimitIncrease(
  currentPlan: PlanKey,
  targetMetric: UsageMetricKey,
): PlanKey | null {
  return getSuggestedUpgradePlan(currentPlan, targetMetric);
}
