import { calculateHealth } from "@/lib/health/engine";
import { gatherClientHealthMetrics } from "@/lib/health/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import type {
  ExecutiveSummary,
  HealthTrend,
  ReportMetrics,
  ReportSummary,
  SLASnapshot,
} from "@/lib/reports-v2/types";
import {
  buildReportSummary,
  deriveHealthTrend,
  deriveSlaScore,
} from "@/lib/reports-v2/summary";
import { createClient } from "@/lib/supabase/server";
import { getClientRiskMetricsForReport } from "@/lib/risks/queries";
import { getClientSLA, getTopBreachedClients } from "@/lib/sla/summary";
import { getMonitoringReportSnapshot } from "@/lib/monitoring/summary";
import { getClientIncidentAIReportSnapshot } from "@/lib/ai-incidents/summary";
import { getClientRiskAIReportSnapshot } from "@/lib/ai-risks/queries";
import { getSLAMetrics } from "@/lib/sla/metrics";

type GenerateReportInput = {
  session: SessionContext;
  reportId: string;
  clientId: string;
  clientName: string;
  clientStatus: string;
  periodStart: string;
  periodEnd: string;
};

async function countActivity(
  organizationId: string,
  clientId: string,
  since: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .or(`and(entity_type.eq.client,entity_id.eq.${clientId})`);

  return count ?? 0;
}

async function countOpenItems(
  organizationId: string,
  clientId: string,
): Promise<{ openRisks: number; openIncidents: number; slaViolations: number }> {
  const supabase = await createClient();
  const [risks, incidents] = await Promise.all([
    supabase
      .from("client_risks")
      .select("id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", ["open", "acknowledged", "mitigated"]),
    supabase
      .from("incidents")
      .select("id, status, created_at")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", ["open", "investigating"]),
  ]);

  const openRisks = risks.data?.length ?? 0;
  const openIncidents = incidents.data?.length ?? 0;
  type OpenItemRow = { status: string; created_at: string };
  const incidentRows = (incidents.data ?? []) as OpenItemRow[];
  const riskRows = (risks.data ?? []) as OpenItemRow[];
  const slaViolations =
    incidentRows.filter((item) => {
      const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
      return item.status !== "resolved" && ageHours > 48;
    }).length +
    riskRows.filter((item) => {
      const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
      return item.status !== "resolved" && ageHours > 72;
    }).length;

  return { openRisks, openIncidents, slaViolations };
}

async function loadHealthTrend(
  organizationId: string,
  clientId: string,
): Promise<HealthTrend> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("health_snapshots")
    .select("score, status, calculated_at")
    .eq("organization_id", organizationId)
    .eq("client_id", clientId)
    .order("calculated_at", { ascending: false })
    .limit(10);

  return deriveHealthTrend((data ?? []) as Array<{ score: number; status: string; calculated_at: string }>);
}

export async function buildHealthSection(
  session: SessionContext,
  clientId: string,
  clientStatus: string,
): Promise<HealthTrend> {
  try {
    return await loadHealthTrend(session.organization.id, clientId);
  } catch {
    try {
      const metrics = await gatherClientHealthMetrics(session, clientId, clientStatus);
      const result = calculateHealth({
        client: { id: clientId, name: "", status: clientStatus, updated_at: new Date().toISOString() },
        metrics,
      });

      return {
        current: result.score,
        previous: null,
        delta: 0,
        status: result.status,
        points: [],
      };
    } catch {
      return {
        current: null,
        previous: null,
        delta: null,
        status: null,
        points: [],
      };
    }
  }
}

export async function buildSLASummary(
  session: SessionContext,
  clientId: string,
): Promise<SLASnapshot> {
  try {
    const [clientSla, orgMetrics, topBreachedClients] = await Promise.all([
      getClientSLA(session, clientId),
      getSLAMetrics(session),
      getTopBreachedClients(session, 5),
    ]);

    return {
      score: clientSla.compliancePercent,
      violations: clientSla.breachCount,
      onTrack: clientSla.breachCount === 0,
      policyName: clientSla.policyName,
      avgResponseMinutes: clientSla.avgResponseMinutes,
      avgResolutionMinutes: clientSla.avgResolutionMinutes,
      monthlyTrend: orgMetrics.monthlyTrend,
      topBreachedClients,
    };
  } catch {
    const counts = await countOpenItems(session.organization.id, clientId);
    const score = deriveSlaScore(counts.slaViolations);

    return {
      score,
      violations: counts.slaViolations,
      onTrack: counts.slaViolations === 0,
      policyName: null,
    };
  }
}

export async function buildKPISection(
  session: SessionContext,
  clientId: string,
  periodStart: string,
): Promise<Pick<ReportMetrics, "openRisks" | "openIncidents" | "activityCount" | "activityTrendPercent">> {
  const since = periodStart;
  const previousSince = new Date(new Date(periodStart).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [counts, currentActivity, previousActivity, clientRiskMetrics] = await Promise.all([
    countOpenItems(session.organization.id, clientId),
    countActivity(session.organization.id, clientId, since),
    countActivity(session.organization.id, clientId, previousSince),
    getClientRiskMetricsForReport(session, clientId),
  ]);

  let activityTrendPercent: number | null = null;
  if (previousActivity > 0) {
    activityTrendPercent = Math.round(((currentActivity - previousActivity) / previousActivity) * 100);
  }

  return {
    openRisks: clientRiskMetrics.openCount || counts.openRisks,
    openIncidents: counts.openIncidents,
    activityCount: currentActivity,
    activityTrendPercent,
  };
}

export async function buildTimelineSection(
  session: SessionContext,
  clientId: string,
  limit = 5,
): Promise<Array<{ title: string; created_at: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_events")
    .select("title, created_at")
    .eq("organization_id", session.organization.id)
    .in("event_type", ["client.updated", "health.changed", "report.created", "report.updated", "sla.updated"])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{ title: string; created_at: string }>;
}

export async function buildExecutiveSummaryForReport(
  input: GenerateReportInput,
): Promise<ExecutiveSummary> {
  const summary = await buildReportSummaryForReport(input);
  return summary.executiveSummary;
}

export async function buildReportSummaryForReport(
  input: GenerateReportInput,
): Promise<ReportSummary> {
  const [healthTrend, slaSnapshot, kpis, monitoringSnapshot, incidentAISnapshot, riskAISnapshot] = await Promise.all([
    buildHealthSection(input.session, input.clientId, input.clientStatus),
    buildSLASummary(input.session, input.clientId),
    buildKPISection(input.session, input.clientId, input.periodStart),
    getMonitoringReportSnapshot(input.session, input.clientId),
    getClientIncidentAIReportSnapshot(input.session, input.clientId),
    getClientRiskAIReportSnapshot(input.session, input.clientId),
  ]);

  const metrics: ReportMetrics = {
    healthScore: healthTrend.current,
    previousHealthScore: healthTrend.previous,
    healthDelta: healthTrend.delta,
    healthStatus: healthTrend.status,
    slaScore: slaSnapshot.score,
    slaViolations: slaSnapshot.violations,
    ...kpis,
  };

  return buildReportSummary({ metrics, healthTrend, slaSnapshot, monitoringSnapshot, incidentAISnapshot, riskAISnapshot });
}

/** Generate report content and metrics — never throws. */
export async function generateReport(input: GenerateReportInput): Promise<{
  data: ReportSummary | null;
  error: string | null;
}> {
  try {
    const summary = await buildReportSummaryForReport(input);
    return { data: summary, error: null };
  } catch (error) {
    console.warn("[reports-v2] generateReport failed:", error);
    return { data: null, error: "Unable to generate report content." };
  }
}
