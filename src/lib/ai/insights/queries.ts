import "server-only";

import { cache } from "react";
import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import type { DashboardData } from "@/lib/dashboard/types";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
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
  const tableName = table === "risks" ? "client_risks" : table;
  let query = supabase
    .from(tableName)
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

function incrementCountMap(map: Map<string, number>, clientId: string, by = 1): void {
  map.set(clientId, (map.get(clientId) ?? 0) + by);
}

/** Org-wide open counts grouped by client — replaces per-client N+1 head counts. */
async function loadOpenCountsByClient(
  session: SessionContext,
  table: "incidents" | "risks",
): Promise<{ open: Map<string, number>; critical: Map<string, number> }> {
  const supabase = await createClient();
  const tableName = table === "risks" ? "client_risks" : table;
  const openStatuses = table === "incidents" ? OPEN_INCIDENT_STATUSES : OPEN_RISK_STATUSES;

  const { data, error } = await supabase
    .from(tableName)
    .select("client_id, severity")
    .eq("organization_id", session.organization.id)
    .in("status", openStatuses);

  const open = new Map<string, number>();
  const critical = new Map<string, number>();
  if (error || !data) {
    return { open, critical };
  }

  for (const row of data as Array<{ client_id: string; severity: string }>) {
    incrementCountMap(open, row.client_id);
    if (row.severity === "critical") {
      incrementCountMap(critical, row.client_id);
    }
  }

  return { open, critical };
}

/** Org-wide created-in-range counts grouped by client. */
async function loadCreatedCountsByClient(
  session: SessionContext,
  table: "incidents" | "risks",
  start: string,
  end: string,
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const tableName = table === "risks" ? "client_risks" : table;
  const counts = new Map<string, number>();

  const { data, error } = await supabase
    .from(tableName)
    .select("client_id")
    .eq("organization_id", session.organization.id)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error || !data) {
    return counts;
  }

  for (const row of data as Array<{ client_id: string }>) {
    incrementCountMap(counts, row.client_id);
  }

  return counts;
}

/** Latest published/generated report age (days) per client — one org query. */
async function loadDaysSinceLastPublishedReportByClient(
  session: SessionContext,
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const daysByClient = new Map<string, number>();
  const now = new Date();

  const { data, error } = await supabase
    .from("reports")
    .select("client_id, updated_at")
    .eq("organization_id", session.organization.id)
    .in("status", ["published", "generated"])
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return daysByClient;
  }

  for (const row of data as Array<{ client_id: string; updated_at: string }>) {
    if (daysByClient.has(row.client_id)) {
      continue;
    }
    daysByClient.set(row.client_id, daysBetween(new Date(row.updated_at), now));
  }

  return daysByClient;
}

/** SLA breach activity counts per client for a range — one activity query. */
async function loadSlaBreachCountsByClient(
  session: SessionContext,
  start: string,
  end: string,
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const counts = new Map<string, number>();

  const { data, error } = await supabase
    .from("activity_events")
    .select("entity_type, entity_id")
    .eq("organization_id", session.organization.id)
    .eq("action", "sla_breached")
    .gte("created_at", start)
    .lte("created_at", end);

  if (error || !data) {
    return counts;
  }

  const incidentIds: string[] = [];
  const riskIds: string[] = [];
  for (const row of data as Array<{ entity_type: string; entity_id: string }>) {
    if (row.entity_type === "client") {
      incrementCountMap(counts, row.entity_id);
    } else if (row.entity_type === "incident") {
      incidentIds.push(row.entity_id);
    } else if (row.entity_type === "risk") {
      riskIds.push(row.entity_id);
    }
  }

  const [incidents, risks] = await Promise.all([
    incidentIds.length
      ? supabase
          .from("incidents")
          .select("id, client_id")
          .eq("organization_id", session.organization.id)
          .in("id", incidentIds)
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string }> }),
    riskIds.length
      ? supabase
          .from("client_risks")
          .select("id, client_id")
          .eq("organization_id", session.organization.id)
          .in("id", riskIds)
      : Promise.resolve({ data: [] as Array<{ id: string; client_id: string }> }),
  ]);

  for (const row of (incidents.data ?? []) as Array<{ id: string; client_id: string }>) {
    incrementCountMap(counts, row.client_id);
  }
  for (const row of (risks.data ?? []) as Array<{ id: string; client_id: string }>) {
    incrementCountMap(counts, row.client_id);
  }

  return counts;
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
    openIncidentsByClient,
    openRisksByClient,
    incidentsCreatedCurrentByClient,
    incidentsCreatedPreviousByClient,
    risksCreatedCurrentByClient,
    risksCreatedPreviousByClient,
    slaBreachesByClient,
    daysSinceReportByClient,
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
    dashboard.features.incidents
      ? loadOpenCountsByClient(session, "incidents")
      : Promise.resolve({ open: new Map<string, number>(), critical: new Map<string, number>() }),
    dashboard.features.risks
      ? loadOpenCountsByClient(session, "risks")
      : Promise.resolve({ open: new Map<string, number>(), critical: new Map<string, number>() }),
    dashboard.features.incidents
      ? loadCreatedCountsByClient(session, "incidents", period.start, period.end)
      : Promise.resolve(new Map<string, number>()),
    dashboard.features.incidents
      ? loadCreatedCountsByClient(session, "incidents", previousPeriod.start, previousPeriod.end)
      : Promise.resolve(new Map<string, number>()),
    dashboard.features.risks
      ? loadCreatedCountsByClient(session, "risks", period.start, period.end)
      : Promise.resolve(new Map<string, number>()),
    dashboard.features.risks
      ? loadCreatedCountsByClient(session, "risks", previousPeriod.start, previousPeriod.end)
      : Promise.resolve(new Map<string, number>()),
    dashboard.features.sla
      ? loadSlaBreachCountsByClient(session, period.start, period.end)
      : Promise.resolve(new Map<string, number>()),
    loadDaysSinceLastPublishedReportByClient(session),
  ]);

  const clients = profitabilityRows.map((row) => {
    const recentActivityCount = recentActivity.filter(
      (event) => event.entity_type === "client" && event.entity_id === row.clientId,
    ).length;

    return {
      clientId: row.clientId,
      clientName: row.clientName,
      profitability: row,
      openIncidents: openIncidentsByClient.open.get(row.clientId) ?? 0,
      openRisks: openRisksByClient.open.get(row.clientId) ?? 0,
      criticalIncidents: openIncidentsByClient.critical.get(row.clientId) ?? 0,
      criticalRisks: openRisksByClient.critical.get(row.clientId) ?? 0,
      incidentsThisPeriod: incidentsCreatedCurrentByClient.get(row.clientId) ?? 0,
      incidentsPreviousPeriod: incidentsCreatedPreviousByClient.get(row.clientId) ?? 0,
      risksThisPeriod: risksCreatedCurrentByClient.get(row.clientId) ?? 0,
      risksPreviousPeriod: risksCreatedPreviousByClient.get(row.clientId) ?? 0,
      slaBreachesThisPeriod: slaBreachesByClient.get(row.clientId) ?? 0,
      daysSinceLastPublishedReport: daysSinceReportByClient.get(row.clientId) ?? null,
      recentActivityCount,
    } satisfies ClientOperationalMetrics;
  });

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
