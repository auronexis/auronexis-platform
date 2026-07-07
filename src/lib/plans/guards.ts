import { recordActivityEvent } from "@/lib/activity/record";
import { createNotificationForOwnersAndAdmins } from "@/lib/notifications/create";
import { canCreateClient as canCreateClientEntitlement } from "@/lib/entitlements/checks";
import {
  getFeatureUpgradeMessage,
  getMinimumPlanForFeature,
  getRequiredPlanLabel,
} from "@/lib/plans/features";
import {
  getClientLimitUsage,
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
  const context = await getOrganizationPlanContext(organizationId);
  const value = context.features[feature];
  return typeof value === "boolean" ? value : Boolean(value);
}

/** Check feature access with upgrade messaging. */
export async function checkPlanFeature(
  organizationId: string,
  feature: PlanFeatureKey,
): Promise<PlanFeatureCheckResult> {
  const context = await getOrganizationPlanContext(organizationId);
  const requiredPlan = getMinimumPlanForFeature(feature);
  const value = context.features[feature];
  const enabled = typeof value === "boolean" ? value : Boolean(value);

  if (enabled) {
    return { allowed: true };
  }

  if (context.planOverrideActive && (feature === "future_api_webhooks" || feature === "priority_support")) {
    return {
      allowed: false,
      message: "Contact your account manager to enable this Enterprise capability.",
      requiredPlan,
      requiredPlanLabel: getRequiredPlanLabel(feature),
    };
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
  const check = await canCreateClientEntitlement({ organizationId });
  return check.allowed;
}

/** Assert client creation is allowed — records activity/notification when blocked. */
export async function assertCanCreateClient(
  organizationId: string,
  actorUserId: string | null,
): Promise<PlanLimitCheckResult> {
  const check = await canCreateClientEntitlement({ organizationId });

  if (check.allowed) {
    return { allowed: true };
  }

  const [usage, plan] = await Promise.all([
    getClientLimitUsage(organizationId),
    getOrganizationPlanContext(organizationId),
  ]);

  await recordPlanLimitReachedSideEffects(organizationId, actorUserId, check.message, {
    limitType: "max_clients",
    limit: usage.limit,
    used: usage.used,
    planKey: plan.planKey,
  });

  return { allowed: false, message: check.message };
}

export async function getClientCreateCheckForSession(
  session: SessionContext,
): Promise<PlanLimitCheckResult> {
  const check = await canCreateClientEntitlement(session);
  return check.allowed ? { allowed: true } : { allowed: false, message: check.message };
}

/** Load plan features for navigation filtering. */
export async function getPlanFeaturesForSession(session: SessionContext) {
  const context = await getOrganizationPlanContextForSession(session);
  return context.features;
}
