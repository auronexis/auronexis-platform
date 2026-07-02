import "server-only";

import type { RiskAIAnalysisResult, RiskAIContext } from "@/lib/ai-risks/types";
import {
  buildMitigationPlanPrompt,
  buildPredictedScorePrompt,
  buildPredictedSeverityPrompt,
  buildRecommendedActionsPrompt,
  buildRiskAnalysisSystemPrompt,
  buildRiskAnalysisUserPrompt,
  buildRiskReasoningPrompt,
  buildRiskSummaryPrompt,
} from "@/lib/ai-risks/prompts";
import { resolveRiskAIProvider } from "@/lib/ai-risks/providers";
import { recordRiskAnalysis } from "@/lib/ai-risks/activity";
import { buildRiskAIContext } from "@/lib/ai-risks/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ReportAIContext } from "@/lib/ai/types";

type ParsedRiskAnalysisPayload = {
  summary: string;
  riskReasoning: string;
  mitigationPlan: string;
  recommendedActions: string[];
  predictedSeverity: string;
  predictedScore: number;
  confidence: number;
};

function buildMinimalAIContext(context: RiskAIContext, session: SessionContext): ReportAIContext {
  const now = new Date().toISOString().slice(0, 10);

  return {
    reportTitle: context.title,
    clientId: context.riskId,
    clientName: context.clientName ?? "Client",
    organizationName: session.organization.name,
    periodLabel: "Risk assessment",
    reportingPeriodStart: now,
    reportingPeriodEnd: now,
    executiveSummary: "",
    businessSummary: "",
    keyWins: "",
    keyRisks: context.title,
    nextActions: "",
    recommendations: context.recommendation ?? "",
    customerHighlights: "",
    operationalHealthSummary: context.clientHealthStatus ?? "",
    managementSummary: "",
    openRisks: [
      {
        id: context.riskId,
        title: context.title,
        severity: context.severity,
        status: context.status,
      },
    ],
    openIncidents: context.relatedIncidents.map((incident, index) => ({
      id: `incident-${index}`,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
    })),
  };
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, value));
}

function clampScore(value: number, fallback: number | null): number {
  if (Number.isNaN(value)) {
    return fallback ?? 10;
  }

  return Math.max(1, Math.min(25, Math.round(value)));
}

function buildMockAnalysis(context: RiskAIContext): ParsedRiskAnalysisPayload {
  const monitoringNote =
    context.monitoringEvents.length > 0
      ? ` ${context.monitoringEvents.length} monitoring signal(s) correlate with this risk.`
      : "";
  const incidentNote =
    context.relatedIncidents.length > 0
      ? ` ${context.relatedIncidents.length} open incident(s) may amplify impact.`
      : "";
  const slaNote =
    context.slaBreaches > 0
      ? ` ${context.slaBreaches} SLA breach(es) increase operational urgency.`
      : "";

  const predictedScore = clampScore(
    (context.riskScore ?? 10) + (context.slaBreaches > 0 ? 2 : 0),
    context.riskScore,
  );

  return {
    summary: `${context.title} is ${context.status} with ${context.severity} severity for ${context.clientName ?? "the client"}.${monitoringNote}${incidentNote}`,
    riskReasoning: `This risk matters because it affects client health (${context.clientHealthScore ?? "unknown"} score) and operational stability.${slaNote} Likelihood ${context.likelihood ?? "unknown"} with impact ${context.impactScore ?? "unknown"} suggests sustained exposure if unaddressed.`,
    mitigationPlan: [
      "Validate current controls and confirm ownership for remediation.",
      "Review correlated monitoring events and linked incidents for root patterns.",
      "Update mitigation steps and set a follow-up review checkpoint.",
    ].join("\n"),
    recommendedActions: [
      "Assign or confirm risk owner accountability.",
      "Prioritize mitigation tasks based on predicted severity and score.",
      "Document decisions and notify stakeholders if client health is declining.",
    ],
    predictedSeverity:
      predictedScore >= 20 ? "critical" : predictedScore >= 15 ? "high" : context.severity,
    predictedScore,
    confidence:
      context.monitoringEvents.length > 0 || context.relatedIncidents.length > 0 ? 0.76 : 0.64,
  };
}

function parseAnalysisResponse(content: string, context: RiskAIContext): ParsedRiskAnalysisPayload {
  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1)) as Partial<ParsedRiskAnalysisPayload>;
      if (parsed.summary && parsed.riskReasoning && parsed.mitigationPlan) {
        const actions = Array.isArray(parsed.recommendedActions)
          ? parsed.recommendedActions.map((item) => String(item))
          : [];

        return {
          summary: parsed.summary,
          riskReasoning: parsed.riskReasoning,
          mitigationPlan: parsed.mitigationPlan,
          recommendedActions:
            actions.length > 0
              ? actions
              : ["Review mitigation plan", "Confirm ownership and next review date"],
          predictedSeverity: parsed.predictedSeverity ?? context.severity,
          predictedScore: clampScore(Number(parsed.predictedScore ?? context.riskScore ?? 10), context.riskScore),
          confidence: clampConfidence(Number(parsed.confidence ?? 0.7)),
        };
      }
    }
  } catch {
    // fall through to mock parsing
  }

  return buildMockAnalysis(context);
}

/** Generate executive risk summary text from context. */
export function generateRiskSummary(context: RiskAIContext): string {
  return buildRiskSummaryPrompt(context);
}

/** Generate risk reasoning text from context. */
export function generateRiskReasoning(context: RiskAIContext): string {
  return buildRiskReasoningPrompt(context);
}

/** Generate mitigation plan text from context. */
export function generateMitigationPlan(context: RiskAIContext): string {
  return buildMitigationPlanPrompt(context);
}

/** Generate recommended actions from context. */
export function generateRecommendedActions(context: RiskAIContext): string {
  return buildRecommendedActionsPrompt(context);
}

/** Predict risk severity from context. */
export function predictRiskSeverity(context: RiskAIContext): string {
  return buildPredictedSeverityPrompt(context);
}

/** Predict risk score from context. */
export function predictRiskScore(context: RiskAIContext): string {
  return buildPredictedScorePrompt(context);
}

/** Run full risk analysis — never throws. */
export async function analyzeRisk(
  session: SessionContext,
  riskId: string,
): Promise<RiskAIAnalysisResult | null> {
  try {
    const context = await buildRiskAIContext(session, riskId);
    if (!context) {
      return null;
    }

    const resolved = resolveRiskAIProvider();
    if (resolved.disabled || !resolved.provider) {
      return null;
    }

    const started = Date.now();
    let parsed: ParsedRiskAnalysisPayload;
    let tokensUsed: number | null = null;
    let isMock = resolved.providerName === "Mock" || resolved.providerName === "Anthropic";

    if (resolved.providerName === "Mock" || resolved.providerName === "Anthropic") {
      parsed = buildMockAnalysis(context);
    } else {
      const response = await resolved.provider.generate({
        prompt: `${buildRiskAnalysisSystemPrompt()}\n\n${buildRiskAnalysisUserPrompt(context)}`,
        action: "generate_entire_report",
        context: buildMinimalAIContext(context, session),
      });

      parsed = parseAnalysisResponse(response.content, context);
      tokensUsed =
        (response.usage?.promptTokens ?? 0) + (response.usage?.completionTokens ?? 0) || null;
      isMock = Boolean(response.isPlaceholder);
    }

    const latencyMs = Date.now() - started;
    const result: RiskAIAnalysisResult = {
      summary: parsed.summary,
      riskReasoning: parsed.riskReasoning,
      mitigationPlan: parsed.mitigationPlan,
      recommendedActions: parsed.recommendedActions,
      predictedSeverity: parsed.predictedSeverity,
      predictedScore: parsed.predictedScore,
      confidence: parsed.confidence,
      provider: resolved.providerName,
      model: resolved.model,
      tokensUsed,
      latencyMs,
      isMock,
    };

    await recordRiskAnalysis({
      organizationId: session.organization.id,
      riskId,
      provider: result.provider,
      model: result.model,
      summary: result.summary,
      riskReasoning: result.riskReasoning,
      mitigationPlan: result.mitigationPlan,
      recommendedActions: result.recommendedActions,
      predictedSeverity: result.predictedSeverity,
      predictedScore: result.predictedScore,
      confidence: result.confidence,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      metadata: { isMock: result.isMock },
      actorUserId: session.user.id,
    });

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_risk_assistant",
      provider: resolved.providerName.toLowerCase(),
      model: result.model,
      totalTokens: result.tokensUsed,
    }).catch(() => undefined);

    return result;
  } catch (error) {
    console.warn("[ai-risks] analyzeRisk failed:", error);
    return null;
  }
}
