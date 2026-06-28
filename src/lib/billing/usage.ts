import "server-only";

import { getStartOfCurrentMonthUtc } from "@/lib/ai/usage/limits";
import {
  aggregateBillingUsageEvents,
  getBillingPeriodBounds,
  getPreviousBillingPeriodBounds,
  getSuggestedUpgradePlan,
  getUsageLimit,
} from "@/lib/billing/metering";
import {
  getCachedUsageDashboard,
  getCachedUsageSummary,
  setCachedUsageDashboard,
  setCachedUsageSummary,
} from "@/lib/billing/cache";
import type {
  UsageDashboardData,
  UsageForecast,
  UsageMetricKey,
  UsageMetricSnapshot,
  UsagePeriodSummary,
} from "@/lib/billing/types";
import { USAGE_METRIC_LABELS } from "@/lib/billing/types";
import { getOrganizationPlanContext } from "@/lib/plans/queries";
import { projectLinearForecast, percentChange } from "@/lib/predictive/forecasting";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";

const METRIC_KEYS: UsageMetricKey[] = [
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

function buildMetricSnapshot(
  key: UsageMetricKey,
  used: number,
  limit: number | null,
): UsageMetricSnapshot {
  const remaining = limit === null ? null : Math.max(0, limit - used);
  const percentUsed = limit === null || limit === 0 ? null : Math.min(100, Math.round((used / limit) * 100));

  return {
    key,
    label: USAGE_METRIC_LABELS[key],
    used,
    limit,
    remaining,
    unit: key === "storage_mb" ? "MB" : key === "ai_tokens" ? "tokens" : "count",
    percentUsed,
    atLimit: limit !== null && used >= limit,
    approachingLimit: limit !== null && limit > 0 && used / limit >= 0.85,
  };
}

async function countAiGenerations(organizationId: string, since: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  return count ?? 0;
}

async function sumAiTokens(organizationId: string, since: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("ai_usage_events")
    .select("total_tokens")
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  return ((data ?? []) as Array<{ total_tokens: number | null }>).reduce(
    (sum, row) => sum + (row.total_tokens ?? 0),
    0,
  );
}

async function countApiRequests(organizationId: string, since: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("api_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  return count ?? 0;
}

async function countAutomationExecutions(organizationId: string, since: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("automation_executions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("started_at", since);
  return count ?? 0;
}

async function countConnectorSyncs(organizationId: string, since: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("integration_sync_jobs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);
  return count ?? 0;
}

async function countReports(organizationId: string, since: string, publishedOnly: boolean): Promise<number> {
  const admin = createAdminClient();
  let query = admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);

  if (publishedOnly) {
    query = query.in("status", ["published", "sent"]);
  }

  const { count } = await query;
  return count ?? 0;
}

async function countActiveUsers(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_disabled", false);
  return count ?? 0;
}

async function countActiveClients(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .neq("status", "archived");
  return count ?? 0;
}

async function countPortalUsers(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("client_portal_users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_active", true);
  return count ?? 0;
}

async function countEmailSends(organizationId: string, since: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("report_email_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "sent")
    .gte("created_at", since);
  return count ?? 0;
}

async function estimateStorageMb(organizationId: string): Promise<number> {
  const eventTotals = await aggregateBillingUsageEvents(
    organizationId,
    getBillingPeriodBounds().periodStart,
    getBillingPeriodBounds().periodEnd,
  );
  return Math.round(eventTotals.storage_mb ?? 0);
}

async function collectUsageCounts(
  organizationId: string,
  periodStart: string,
): Promise<Record<UsageMetricKey, number>> {
  const [eventTotals, aiGenerations, aiTokens, apiRequests, automations, syncs, reportsGenerated, reportsPublished, users, clients, portalUsers, emails, storage] =
    await Promise.all([
      aggregateBillingUsageEvents(
        organizationId,
        periodStart,
        getBillingPeriodBounds(new Date(periodStart)).periodEnd,
      ),
      countAiGenerations(organizationId, periodStart),
      sumAiTokens(organizationId, periodStart),
      countApiRequests(organizationId, periodStart),
      countAutomationExecutions(organizationId, periodStart),
      countConnectorSyncs(organizationId, periodStart),
      countReports(organizationId, periodStart, false),
      countReports(organizationId, periodStart, true),
      countActiveUsers(organizationId),
      countActiveClients(organizationId),
      countPortalUsers(organizationId),
      countEmailSends(organizationId, periodStart),
      estimateStorageMb(organizationId),
    ]);

  return {
    ai_generations: Math.max(aiGenerations, eventTotals.ai_generations ?? 0),
    ai_tokens: Math.max(aiTokens, eventTotals.ai_tokens ?? 0),
    api_requests: Math.max(apiRequests, eventTotals.api_requests ?? 0),
    automation_executions: Math.max(automations, eventTotals.automation_executions ?? 0),
    connector_syncs: Math.max(syncs, eventTotals.connector_syncs ?? 0),
    workflow_executions: Math.max(automations, eventTotals.workflow_executions ?? 0),
    reports_generated: Math.max(reportsGenerated, eventTotals.reports_generated ?? 0),
    reports_published: Math.max(reportsPublished, eventTotals.reports_published ?? 0),
    storage_mb: Math.max(storage, eventTotals.storage_mb ?? 0),
    active_users: users,
    active_clients: clients,
    portal_users: portalUsers,
    email_sends: Math.max(emails, eventTotals.email_sends ?? 0),
  };
}

export async function getUsagePeriodSummary(
  organizationId: string,
  planKey: Awaited<ReturnType<typeof getOrganizationPlanContext>>["planKey"],
  bounds: { periodStart: string; periodEnd: string },
): Promise<UsagePeriodSummary> {
  const counts = await collectUsageCounts(organizationId, bounds.periodStart);
  const metrics = METRIC_KEYS.map((key) =>
    buildMetricSnapshot(key, counts[key], getUsageLimit(planKey, key)),
  );

  return {
    periodStart: bounds.periodStart,
    periodEnd: bounds.periodEnd,
    metrics,
  };
}

function buildForecasts(
  planKey: Awaited<ReturnType<typeof getOrganizationPlanContext>>["planKey"],
  current: UsagePeriodSummary,
  previous: UsagePeriodSummary,
): UsageForecast[] {
  const now = new Date();
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const dayOfMonth = now.getUTCDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

  return current.metrics
    .filter((metric) => metric.limit !== null)
    .map((metric) => {
      const previousMetric = previous.metrics.find((item) => item.key === metric.key);
      const changePercent = percentChange(metric.used, previousMetric?.used ?? 0);
      const projectedUsage = projectLinearForecast(metric.used, changePercent);
      const limit = metric.limit ?? 0;
      const likelyOverage = projectedUsage > limit;

      return {
        metric: metric.key,
        label: metric.label,
        projectedUsage,
        limit: metric.limit,
        daysRemaining,
        likelyOverage,
        suggestedUpgrade: likelyOverage ? getSuggestedUpgradePlan(planKey, metric.key) : null,
      };
    });
}

export async function getUsageDashboardData(session: SessionContext): Promise<UsageDashboardData> {
  const cached = getCachedUsageDashboard(session.organization.id);
  if (cached) {
    return cached;
  }

  const plan = await getOrganizationPlanContext(session.organization.id);
  const currentBounds = getBillingPeriodBounds();
  const previousBounds = getPreviousBillingPeriodBounds();

  const [current, previous] = await Promise.all([
    getUsagePeriodSummary(session.organization.id, plan.planKey, currentBounds),
    getUsagePeriodSummary(session.organization.id, plan.planKey, previousBounds),
  ]);

  const trends = current.metrics.map((metric) => {
    const previousMetric = previous.metrics.find((item) => item.key === metric.key);
    const changePercent = percentChange(metric.used, previousMetric?.used ?? 0);
    return {
      key: metric.key,
      label: metric.label,
      current: metric.used,
      previous: previousMetric?.used ?? 0,
      changePercent,
      projectedEndOfMonth: projectLinearForecast(metric.used, changePercent),
    };
  });

  const dashboard: UsageDashboardData = {
    current,
    previous,
    trends,
    forecasts: buildForecasts(plan.planKey, current, previous),
  };

  setCachedUsageDashboard(session.organization.id, dashboard);
  setCachedUsageSummary(session.organization.id, current);
  return dashboard;
}

export async function getCurrentUsageSummary(session: SessionContext): Promise<UsagePeriodSummary> {
  const cached = getCachedUsageSummary(session.organization.id);
  if (cached) {
    return cached;
  }

  const plan = await getOrganizationPlanContext(session.organization.id);
  const summary = await getUsagePeriodSummary(
    session.organization.id,
    plan.planKey,
    getBillingPeriodBounds(),
  );
  setCachedUsageSummary(session.organization.id, summary);
  return summary;
}

export { getStartOfCurrentMonthUtc };
