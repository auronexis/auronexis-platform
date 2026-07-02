import "server-only";

import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import { getLatestHealthSnapshot } from "@/lib/health/queries";
import { getIncidentById, listIncidentActivity } from "@/lib/incidents/queries";
import { listMonitoringEvents } from "@/lib/monitoring/queries";
import { listClientRisks } from "@/lib/risks";
import { getSLAForIncident } from "@/lib/sla/queries";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import {
  mapIncidentAIAnalysisRow,
  type IncidentAIAnalysis,
  type IncidentAIContext,
} from "@/lib/ai-incidents/types";

export const INCIDENT_AI_ANALYSIS_SELECT =
  "id, organization_id, incident_id, provider, model, summary, root_cause, recommendations, confidence, tokens_used, latency_ms, metadata, created_at, updated_at";

/** Build trusted incident context for AI prompts — never throws. */
export async function buildIncidentAIContext(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentAIContext | null> {
  try {
    const incident = await getIncidentById(session, incidentId);
    if (!incident) {
      return null;
    }

    const [activity, monitoringEvents, risks, sla, healthSnapshot, recentActivity] = await Promise.all([
      listIncidentActivity(session, incidentId),
      listMonitoringEvents(session, { clientId: incident.client_id, limit: 8 }),
      listClientRisks(session, incident.client_id, { limit: 5 }),
      getSLAForIncident(session, {
        id: incident.id,
        client_id: incident.client_id,
        severity: incident.severity,
      }),
      getLatestHealthSnapshot(session, incident.client_id),
      listRecentClientActivity(session, incident.client_id, 6),
    ]);

    return {
      incidentId,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      description: incident.description,
      resolutionNotes: incident.resolution_notes,
      clientName: incident.clients?.name ?? null,
      clientHealthScore: healthSnapshot?.score ?? null,
      assigneeName: incident.users?.full_name ?? null,
      timeline: activity.slice(0, 10).map((event) => ({
        title: event.title ?? event.event_type,
        createdAt: event.created_at,
      })),
      monitoringEvents: monitoringEvents.map((event) => ({
        severity: event.severity,
        message: event.message,
        createdAt: event.created_at,
      })),
      relatedRisks: risks.map((risk) => ({
        title: risk.title,
        severity: risk.severity,
        status: risk.status,
      })),
      slaBreached: sla.event?.breached ?? false,
      slaStatus: sla.event?.status ?? null,
      recentActivity: recentActivity.map((event) => ({
        title: event.title,
        createdAt: event.created_at,
      })),
    };
  } catch (error) {
    console.warn("[ai-incidents] buildIncidentAIContext failed:", error);
    return null;
  }
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
    .or(
      `and(entity_type.eq.client,entity_id.eq.${clientId}),and(entity_type.eq.incident,entity_id.not.is.null)`,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []) as ActivityEventView[];
}

/** Fetch latest analysis for an incident — never throws. */
export async function getIncidentAnalysis(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentAIAnalysis | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incident_ai_analysis")
      .select(INCIDENT_AI_ANALYSIS_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapIncidentAIAnalysisRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** List analysis history for an incident — never throws. */
export async function listIncidentAnalyses(
  session: SessionContext,
  incidentId: string,
  limit = 10,
): Promise<IncidentAIAnalysis[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incident_ai_analysis")
      .select(INCIDENT_AI_ANALYSIS_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("incident_id", incidentId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => mapIncidentAIAnalysisRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}
