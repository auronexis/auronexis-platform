import "server-only";

import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import {
  mapRiskAIAnalysisRow,
  type RiskAIAnalysis,
  type RiskAIContext,
  type RiskAIDashboardMetrics,
  type RiskAIReportSnapshot,
} from "@/lib/ai-risks/types";
import { getLatestHealthSnapshot } from "@/lib/health/queries";
import { scoreToHealthStatus } from "@/lib/health/types";
import { listMonitoringEvents } from "@/lib/monitoring/queries";
import { getRiskActivity, getRiskById } from "@/lib/risks/queries";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

export const RISK_AI_ANALYSIS_SELECT =
  "id, organization_id, risk_id, provider, model, summary, risk_reasoning, mitigation_plan, recommended_actions, predicted_severity, predicted_score, confidence, tokens_used, latency_ms, metadata, created_at, updated_at";

/** Build trusted risk context for AI prompts — never throws. */
export async function buildRiskAIContext(
  session: SessionContext,
  riskId: string,
): Promise<RiskAIContext | null> {
  try {
    const risk = await getRiskById(session, riskId);
    if (!risk) {
      return null;
    }

    const [activity, monitoringEvents, relatedIncidents, healthSnapshot, recentActivity, recentReports, slaBreaches] =
      await Promise.all([
        getRiskActivity(session, riskId),
        listMonitoringEvents(session, { clientId: risk.client_id, limit: 8 }),
        listRelatedIncidents(session, risk.client_id),
        getLatestHealthSnapshot(session, risk.client_id),
        listRecentClientActivity(session, risk.client_id, 6),
        listRecentReports(session, risk.client_id, 3),
        countSlaBreaches(session, risk.client_id),
      ]);

    return {
      riskId,
      title: risk.title,
      description: risk.description,
      severity: risk.severity,
      status: risk.status,
      likelihood: risk.likelihood,
      impactScore: risk.impact_score,
      riskScore: risk.risk_score,
      mitigationPlan: risk.mitigation_plan,
      recommendation: risk.recommendation,
      clientName: risk.clients?.name ?? null,
      clientHealthScore: healthSnapshot?.score ?? null,
      clientHealthStatus: healthSnapshot ? scoreToHealthStatus(healthSnapshot.score) : null,
      relatedIncidents,
      monitoringEvents: monitoringEvents.map((event) => ({
        severity: event.severity,
        message: event.message,
      })),
      slaBreaches,
      recentActivity: recentActivity.map((event) => ({
        title: event.title,
        createdAt: event.created_at,
      })),
      recentReports,
      timeline: activity.slice(0, 10).map((event) => ({
        title: event.message ?? event.event_type,
        createdAt: event.created_at,
      })),
    };
  } catch (error) {
    console.warn("[ai-risks] buildRiskAIContext failed:", error);
    return null;
  }
}

async function listRelatedIncidents(
  session: SessionContext,
  clientId: string,
): Promise<Array<{ title: string; severity: string; status: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("incidents")
    .select("title, severity, status")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", ["open", "investigating"])
    .limit(5);

  return (data ?? []) as Array<{ title: string; severity: string; status: string }>;
}

async function listRecentClientActivity(
  session: SessionContext,
  clientId: string,
  limit: number,
): Promise<ActivityEventView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as ActivityEventView[];
}

async function listRecentReports(
  session: SessionContext,
  clientId: string,
  limit: number,
): Promise<Array<{ title: string; status: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("title, status")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as Array<{ title: string; status: string }>;
}

async function countSlaBreaches(session: SessionContext, clientId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("sla_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .eq("breached", true);

  return count ?? 0;
}

/** Fetch latest analysis for a risk — never throws. */
export async function getRiskAnalysis(
  session: SessionContext,
  riskId: string,
): Promise<RiskAIAnalysis | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risk_ai_analysis")
      .select(RISK_AI_ANALYSIS_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("risk_id", riskId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRiskAIAnalysisRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** List analysis history for a risk — never throws. */
export async function listRiskAnalyses(
  session: SessionContext,
  riskId: string,
  limit = 10,
): Promise<RiskAIAnalysis[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risk_ai_analysis")
      .select(RISK_AI_ANALYSIS_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("risk_id", riskId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => mapRiskAIAnalysisRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Dashboard KPIs for risk AI assistant — never throws. */
export async function getRiskAIDashboardMetrics(
  session: SessionContext,
): Promise<RiskAIDashboardMetrics> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risk_ai_analysis")
      .select("risk_id, confidence, predicted_severity")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data) {
      return {
        analysesGenerated: 0,
        highConfidenceAnalyses: 0,
        criticalRisksReviewed: 0,
        averageConfidence: null,
      };
    }

    const rows = data as Array<{
      risk_id: string;
      confidence: number | null;
      predicted_severity: string | null;
    }>;

    const analysesGenerated = rows.length;
    const highConfidenceAnalyses = rows.filter((row) => (row.confidence ?? 0) >= 0.85).length;
    const criticalRiskIds = new Set(
      rows.filter((row) => row.predicted_severity === "critical").map((row) => row.risk_id),
    );
    const criticalRisksReviewed = criticalRiskIds.size;
    const confidenceValues = rows
      .map((row) => row.confidence)
      .filter((value): value is number => value != null);
    const averageConfidence =
      confidenceValues.length > 0
        ? Math.round(
            (confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) * 100,
          ) / 100
        : null;

    return {
      analysesGenerated,
      highConfidenceAnalyses,
      criticalRisksReviewed,
      averageConfidence,
    };
  } catch {
    return {
      analysesGenerated: 0,
      highConfidenceAnalyses: 0,
      criticalRisksReviewed: 0,
      averageConfidence: null,
    };
  }
}

/** Report-safe snapshot from open client risks — never throws. */
export async function getClientRiskAIReportSnapshot(
  session: SessionContext,
  clientId: string,
): Promise<RiskAIReportSnapshot | null> {
  try {
    const supabase = await createClient();
    const { data: risks } = await supabase
      .from("client_risks")
      .select("id")
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .in("status", ["open", "acknowledged", "mitigated"])
      .limit(5);

    const riskIds = (risks ?? []).map((row) => String((row as { id: string }).id));
    if (riskIds.length === 0) {
      return null;
    }

    const snapshots = await Promise.all(
      riskIds.map(async (riskId) => {
        const analysis = await getRiskAnalysis(session, riskId);
        if (!analysis) {
          return null;
        }

        return {
          summary: analysis.summary,
          topMitigationRecommendations: analysis.recommended_actions.slice(0, 3),
          predictedSeverity: analysis.predicted_severity,
          predictedScore: analysis.predicted_score,
          confidence: analysis.confidence,
        } satisfies RiskAIReportSnapshot;
      }),
    );

    const valid = snapshots.filter((item): item is RiskAIReportSnapshot => item != null);
    if (valid.length === 0) {
      return null;
    }

    return {
      summary: valid.map((item) => item.summary).filter(Boolean).join(" "),
      topMitigationRecommendations: valid.flatMap((item) => item.topMitigationRecommendations).slice(0, 5),
      predictedSeverity: valid.find((item) => item.predictedSeverity === "critical")?.predictedSeverity
        ?? valid[0]?.predictedSeverity
        ?? null,
      predictedScore: Math.max(...valid.map((item) => item.predictedScore ?? 0)),
      confidence:
        valid.reduce((sum, item) => sum + (item.confidence ?? 0), 0) / valid.length,
    };
  } catch {
    return null;
  }
}
