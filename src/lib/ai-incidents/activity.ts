import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type IncidentAIActivityEventType =
  | "incident.ai_analysis_created"
  | "incident.ai_summary_generated"
  | "incident.ai_recommendation_created";

export type RecordIncidentAIActivityInput = {
  organizationId: string;
  incidentId: string;
  actorUserId?: string | null;
  eventType: IncidentAIActivityEventType;
  message: string;
  metadata?: Record<string, unknown>;
};

/** Record incident AI activity — never throws. */
export async function recordIncidentAIActivity(input: RecordIncidentAIActivityInput): Promise<void> {
  try {
    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      entityType: "incident",
      entityId: input.incidentId,
      eventType: input.eventType as ActivityEventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.message,
      metadata: { incidentId: input.incidentId, ...input.metadata },
    });
  } catch (error) {
    console.warn("[ai-incidents] activity recording failed:", error);
  }
}

export type RecordIncidentAnalysisInput = {
  organizationId: string;
  incidentId: string;
  provider: string;
  model: string;
  summary: string;
  rootCause: string;
  recommendations: string;
  confidence: number;
  tokensUsed: number | null;
  latencyMs: number;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
};

/** Persist incident AI analysis — never throws. */
export async function recordIncidentAnalysis(
  input: RecordIncidentAnalysisInput,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const metadata = {
      nextSteps: input.metadata?.nextSteps ?? null,
      ...input.metadata,
    };

    const { data, error } = await admin
      .from("incident_ai_analysis")
      .insert({
        organization_id: input.organizationId,
        incident_id: input.incidentId,
        provider: input.provider,
        model: input.model,
        summary: input.summary,
        root_cause: input.rootCause,
        recommendations: input.recommendations,
        confidence: input.confidence,
        tokens_used: input.tokensUsed,
        latency_ms: input.latencyMs,
        metadata,
      } as never)
      .select("id")
      .single();

    if (error || !data) {
      console.warn("[ai-incidents] recordIncidentAnalysis failed:", error?.message);
      return null;
    }

    const analysisId = String((data as { id: string }).id);

    await recordIncidentAIActivity({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      actorUserId: input.actorUserId,
      eventType: "incident.ai_analysis_created",
      message: "AI incident analysis generated",
      metadata: { analysisId, provider: input.provider, confidence: input.confidence },
    });

    await recordIncidentAIActivity({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      actorUserId: input.actorUserId,
      eventType: "incident.ai_summary_generated",
      message: "AI incident summary generated",
      metadata: { analysisId },
    });

    await recordIncidentAIActivity({
      organizationId: input.organizationId,
      incidentId: input.incidentId,
      actorUserId: input.actorUserId,
      eventType: "incident.ai_recommendation_created",
      message: "AI incident recommendations generated",
      metadata: { analysisId },
    });

    return analysisId;
  } catch (error) {
    console.warn("[ai-incidents] recordIncidentAnalysis failed:", error);
    return null;
  }
}
