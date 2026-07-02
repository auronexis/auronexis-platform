import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type {
  IncidentAIDashboardMetrics,
  IncidentAIReportSnapshot,
} from "@/lib/ai-incidents/types";
import { getIncidentAnalysis } from "@/lib/ai-incidents/queries";

/** Dashboard KPIs for incident AI assistant — never throws. */
export async function getIncidentAIDashboardMetrics(
  session: SessionContext,
): Promise<IncidentAIDashboardMetrics> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incident_ai_analysis")
      .select("incident_id, confidence")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data) {
      return {
        analysesGenerated: 0,
        highConfidenceAnalyses: 0,
        incidentsReviewed: 0,
        averageConfidence: null,
      };
    }

    const rows = data as Array<{ incident_id: string | null; confidence: number | null }>;
    const analysesGenerated = rows.length;
    const highConfidenceAnalyses = rows.filter((row) => (row.confidence ?? 0) >= 0.85).length;
    const incidentsReviewed = new Set(rows.map((row) => row.incident_id).filter(Boolean)).size;
    const confidenceValues = rows
      .map((row) => row.confidence)
      .filter((value): value is number => value != null);
    const averageConfidence =
      confidenceValues.length > 0
        ? Math.round(
            (confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) *
              100,
          ) / 100
        : null;

    return {
      analysesGenerated,
      highConfidenceAnalyses,
      incidentsReviewed,
      averageConfidence,
    };
  } catch {
    return {
      analysesGenerated: 0,
      highConfidenceAnalyses: 0,
      incidentsReviewed: 0,
      averageConfidence: null,
    };
  }
}

/** Report-safe snapshot from latest incident analysis — never throws. */
export async function getIncidentAIReportSnapshot(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentAIReportSnapshot | null> {
  try {
    const analysis = await getIncidentAnalysis(session, incidentId);
    if (!analysis) {
      return null;
    }

    const metadata = analysis.metadata;
    const nextSteps =
      typeof metadata.nextSteps === "string" ? metadata.nextSteps : analysis.recommendations;

    return {
      summary: analysis.summary,
      rootCause: analysis.root_cause,
      suggestedImprovements: nextSteps,
      confidence: analysis.confidence,
    };
  } catch {
    return null;
  }
}

/** Aggregate report snapshot across open incidents for a client — never throws. */
export async function getClientIncidentAIReportSnapshot(
  session: SessionContext,
  clientId: string,
): Promise<IncidentAIReportSnapshot | null> {
  try {
    const supabase = await createClient();
    const { data: incidents } = await supabase
      .from("incidents")
      .select("id")
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .in("status", ["open", "investigating"])
      .limit(5);

    const incidentIds = (incidents ?? []).map((row) => String((row as { id: string }).id));
    if (incidentIds.length === 0) {
      return null;
    }

    const snapshots = await Promise.all(
      incidentIds.map((incidentId) => getIncidentAIReportSnapshot(session, incidentId)),
    );

    const valid = snapshots.filter((item): item is IncidentAIReportSnapshot => item != null);
    if (valid.length === 0) {
      return null;
    }

    return {
      summary: valid.map((item) => item.summary).filter(Boolean).join(" "),
      rootCause: valid.map((item) => item.rootCause).filter(Boolean).join("\n"),
      suggestedImprovements: valid.map((item) => item.suggestedImprovements).filter(Boolean).join("\n"),
      confidence:
        valid.reduce((sum, item) => sum + (item.confidence ?? 0), 0) / valid.length,
    };
  } catch {
    return null;
  }
}
