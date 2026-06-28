import { recordActivityEvent } from "@/lib/activity/record";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import {
  getFeatureUpgradeMessage,
  getMinimumPlanForFeature,
  getRequiredPlanLabel,
  isFeatureEnabled,
  planMeetsMinimum,
} from "@/lib/plans/features";
import {
  getClientLimitUsage,
  getCurrentPlan,
  getOrganizationPlanContext,
  getOrganizationPlanContextForSession,
} from "@/lib/plans/queries";
import type {
  PlanFeatureCheckResult,
  PlanFeatureKey,
  PlanLimitCheckResult,
} from "@/lib/plans/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";

const PLAN_LIMIT_ACTIVITY_COOLDOWN_MS = 60 * 60 * 1000;
const PLAN_LIMIT_NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function buildClientLimitMessage(limit: number): string {
  return `Your plan allows up to ${limit} client${limit === 1 ? "" : "s"}. Upgrade to add more.`;
}

async function hasRecentPlanLimitActivity(organizationId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - PLAN_LIMIT_ACTIVITY_COOLDOWN_MS).toISOString();

  const { count, error } = await admin
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("action", "plan_limit_reached")
    .gte("created_at", since);

  if (error) {
    console.error("[plans] activity lookup failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function hasRecentPlanLimitNotification(organizationId: string): Promise<boolean> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - PLAN_LIMIT_NOTIFICATION_COOLDOWN_MS).toISOString();

  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("type", "plan_limit_reached")
    .gte("created_at", since);

  if (error) {
    console.error("[plans] notification lookup failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function recordPlanLimitReachedSideEffects(
  organizationId: string,
  actorUserId: string | null,
  reason: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const shouldRecordActivity = !(await hasRecentPlanLimitActivity(organizationId));

  if (shouldRecordActivity) {
    await recordActivityEvent({
      organizationId,
      actorUserId,
      entityType: "organization",
      entityId: null,
      action: "plan_limit_reached",
      title: "Plan limit reached",
      description: reason,
      metadata: { ...metadata, automated: true },
    });
  }

  const shouldNotify = !(await hasRecentPlanLimitNotification(organizationId));

  if (shouldNotify) {
    await createNotificationForOwnersAndAdmins(organizationId, {
      type: "plan_limit_reached",
      title: "Plan limit reached",
      message: "Plan limit reached. Upgrade to continue.",
      entityType: "organization",
      entityId: null,
    });
  }
}

/** Whether an organization plan includes a feature. */
export async function canUseFeature(
  organizationId: string,
  feature: PlanFeatureKey,
): Promise<boolean> {
  const planKey = await getCurrentPlan(organizationId);
  return isFeatureEnabled(planKey, feature);
}

/** Check feature access with upgrade messaging. */
export async function checkPlanFeature(
  organizationId: string,
  feature: PlanFeatureKey,
): Promise<PlanFeatureCheckResult> {
  const planKey = await getCurrentPlan(organizationId);
  const requiredPlan = getMinimumPlanForFeature(feature);

  if (planMeetsMinimum(planKey, requiredPlan) && isFeatureEnabled(planKey, feature)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: getFeatureUpgradeMessage(feature),
    requiredPlan,
    requiredPlanLabel: getRequiredPlanLabel(feature),
  };
}

export async function checkPlanFeatureForSession(
  session: SessionContext,
  feature: PlanFeatureKey,
): Promise<PlanFeatureCheckResult> {
  return checkPlanFeature(session.organization.id, feature);
}

/** Assert feature access — for server actions. */
export async function requireFeature(
  organizationId: string,
  feature: PlanFeatureKey,
): Promise<PlanFeatureCheckResult> {
  return checkPlanFeature(organizationId, feature);
}

/** Throw when a plan feature is unavailable — server mutations. */
export async function assertCanUseFeature(
  organizationId: string,
  feature: PlanFeatureKey,
): Promise<void> {
  const check = await requireFeature(organizationId, feature);

  if (!check.allowed) {
    const { AuthorizationError } = await import("@/lib/rbac/guards");
    throw new AuthorizationError(check.message);
  }
}

/** Whether the organization can create another non-archived client. */
export async function canCreateClient(organizationId: string): Promise<boolean> {
  const usage = await getClientLimitUsage(organizationId);
  return usage.limit === null || usage.used < usage.limit;
}

/** Assert client creation is allowed — records activity/notification when blocked. */
export async function assertCanCreateClient(
  organizationId: string,
  actorUserId: string | null,
): Promise<PlanLimitCheckResult> {
  const [usage, plan] = await Promise.all([
    getClientLimitUsage(organizationId),
    getOrganizationPlanContext(organizationId),
  ]);

  if (usage.limit === null || usage.used < usage.limit) {
    return { allowed: true };
  }

  const message = buildClientLimitMessage(usage.limit);

  await recordPlanLimitReachedSideEffects(organizationId, actorUserId, message, {
    limitType: "max_clients",
    limit: usage.limit,
    used: usage.used,
    planKey: plan.planKey,
  });

  return { allowed: false, message };
}

export async function getClientCreateCheckForSession(
  session: SessionContext,
): Promise<PlanLimitCheckResult> {
  const usage = await getClientLimitUsage(session.organization.id);

  if (usage.limit === null || usage.used < usage.limit) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: buildClientLimitMessage(usage.limit),
  };
}

/** Load plan features for navigation filtering. */
export async function getPlanFeaturesForSession(session: SessionContext) {
  const context = await getOrganizationPlanContextForSession(session);
  return context.features;
}
