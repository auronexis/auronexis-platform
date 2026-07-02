import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type RiskAIActivityEventType =
  | "risk.ai_analysis_created"
  | "risk.ai_summary_generated"
  | "risk.ai_mitigation_created"
  | "risk.ai_recommendation_created";

export type RecordRiskAIActivityInput = {
  organizationId: string;
  riskId: string;
  actorUserId?: string | null;
  eventType: RiskAIActivityEventType;
  message: string;
  metadata?: Record<string, unknown>;
};

/** Record risk AI activity — never throws. */
export async function recordRiskAIActivity(input: RecordRiskAIActivityInput): Promise<void> {
  try {
    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      entityType: "risk",
      entityId: input.riskId,
      eventType: input.eventType as ActivityEventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.message,
      metadata: { riskId: input.riskId, ...input.metadata },
    });
  } catch (error) {
    console.warn("[ai-risks] activity recording failed:", error);
  }
}

export type RecordRiskAnalysisInput = {
  organizationId: string;
  riskId: string;
  provider: string;
  model: string;
  summary: string;
  riskReasoning: string;
  mitigationPlan: string;
  recommendedActions: string[];
  predictedSeverity: string;
  predictedScore: number;
  confidence: number;
  tokensUsed: number | null;
  latencyMs: number;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
};

/** Persist risk AI analysis — never throws. */
export async function recordRiskAnalysis(input: RecordRiskAnalysisInput): Promise<string | null> {
  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("risk_ai_analysis")
      .insert({
        organization_id: input.organizationId,
        risk_id: input.riskId,
        provider: input.provider,
        model: input.model,
        summary: input.summary,
        risk_reasoning: input.riskReasoning,
        mitigation_plan: input.mitigationPlan,
        recommended_actions: input.recommendedActions,
        predicted_severity: input.predictedSeverity,
        predicted_score: input.predictedScore,
        confidence: input.confidence,
        tokens_used: input.tokensUsed,
        latency_ms: input.latencyMs,
        metadata: input.metadata ?? {},
      } as never)
      .select("id")
      .single();

    if (error || !data) {
      console.warn("[ai-risks] recordRiskAnalysis failed:", error?.message);
      return null;
    }

    const analysisId = String((data as { id: string }).id);

    await recordRiskAIActivity({
      organizationId: input.organizationId,
      riskId: input.riskId,
      actorUserId: input.actorUserId,
      eventType: "risk.ai_analysis_created",
      message: "AI risk analysis generated",
      metadata: { analysisId, provider: input.provider, confidence: input.confidence },
    });

    await recordRiskAIActivity({
      organizationId: input.organizationId,
      riskId: input.riskId,
      actorUserId: input.actorUserId,
      eventType: "risk.ai_summary_generated",
      message: "AI risk summary generated",
      metadata: { analysisId },
    });

    await recordRiskAIActivity({
      organizationId: input.organizationId,
      riskId: input.riskId,
      actorUserId: input.actorUserId,
      eventType: "risk.ai_mitigation_created",
      message: "AI mitigation plan generated",
      metadata: { analysisId },
    });

    await recordRiskAIActivity({
      organizationId: input.organizationId,
      riskId: input.riskId,
      actorUserId: input.actorUserId,
      eventType: "risk.ai_recommendation_created",
      message: "AI risk recommendations generated",
      metadata: { analysisId },
    });

    return analysisId;
  } catch (error) {
    console.warn("[ai-risks] recordRiskAnalysis failed:", error);
    return null;
  }
}
