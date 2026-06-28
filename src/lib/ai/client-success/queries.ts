import "server-only";

import type { ActivityEventView } from "@/lib/activity/types";
import { getClientOverview } from "@/lib/client-overview/queries";
import { getClientById } from "@/lib/clients/queries";
import { canUseFeature } from "@/lib/plans/guards";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import type { ReportWithRelations } from "@/lib/reports/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

export type ClientSuccessSnapshot = {
  clientId: string;
  clientName: string;
  clientStatus: string;
  overview: Awaited<ReturnType<typeof getClientOverview>>;
  profitability: ClientProfitabilityRow | null;
  risksEnabled: boolean;
  incidentsEnabled: boolean;
  slaEnabled: boolean;
  schedulingEnabled: boolean;
  profitabilityEnabled: boolean;
  daysSinceLastPublishedReport: number | null;
  daysSinceLastActivity: number | null;
  draftReportsCount: number;
  publishedReportsCount: number;
  portalUsersCount: number;
  scheduledReportsCount: number;
  slaBreachesThisPeriod: number;
  slaBreachesPreviousPeriod: number;
  incidentsThisPeriod: number;
  incidentsPreviousPeriod: number;
  risksThisPeriod: number;
  risksPreviousPeriod: number;
  reportsPublishedThisPeriod: number;
  reportsPublishedPreviousPeriod: number;
  latestPublishedReport: ReportWithRelations | null;
  recentReports: ReportWithRelations[];
  recentActivity: ActivityEventView[];
  hasEmailActivity: boolean;
  periodLabel: string;
  previousPeriodLabel: string;
};

function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

function buildPeriodRanges(reference = new Date()) {
  const currentStart = startOfMonthUtc(reference);
  const currentEnd = endOfMonthUtc(reference);
  const previousRef = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 15));
  const previousStart = startOfMonthUtc(previousRef);
  const previousEnd = endOfMonthUtc(previousRef);
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

  return {
    current: { start: currentStart.toISOString(), end: currentEnd.toISOString(), label: formatter.format(currentStart) },
    previous: { start: previousStart.toISOString(), end: previousEnd.toISOString(), label: formatter.format(previousRef) },
  };
}

async function countReportsByStatus(
  session: SessionContext,
  clientId: string,
  status: "draft" | "published" | "sent",
): Promise<number> {
  const supabase = await createClient();
  const statuses = status === "draft" ? ["draft"] : ["published", "sent"];

  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", statuses);

  if (error) return 0;
  return count ?? 0;
}

async function countReportsPublishedInRange(
  session: SessionContext,
  clientId: string,
  start: string,
  end: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", ["published", "sent"])
    .gte("updated_at", start)
    .lte("updated_at", end);

  if (error) return 0;
  return count ?? 0;
}

async function countCreatedInRange(
  session: SessionContext,
  table: "incidents" | "risks",
  clientId: string,
  start: string,
  end: string,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .gte("created_at", start)
    .lte("created_at", end);

  if (error) return 0;
  return count ?? 0;
}

async function getDaysSinceLastPublishedReport(
  session: SessionContext,
  clientId: string,
): Promise<number | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("updated_at")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", ["published", "sent"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return daysBetween(new Date((data as { updated_at: string }).updated_at), new Date());
}

async function getLatestPublishedReport(
  session: SessionContext,
  clientId: string,
): Promise<ReportWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, organization_id, client_id, title, status, reporting_period_start, reporting_period_end, executive_summary, key_wins, key_risks, next_actions, assigned_user_id, sent_at, created_at, updated_at")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", ["published", "sent"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as ReportWithRelations;
}

async function listRecentReports(session: SessionContext, clientId: string, limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, organization_id, client_id, title, status, reporting_period_start, reporting_period_end, executive_summary, key_wins, key_risks, next_actions, assigned_user_id, sent_at, created_at, updated_at")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ReportWithRelations[];
}

async function countSlaBreachesInRange(
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

  if (incidentIds.length > 0) filters.push(`and(entity_type.eq.incident,entity_id.in.(${incidentIds.join(",")}))`);
  if (riskIds.length > 0) filters.push(`and(entity_type.eq.risk,entity_id.in.(${riskIds.join(",")}))`);

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

async function countPortalUsers(session: SessionContext, clientId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("client_portal_users")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId);

  if (error) return 0;
  return count ?? 0;
}

async function countSchedules(session: SessionContext, clientId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("report_schedules")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .eq("is_active", true);

  if (error) return 0;
  return count ?? 0;
}

async function hasEmailActivity(session: SessionContext, clientId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("id")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId);

  const reportIds = (reports ?? []).map((row) => (row as { id: string }).id);
  if (reportIds.length === 0) return false;

  const { count, error } = await supabase
    .from("report_email_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .in("report_id", reportIds);

  if (error) return false;
  return (count ?? 0) > 0;
}

/** Build verified client success snapshot from DB — server-side only. */
export async function buildClientSuccessSnapshot(
  session: SessionContext,
  clientId: string,
): Promise<ClientSuccessSnapshot | null> {
  const client = await getClientById(session, clientId);
  if (!client) return null;

  const { current: period, previous: previousPeriod } = buildPeriodRanges();

  const [risksEnabled, incidentsEnabled, slaEnabled, schedulingEnabled, profitabilityEnabled] =
    await Promise.all([
      canUseFeature(session.organization.id, "risks"),
      canUseFeature(session.organization.id, "incidents"),
      canUseFeature(session.organization.id, "sla_tracking"),
      canUseFeature(session.organization.id, "report_scheduling"),
      canUseFeature(session.organization.id, "profitability"),
    ]);

  const [
    overview,
    daysSinceLastPublishedReport,
    draftReportsCount,
    publishedReportsCount,
    portalUsersCount,
    scheduledReportsCount,
    slaBreachesThisPeriod,
    slaBreachesPreviousPeriod,
    incidentsThisPeriod,
    incidentsPreviousPeriod,
    risksThisPeriod,
    risksPreviousPeriod,
    reportsPublishedThisPeriod,
    reportsPublishedPreviousPeriod,
    latestPublishedReport,
    recentReports,
    hasEmailActivityFlag,
  ] = await Promise.all([
    getClientOverview(session, clientId),
    getDaysSinceLastPublishedReport(session, clientId),
    countReportsByStatus(session, clientId, "draft"),
    countReportsByStatus(session, clientId, "published"),
    countPortalUsers(session, clientId),
    countSchedules(session, clientId),
    slaEnabled ? countSlaBreachesInRange(session, clientId, period.start, period.end) : 0,
    slaEnabled ? countSlaBreachesInRange(session, clientId, previousPeriod.start, previousPeriod.end) : 0,
    incidentsEnabled ? countCreatedInRange(session, "incidents", clientId, period.start, period.end) : 0,
    incidentsEnabled ? countCreatedInRange(session, "incidents", clientId, previousPeriod.start, previousPeriod.end) : 0,
    risksEnabled ? countCreatedInRange(session, "risks", clientId, period.start, period.end) : 0,
    risksEnabled ? countCreatedInRange(session, "risks", clientId, previousPeriod.start, previousPeriod.end) : 0,
    countReportsPublishedInRange(session, clientId, period.start, period.end),
    countReportsPublishedInRange(session, clientId, previousPeriod.start, previousPeriod.end),
    getLatestPublishedReport(session, clientId),
    listRecentReports(session, clientId),
    hasEmailActivity(session, clientId),
  ]);

  const latestActivity = overview.recentActivity[0];
  const daysSinceLastActivity = latestActivity
    ? daysBetween(new Date(latestActivity.created_at), new Date())
    : null;

  return {
    clientId,
    clientName: client.name,
    clientStatus: client.status,
    overview,
    profitability: overview.kpis.profitability,
    risksEnabled,
    incidentsEnabled,
    slaEnabled,
    schedulingEnabled,
    profitabilityEnabled,
    daysSinceLastPublishedReport,
    daysSinceLastActivity,
    draftReportsCount,
    publishedReportsCount,
    portalUsersCount,
    scheduledReportsCount,
    slaBreachesThisPeriod,
    slaBreachesPreviousPeriod,
    incidentsThisPeriod,
    incidentsPreviousPeriod,
    risksThisPeriod,
    risksPreviousPeriod,
    reportsPublishedThisPeriod,
    reportsPublishedPreviousPeriod,
    latestPublishedReport,
    recentReports,
    recentActivity: overview.recentActivity,
    hasEmailActivity: hasEmailActivityFlag,
    periodLabel: period.label,
    previousPeriodLabel: previousPeriod.label,
  };
}
