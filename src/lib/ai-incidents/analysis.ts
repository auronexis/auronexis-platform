import "server-only";

import type {
  IncidentAIAnalysisResult,
  IncidentAIContext,
} from "@/lib/ai-incidents/types";
import {
  buildIncidentAnalysisSystemPrompt,
  buildIncidentAnalysisUserPrompt,
  buildIncidentSummaryPrompt,
  buildRootCausePrompt,
  buildResolutionPrompt,
  buildSeverityEstimatePrompt,
} from "@/lib/ai-incidents/prompts";
import { resolveIncidentAIProvider } from "@/lib/ai-incidents/providers";
import { recordIncidentAnalysis } from "@/lib/ai-incidents/activity";
import { buildIncidentAIContext } from "@/lib/ai-incidents/queries";
import { recordAIUsageEvent } from "@/lib/ai/usage/record";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ReportAIContext } from "@/lib/ai/types";

type ParsedAnalysisPayload = {
  summary: string;
  rootCause: string;
  recommendations: string;
  nextSteps: string;
  confidence: number;
};

function buildMinimalAIContext(context: IncidentAIContext, session: SessionContext): ReportAIContext {
  const now = new Date().toISOString().slice(0, 10);

  return {
    reportTitle: context.title,
    clientId: context.incidentId,
    clientName: context.clientName ?? "Client",
    organizationName: session.organization.name,
    periodLabel: "Incident investigation",
    reportingPeriodStart: now,
    reportingPeriodEnd: now,
    executiveSummary: "",
    businessSummary: "",
    keyWins: "",
    keyRisks: "",
    nextActions: "",
    recommendations: "",
    customerHighlights: "",
    operationalHealthSummary: "",
    managementSummary: "",
    openRisks: context.relatedRisks.map((risk, index) => ({
      id: `risk-${index}`,
      title: risk.title,
      severity: risk.severity,
      status: risk.status,
    })),
    openIncidents: [
      {
        id: context.incidentId,
        title: context.title,
        severity: context.severity,
        status: context.status,
      },
    ],
  };
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, value));
}

function buildMockAnalysis(context: IncidentAIContext): ParsedAnalysisPayload {
  const monitoringNote =
    context.monitoringEvents.length > 0
      ? ` Monitoring reported ${context.monitoringEvents.length} related signal(s).`
      : "";

  return {
    summary: `${context.title} is ${context.status} with ${context.severity} severity for ${context.clientName ?? "the client"}.${monitoringNote}`,
    rootCause: context.slaBreached
      ? "Possible SLA breach or delayed response contributed to operational impact."
      : "Preliminary review suggests configuration drift or upstream dependency instability.",
    recommendations: [
      "Validate recent changes affecting the affected client systems.",
      "Review monitoring signals and linked risks for correlated failures.",
      "Confirm SLA timers and assign clear ownership for next actions.",
    ].join("\n"),
    nextSteps: "Document findings, notify stakeholders, and schedule a follow-up health check.",
    confidence: context.monitoringEvents.length > 0 ? 0.78 : 0.62,
  };
}

function parseAnalysisResponse(content: string, context: IncidentAIContext): ParsedAnalysisPayload {
  try {
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1)) as Partial<ParsedAnalysisPayload>;
      if (parsed.summary && parsed.rootCause && parsed.recommendations) {
        return {
          summary: parsed.summary,
          rootCause: parsed.rootCause,
          recommendations: parsed.recommendations,
          nextSteps: parsed.nextSteps ?? "Review and execute recommended actions.",
          confidence: clampConfidence(Number(parsed.confidence ?? 0.7)),
        };
      }
    }
  } catch {
    // fall through to mock parsing
  }

  return buildMockAnalysis(context);
}

/** Generate executive summary text from context. */
export function generateIncidentSummary(context: IncidentAIContext): string {
  return buildIncidentSummaryPrompt(context);
}

/** Generate root cause suggestions from context. */
export function generateRootCauseSuggestions(context: IncidentAIContext): string {
  return buildRootCausePrompt(context);
}

/** Generate resolution suggestions from context. */
export function generateResolutionSuggestions(context: IncidentAIContext): string {
  return buildResolutionPrompt(context);
}

/** Estimate incident severity appropriateness. */
export function estimateIncidentSeverity(context: IncidentAIContext): string {
  return buildSeverityEstimatePrompt(context);
}

/** Run full incident analysis — never throws. */
export async function analyzeIncident(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentAIAnalysisResult | null> {
  try {
    const context = await buildIncidentAIContext(session, incidentId);
    if (!context) {
      return null;
    }

    const resolved = resolveIncidentAIProvider();
    if (resolved.disabled || !resolved.provider) {
      return null;
    }

    const started = Date.now();
    let parsed: ParsedAnalysisPayload;
    let tokensUsed: number | null = null;
    let isMock = resolved.providerName === "Mock" || resolved.providerName === "Anthropic";

    if (resolved.providerName === "Mock" || resolved.providerName === "Anthropic") {
      parsed = buildMockAnalysis(context);
    } else {
      const response = await resolved.provider.generate({
        prompt: `${buildIncidentAnalysisSystemPrompt()}\n\n${buildIncidentAnalysisUserPrompt(context)}`,
        action: "generate_entire_report",
        context: buildMinimalAIContext(context, session),
      });

      parsed = parseAnalysisResponse(response.content, context);
      tokensUsed =
        (response.usage?.promptTokens ?? 0) + (response.usage?.completionTokens ?? 0) || null;
      isMock = Boolean(response.isPlaceholder);
    }

    const latencyMs = Date.now() - started;
    const result: IncidentAIAnalysisResult = {
      summary: parsed.summary,
      rootCause: parsed.rootCause,
      recommendations: parsed.recommendations,
      nextSteps: parsed.nextSteps,
      confidence: parsed.confidence,
      provider: resolved.providerName,
      model: resolved.model,
      tokensUsed,
      latencyMs,
      isMock,
    };

    await recordIncidentAnalysis({
      organizationId: session.organization.id,
      incidentId,
      provider: result.provider,
      model: result.model,
      summary: result.summary,
      rootCause: result.rootCause,
      recommendations: result.recommendations,
      confidence: result.confidence,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
      metadata: { nextSteps: result.nextSteps, isMock: result.isMock },
      actorUserId: session.user.id,
    });

    await recordAIUsageEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      feature: "ai_incident_assistant",
      provider: resolved.providerName.toLowerCase(),
      model: result.model,
      totalTokens: result.tokensUsed,
    }).catch(() => undefined);

    return result;
  } catch (error) {
    console.warn("[ai-incidents] analyzeIncident failed:", error);
    return null;
  }
}
