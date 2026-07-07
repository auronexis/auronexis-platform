import "server-only";

import { getStartOfCurrentMonthUtc } from "@/lib/ai/usage/limits";
import { getBillingStatusLabel } from "@/lib/billing/status";
import {
  ENTITLEMENT_FEATURE_LABELS,
  ENTITLEMENT_LIMIT_LABELS,
  formatEntitlementFeatureLabels,
  getNumericLimit,
  isFeatureEnabled,
  isUnlimited,
} from "@/lib/entitlements/definitions";
import {
  formatFeatureDeniedMessage,
  formatInactiveSubscriptionMessage,
  formatLimitReachedMessage,
} from "@/lib/entitlements/messages";
import { resolveOrganizationEntitlements } from "@/lib/entitlements/resolver";
import type {
  EntitlementCheckResult,
  EntitlementFeatureKey,
  EntitlementLimitKey,
  EntitlementsUsageSummary,
  EntitlementUsageSnapshot,
  PlanEntitlements,
  ResolvedEntitlements,
} from "@/lib/entitlements/types";
import { getClientLimitUsage } from "@/lib/plans/queries";
import { AuthorizationError } from "@/lib/rbac/guards";
import { getOrganizationSeatUsage } from "@/lib/seats/queries";
import { requireSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type { PlanKey } from "@/lib/billing/plans";

export {
  getEntitlementsForPlan,
  getNumericLimit,
  isFeatureEnabled,
  isUnlimited,
} from "@/lib/entitlements/definitions";

type SessionOrOrg = SessionContext | { organizationId: string };

function resolveOrganizationId(input: SessionOrOrg): string {
  return "organizationId" in input ? input.organizationId : input.organization.id;
}

function resolveSession(input: SessionOrOrg): SessionContext | undefined {
  return "organizationId" in input ? undefined : input;
}

async function resolveEntitlements(input: SessionOrOrg): Promise<ResolvedEntitlements> {
  const organizationId = resolveOrganizationId(input);
  return resolveOrganizationEntitlements(organizationId, {
    session: resolveSession(input),
  });
}

async function countReportsThisMonth(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const since = getStartOfCurrentMonthUtc();
  const { count } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .neq("status", "archived");

  return count ?? 0;
}

async function countAiCreditsThisMonth(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const since = getStartOfCurrentMonthUtc();
  const { count } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);

  return count ?? 0;
}

function buildUsageSnapshot(
  key: EntitlementLimitKey,
  used: number,
  limit: number | null,
): EntitlementUsageSnapshot {
  const remaining = limit === null ? null : Math.max(0, limit - used);
  const percentUsed =
    limit === null || limit === 0 ? null : Math.min(100, Math.round((used / limit) * 100));

  return {
    key,
    label: ENTITLEMENT_LIMIT_LABELS[key],
    used,
    limit,
    remaining,
    percentUsed,
    atLimit: limit !== null && used >= limit,
    approachingLimit: limit !== null && limit > 0 && used / limit >= 0.85,
  };
}

async function getLimitUsage(
  organizationId: string,
  entitlements: ResolvedEntitlements,
  limitKey: EntitlementLimitKey,
): Promise<{ used: number; limit: number | null }> {
  const limit = getNumericLimit(entitlements, limitKey);

  switch (limitKey) {
    case "maxClients": {
      const usage = await getClientLimitUsage(organizationId);
      return { used: usage.used, limit };
    }
    case "maxSeats": {
      const usage = await getOrganizationSeatUsage(organizationId);
      return { used: usage.used, limit };
    }
    case "maxReportsPerMonth": {
      const used = await countReportsThisMonth(organizationId);
      return { used, limit };
    }
    case "aiCreditsPerMonth": {
      const used = await countAiCreditsThisMonth(organizationId);
      return { used, limit };
    }
    default: {
      const exhaustive: never = limitKey;
      return exhaustive;
    }
  }
}

function assertPaidAccess(entitlements: ResolvedEntitlements): EntitlementCheckResult {
  if (entitlements.isPaidAccess) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: formatInactiveSubscriptionMessage(),
  };
}

function assertFeature(
  entitlements: ResolvedEntitlements,
  feature: EntitlementFeatureKey,
): EntitlementCheckResult {
  if (isFeatureEnabled(entitlements, feature)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: formatFeatureDeniedMessage(ENTITLEMENT_FEATURE_LABELS[feature]),
  };
}

async function assertLimitHeadroom(
  organizationId: string,
  entitlements: ResolvedEntitlements,
  limitKey: EntitlementLimitKey,
  additional = 1,
): Promise<EntitlementCheckResult> {
  const { used, limit } = await getLimitUsage(organizationId, entitlements, limitKey);

  if (isUnlimited(limit)) {
    return { allowed: true };
  }

  if (used + additional <= limit) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: formatLimitReachedMessage(limitKey),
  };
}

export async function canCreateClient(input: SessionOrOrg): Promise<EntitlementCheckResult> {
  const entitlements = await resolveEntitlements(input);
  const organizationId = resolveOrganizationId(input);

  const paid = assertPaidAccess(entitlements);
  if (!paid.allowed) {
    return paid;
  }

  const feature = assertFeature(entitlements, "clients");
  if (!feature.allowed) {
    const basic = assertFeature(entitlements, "clients_basic");
    if (!basic.allowed) {
      return feature;
    }
  }

  return assertLimitHeadroom(organizationId, entitlements, "maxClients");
}

export async function canInviteSeat(input: SessionOrOrg): Promise<EntitlementCheckResult> {
  const entitlements = await resolveEntitlements(input);
  const organizationId = resolveOrganizationId(input);

  const paid = assertPaidAccess(entitlements);
  if (!paid.allowed) {
    return paid;
  }

  return assertLimitHeadroom(organizationId, entitlements, "maxSeats");
}

export async function canGenerateReport(input: SessionOrOrg): Promise<EntitlementCheckResult> {
  const entitlements = await resolveEntitlements(input);
  const organizationId = resolveOrganizationId(input);

  const paid = assertPaidAccess(entitlements);
  if (!paid.allowed) {
    return paid;
  }

  const feature = assertFeature(entitlements, "reports");
  if (!feature.allowed) {
    return feature;
  }

  return assertLimitHeadroom(organizationId, entitlements, "maxReportsPerMonth");
}

export async function requireFeatureAccess(
  feature: EntitlementFeatureKey,
  session?: SessionContext,
): Promise<void> {
  const activeSession = session ?? (await requireSession());
  const entitlements = await resolveOrganizationEntitlements(activeSession.organization.id, {
    session: activeSession,
  });
  const check = assertFeature(entitlements, feature);

  if (!check.allowed) {
    throw new AuthorizationError(check.message);
  }
}

export async function requireLimitAvailable(
  limitKey: EntitlementLimitKey,
  session?: SessionContext,
): Promise<void> {
  const activeSession = session ?? (await requireSession());
  const organizationId = activeSession.organization.id;
  const entitlements = await resolveOrganizationEntitlements(organizationId, {
    session: activeSession,
  });

  const paid = assertPaidAccess(entitlements);
  if (!paid.allowed) {
    throw new AuthorizationError(paid.message);
  }

  const check = await assertLimitHeadroom(organizationId, entitlements, limitKey);
  if (!check.allowed) {
    throw new AuthorizationError(check.message);
  }
}

export async function requirePaidEntitlementAccess(session?: SessionContext): Promise<ResolvedEntitlements> {
  const activeSession = session ?? (await requireSession());
  const entitlements = await resolveOrganizationEntitlements(activeSession.organization.id, {
    session: activeSession,
  });
  const paid = assertPaidAccess(entitlements);

  if (!paid.allowed) {
    throw new AuthorizationError(paid.message);
  }

  return entitlements;
}

export async function getEntitlementsUsageSummary(
  session: SessionContext,
): Promise<EntitlementsUsageSummary> {
  const entitlements = await resolveOrganizationEntitlements(session.organization.id, { session });
  const organizationId = session.organization.id;

  const [clients, seats, reports, aiCredits] = await Promise.all([
    getLimitUsage(organizationId, entitlements, "maxClients"),
    getLimitUsage(organizationId, entitlements, "maxSeats"),
    getLimitUsage(organizationId, entitlements, "maxReportsPerMonth"),
    getLimitUsage(organizationId, entitlements, "aiCreditsPerMonth"),
  ]);

  const usage: EntitlementUsageSnapshot[] = [
    buildUsageSnapshot("maxClients", clients.used, clients.limit),
    buildUsageSnapshot("maxSeats", seats.used, seats.limit),
    buildUsageSnapshot("maxReportsPerMonth", reports.used, reports.limit),
    buildUsageSnapshot("aiCreditsPerMonth", aiCredits.used, aiCredits.limit),
  ];

  const featureLabels = formatEntitlementFeatureLabels(entitlements.features);
  const hasLimitWarning = usage.some((item) => item.atLimit || item.approachingLimit);

  return {
    entitlements: {
      ...entitlements,
      planLabel: entitlements.isPaidAccess
        ? entitlements.planLabel
        : entitlements.resolvedPlanKey
          ? `${entitlements.planLabel} · ${getBillingStatusLabel(entitlements.subscriptionStatus)}`
          : getBillingStatusLabel(entitlements.subscriptionStatus),
    },
    usage,
    featureLabels,
    hasLimitWarning,
    upgradeHref: "/settings/plans",
  };
}

export async function resolveEntitlementsForOrganization(
  organizationId: string,
  session?: SessionContext,
): Promise<ResolvedEntitlements> {
  return resolveOrganizationEntitlements(organizationId, { session });
}

export type { PlanEntitlements, ResolvedEntitlements, PlanKey };
