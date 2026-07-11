import "server-only";

import { cache } from "react";
import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import type { DashboardData } from "@/lib/dashboard/types";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { LEGACY_OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

export type PeriodRange = {
  start: string;
  end: string;
  label: string;
};

export type ClientOperationalMetrics = {
  clientId: string;
  clientName: string;
  profitability: ClientProfitabilityRow;
  openIncidents: number;
  openRisks: number;
  criticalIncidents: number;
  criticalRisks: number;
  incidentsThisPeriod: number;
  incidentsPreviousPeriod: number;
  risksThisPeriod: number;
  risksPreviousPeriod: number;
  slaBreachesThisPeriod: number;
  daysSinceLastPublishedReport: number | null;
  recentActivityCount: number;
};

export type OperationalSnapshot = {
  dashboard: DashboardData;
  organizationName: string;
  clients: ClientOperationalMetrics[];
  period: PeriodRange;
  previousPeriod: PeriodRange;
  incidentsCurrent: number;
  incidentsPrevious: number;
  risksCurrent: number;
  risksPrevious: number;
  reportsPublishedCurrent: number;
  reportsPublishedPrevious: number;
  slaBreachesCurrent: number;
  slaBreachesPrevious: number;
  daysSinceLastOrgPublishedReport: number | null;
  criticalOpenRisks: number;
  clientsNeedingAttention: number;
  portfolioMargin: number | null;
  recentActivity: ActivityEventView[];
};

function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function toIso(date: Date): string {
  return date.toISOString();
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildPeriodRanges(reference = new Date()): { current: PeriodRange; previous: PeriodRange } {
  const currentStart = startOfMonthUtc(reference);
  const currentEnd = endOfMonthUtc(reference);
  const previousRef = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 15));
  const previousStart = startOfMonthUtc(previousRef);
  const previousEnd = endOfMonthUtc(previousRef);

  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

  return {
    current: {
      start: toIso(currentStart),
      end: toIso(currentEnd),
      label: formatter.format(currentStart),
    },
    previous: {
      start: toIso(previousStart),
      end: toIso(previousEnd),
      label: formatter.format(previousStart),
    },
  };
}

async function countCreatedInRange(
  session: SessionContext,
  table: "incidents" | "risks",
  start: string,
  end: string,
  clientId?: string,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .gte("created_at", start)
    .lte("created_at", end);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function countPublishedReportsInRange(
  session: SessionContext,
  start: string,
  end: string,
  clientId?: string,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .in("status", ["published", "generated"])
    .gte("updated_at", start)
    .lte("updated_at", end);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function getDaysSinceLastPublishedReport(
  session: SessionContext,
  clientId?: string,
): Promise<number | null> {
  const supabase = await createClient();
  let query = supabase
    .from("reports")
    .select("updated_at")
    .eq("organization_id", session.organization.id)
    .in("status", ["published", "generated"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;

  return daysBetween(new Date((data as { updated_at: string }).updated_at), new Date());
}

async function countOpenByClient(
  session: SessionContext,
  table: "incidents" | "risks",
  clientId: string,
  criticalOnly = false,
): Promise<number> {
  const supabase = await createClient();
  const openStatuses =
    table === "incidents" ? OPEN_INCIDENT_STATUSES : LEGACY_OPEN_RISK_STATUSES;

  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", openStatuses);

  if (criticalOnly) {
    query = query.eq("severity", "critical");
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function countSlaBreachesForClientInRange(
  session: SessionContext,
  clientId: string,
  start: string,
  end: string,
): Promise<number> {
  const supabase = await createClient();

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId);

  const { data: risks } = await supabase
    .from("risks")
    .select("id")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId);

  const incidentIds = (incidents ?? []).map((row) => (row as { id: string }).id);
  const riskIds = (risks ?? []).map((row) => (row as { id: string }).id);

  const filters = [`and(entity_type.eq.client,entity_id.eq.${clientId})`];
  if (incidentIds.length > 0) {
    filters.push(`and(entity_type.eq.incident,entity_id.in.(${incidentIds.join(",")}))`);
  }
  if (riskIds.length > 0) {
    filters.push(`and(entity_type.eq.risk,entity_id.in.(${riskIds.join(",")}))`);
  }

  const { count, error } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("action", "sla_breached")
    .gte("created_at", start)
    .lte("created_at", end)
    .or(filters.join(","));

  if (error) return 0;
  return count ?? 0;
}

async function countOrgSlaBreachesInRange(
  session: SessionContext,
  start: string,
  end: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("action", "sla_breached")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) return 0;
  return count ?? 0;
}

async function loadRecentActivity(session: SessionContext, limit = 12): Promise<ActivityEventView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ActivityEventView[];
}

/** Build trusted operational snapshot from existing DB sources. */
export const buildOperationalSnapshot = cache(async function buildOperationalSnapshot(
  session: SessionContext,
  existingDashboard?: DashboardData,
): Promise<OperationalSnapshot> {
  const dashboard = existingDashboard ?? (await getDashboardData(session));
  const { current: period, previous: previousPeriod } = buildPeriodRanges();
  const profitabilityRows = await buildClientProfitabilityRows(session);

  const [
    incidentsCurrent,
    incidentsPrevious,
    risksCurrent,
    risksPrevious,
    reportsPublishedCurrent,
    reportsPublishedPrevious,
    slaBreachesCurrent,
    slaBreachesPrevious,
    daysSinceLastOrgPublishedReport,
    recentActivity,
  ] = await Promise.all([
    dashboard.features.incidents
      ? countCreatedInRange(session, "incidents", period.start, period.end)
      : Promise.resolve(0),
    dashboard.features.incidents
      ? countCreatedInRange(session, "incidents", previousPeriod.start, previousPeriod.end)
      : Promise.resolve(0),
    dashboard.features.risks
      ? countCreatedInRange(session, "risks", period.start, period.end)
      : Promise.resolve(0),
    dashboard.features.risks
      ? countCreatedInRange(session, "risks", previousPeriod.start, previousPeriod.end)
      : Promise.resolve(0),
    countPublishedReportsInRange(session, period.start, period.end),
    countPublishedReportsInRange(session, previousPeriod.start, previousPeriod.end),
    dashboard.features.sla
      ? countOrgSlaBreachesInRange(session, period.start, period.end)
      : Promise.resolve(0),
    dashboard.features.sla
      ? countOrgSlaBreachesInRange(session, previousPeriod.start, previousPeriod.end)
      : Promise.resolve(0),
    getDaysSinceLastPublishedReport(session),
    loadRecentActivity(session),
  ]);

  const clients = await Promise.all(
    profitabilityRows.map(async (row) => {
      const [
        openIncidents,
        openRisks,
        criticalIncidents,
        criticalRisks,
        incidentsThisPeriod,
        incidentsPreviousPeriod,
        risksThisPeriod,
        risksPreviousPeriod,
        slaBreachesThisPeriod,
        daysSinceLastPublishedReport,
      ] = await Promise.all([
        dashboard.features.incidents ? countOpenByClient(session, "incidents", row.clientId) : 0,
        dashboard.features.risks ? countOpenByClient(session, "risks", row.clientId) : 0,
        dashboard.features.incidents
          ? countOpenByClient(session, "incidents", row.clientId, true)
          : 0,
        dashboard.features.risks ? countOpenByClient(session, "risks", row.clientId, true) : 0,
        dashboard.features.incidents
          ? countCreatedInRange(session, "incidents", period.start, period.end, row.clientId)
          : 0,
        dashboard.features.incidents
          ? countCreatedInRange(
              session,
              "incidents",
              previousPeriod.start,
              previousPeriod.end,
              row.clientId,
            )
          : 0,
        dashboard.features.risks
          ? countCreatedInRange(session, "risks", period.start, period.end, row.clientId)
          : 0,
        dashboard.features.risks
          ? countCreatedInRange(
              session,
              "risks",
              previousPeriod.start,
              previousPeriod.end,
              row.clientId,
            )
          : 0,
        dashboard.features.sla
          ? countSlaBreachesForClientInRange(session, row.clientId, period.start, period.end)
          : 0,
        getDaysSinceLastPublishedReport(session, row.clientId),
      ]);

      const recentActivityCount = recentActivity.filter(
        (event) => event.entity_type === "client" && event.entity_id === row.clientId,
      ).length;

      return {
        clientId: row.clientId,
        clientName: row.clientName,
        profitability: row,
        openIncidents,
        openRisks,
        criticalIncidents,
        criticalRisks,
        incidentsThisPeriod,
        incidentsPreviousPeriod,
        risksThisPeriod,
        risksPreviousPeriod,
        slaBreachesThisPeriod,
        daysSinceLastPublishedReport,
        recentActivityCount,
      } satisfies ClientOperationalMetrics;
    }),
  );

  const criticalOpenRisks = dashboard.features.risks
    ? dashboard.criticalAlerts.filter((alert) => alert.type === "risk").length
    : 0;

  const clientsNeedingAttention = clients.filter(
    (client) =>
      client.profitability.health === "watch" ||
      client.profitability.health === "critical" ||
      client.criticalIncidents > 0 ||
      client.criticalRisks > 0,
  ).length;

  const margins = profitabilityRows
    .map((row) => row.margin)
    .filter((margin): margin is number => margin !== null);
  const portfolioMargin =
    margins.length > 0
      ? Math.round(margins.reduce((sum, margin) => sum + margin, 0) / margins.length)
      : null;

  return {
    dashboard,
    organizationName: session.organization.name,
    clients,
    period,
    previousPeriod,
    incidentsCurrent,
    incidentsPrevious,
    risksCurrent,
    risksPrevious,
    reportsPublishedCurrent,
    reportsPublishedPrevious,
    slaBreachesCurrent,
    slaBreachesPrevious,
    daysSinceLastOrgPublishedReport,
    criticalOpenRisks,
    clientsNeedingAttention,
    portfolioMargin,
    recentActivity,
  };
});
