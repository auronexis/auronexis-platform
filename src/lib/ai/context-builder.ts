import "server-only";

import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import { buildReportAIContextFromForm } from "@/lib/ai/prompts";
import { searchKnowledgeForReport } from "@/lib/ai/knowledge/search";
import type { ReportAIContext } from "@/lib/ai/types";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
  getReportById,
} from "@/lib/reports/queries";
import { formatReportPeriod } from "@/lib/reports/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import { getCurrentPlan } from "@/lib/plans/queries";
import { isFeatureEnabled } from "@/lib/plans/features";

type BuildContextInput = {
  reportId?: string;
  clientId: string;
  clientName: string;
  reportTitle: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  fieldValues: Partial<Record<string, string>>;
};

async function getClientProfitability(session: SessionContext, clientId: string) {
  const rows = await buildClientProfitabilityRows(session);
  return rows.find((row) => row.clientId === clientId) ?? null;
}

async function listClientActivity(session: SessionContext, clientId: string, limit = 8) {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const [risksResult, incidentsResult, reportsResult] = await Promise.all([
    supabase.from("risks").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
    supabase.from("incidents").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
    supabase.from("reports").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
  ]);

  if (risksResult.error || incidentsResult.error || reportsResult.error) {
    return [];
  }

  const riskIds = (risksResult.data ?? []).map((row) => (row as { id: string }).id);
  const incidentIds = (incidentsResult.data ?? []).map((row) => (row as { id: string }).id);
  const reportIds = (reportsResult.data ?? []).map((row) => (row as { id: string }).id);

  const filters = [
    `and(entity_type.eq.client,entity_id.eq.${clientId})`,
    `and(entity_type.eq.financial,entity_id.eq.${clientId})`,
  ];

  if (riskIds.length > 0) filters.push(`and(entity_type.eq.risk,entity_id.in.(${riskIds.join(",")}))`);
  if (incidentIds.length > 0) filters.push(`and(entity_type.eq.incident,entity_id.in.(${incidentIds.join(",")}))`);
  if (reportIds.length > 0) filters.push(`and(entity_type.eq.report,entity_id.in.(${reportIds.join(",")}))`);

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", organizationId)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []) as ActivityEventView[];
}

async function countSlaBreaches(session: SessionContext, clientId: string): Promise<number> {
  const events = await listClientActivity(session, clientId, 50);
  return events.filter((event) => event.action === "sla_breached").length;
}

async function getPreviousReportSummary(
  session: SessionContext,
  clientId: string,
  excludeReportId?: string,
): Promise<{ summary: string | null; version: string | null; completedCount: number }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, title, status, executive_summary, updated_at")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    return { summary: null, version: null, completedCount: 0 };
  }

  const reports = (data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    executive_summary: string | null;
    updated_at: string;
  }>;

  const completedCount = reports.filter((report) =>
    ["published", "generated"].includes(report.status),
  ).length;

  const previous = reports.find((report) => report.id !== excludeReportId);

  return {
    summary: previous?.executive_summary ?? null,
    version: previous ? `${previous.title} (${previous.status})` : null,
    completedCount,
  };
}

/** Build trusted operational context from the database — never client-only. */
export async function buildTrustedReportAIContext(
  session: SessionContext,
  input: BuildContextInput,
): Promise<ReportAIContext> {
  const [
    metrics,
    openRisks,
    openIncidents,
    profitability,
    recentActivity,
    slaBreachesCount,
    previous,
  ] = await Promise.all([
    getClientReportMetrics(session, input.clientId),
    getRelatedOpenRisks(session, input.clientId),
    getRelatedOpenIncidents(session, input.clientId),
    getClientProfitability(session, input.clientId),
    listClientActivity(session, input.clientId),
    countSlaBreaches(session, input.clientId),
    getPreviousReportSummary(session, input.clientId, input.reportId),
  ]);

  let assignedEngineer: string | null = null;
  const templateName: string | null = null;
  const scheduleTitle: string | null = null;

  if (input.reportId) {
    const report = await getReportById(session, input.reportId);
    assignedEngineer = report?.users?.full_name ?? null;
  }

  const periodLabel =
    input.reportingPeriodStart && input.reportingPeriodEnd
      ? formatReportPeriod(input.reportingPeriodStart, input.reportingPeriodEnd)
      : "Not set";

  const fv = input.fieldValues;

  const planKey = await getCurrentPlan(session.organization.id);
  const knowledgeEnabled = isFeatureEnabled(planKey, "ai_knowledge_search");
  const knowledgeSnippets = knowledgeEnabled
    ? await searchKnowledgeForReport(session, {
        clientId: input.clientId,
        queryParts: [
          input.reportTitle,
          fv.executive_summary ?? "",
          fv.key_risks ?? "",
          fv.recommendations ?? "",
          fv.key_wins ?? "",
        ],
      })
    : [];

  return buildReportAIContextFromForm({
    reportId: input.reportId,
    reportTitle: input.reportTitle,
    clientId: input.clientId,
    clientName: input.clientName,
    organizationName: session.organization.name,
    reportingPeriodStart: input.reportingPeriodStart,
    reportingPeriodEnd: input.reportingPeriodEnd,
    periodLabel,
    executiveSummary: fv.executive_summary,
    businessSummary: fv.business_summary,
    keyWins: fv.key_wins,
    keyRisks: fv.key_risks,
    nextActions: fv.next_actions,
    recommendations: fv.recommendations,
    customerHighlights: fv.customer_highlights,
    operationalHealthSummary: fv.operational_health_summary,
    managementSummary: fv.management_summary,
    templateName,
    scheduleTitle,
    assignedEngineer,
    customerHealth: profitability?.health ?? null,
    openRisks: openRisks.map((risk) => ({
      id: risk.id,
      title: risk.title,
      severity: risk.severity,
      status: risk.status,
    })),
    openIncidents: openIncidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
    })),
    metrics,
    profitability: profitability
      ? {
          monthlyRevenue: profitability.monthlyRevenue,
          monthlyCost: profitability.monthlyCost,
          margin: profitability.margin,
          profit: profitability.profit,
          health: profitability.health,
        }
      : null,
    slaBreachesCount,
    recentActivity: recentActivity.map((event) => ({
      id: event.id,
      title: event.title,
      action: event.action,
      createdAt: event.created_at,
    })),
    completedReportsCount: previous.completedCount,
    previousReportSummary: previous.summary,
    latestReportVersion: previous.version,
    knowledgeSnippets,
  });
}
