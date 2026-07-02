import type { RiskAIContext } from "@/lib/ai-risks/types";

function formatList(items: string[], emptyLabel: string): string {
  return items.length > 0 ? items.join("\n") : emptyLabel;
}

/** Build the risk analysis system prompt. */
export function buildRiskAnalysisSystemPrompt(): string {
  return [
    "You are a client risk analyst for an MSP/agency operations platform.",
    "Use only the provided verified context. Do not invent facts.",
    "Respond with valid JSON only using this schema:",
    "{",
    '  "summary": "executive risk summary",',
    '  "riskReasoning": "why this risk matters",',
    '  "mitigationPlan": "mitigation plan text",',
    '  "recommendedActions": ["action 1", "action 2"],',
    '  "predictedSeverity": "low|medium|high|critical",',
    '  "predictedScore": 1-25,',
    '  "confidence": 0.0-1.0',
    "}",
  ].join("\n");
}

/** Build user prompt from risk context. */
export function buildRiskAnalysisUserPrompt(context: RiskAIContext): string {
  const timeline = formatList(
    context.timeline.map((item) => `- ${item.createdAt}: ${item.title}`),
    "- No timeline entries",
  );
  const monitoring = formatList(
    context.monitoringEvents.map((item) => `- [${item.severity}] ${item.message ?? "Event"}`),
    "- No monitoring events",
  );
  const incidents = formatList(
    context.relatedIncidents.map((item) => `- ${item.title} (${item.severity}, ${item.status})`),
    "- No related incidents",
  );
  const activity = formatList(
    context.recentActivity.map((item) => `- ${item.createdAt}: ${item.title}`),
    "- No recent activity",
  );
  const reports = formatList(
    context.recentReports.map((item) => `- ${item.title} (${item.status})`),
    "- No recent reports",
  );

  return [
    `Risk: ${context.title}`,
    `Severity: ${context.severity}`,
    `Status: ${context.status}`,
    `Likelihood: ${context.likelihood ?? "Unknown"}`,
    `Impact score: ${context.impactScore ?? "Unknown"}`,
    `Risk score: ${context.riskScore ?? "Unknown"}`,
    `Client: ${context.clientName ?? "Unknown"}`,
    `Health score: ${context.clientHealthScore ?? "Unknown"}`,
    `Health status: ${context.clientHealthStatus ?? "Unknown"}`,
    `SLA breaches: ${context.slaBreaches}`,
    "",
    "Description:",
    context.description ?? "(none)",
    "",
    "Existing mitigation plan:",
    context.mitigationPlan ?? context.recommendation ?? "(none)",
    "",
    "Timeline:",
    timeline,
    "",
    "Monitoring events:",
    monitoring,
    "",
    "Related incidents:",
    incidents,
    "",
    "Recent activity:",
    activity,
    "",
    "Recent reports:",
    reports,
  ].join("\n");
}

export function buildRiskSummaryPrompt(context: RiskAIContext): string {
  return `Write a concise executive summary for risk "${context.title}" (${context.severity}, score ${context.riskScore ?? "unknown"}).`;
}

export function buildRiskReasoningPrompt(context: RiskAIContext): string {
  return `Explain why risk "${context.title}" matters for ${context.clientName ?? "this client"}.`;
}

export function buildMitigationPlanPrompt(context: RiskAIContext): string {
  return `Draft a mitigation plan for risk "${context.title}" considering current status ${context.status}.`;
}

export function buildRecommendedActionsPrompt(context: RiskAIContext): string {
  return `List recommended next actions to reduce risk "${context.title}".`;
}

export function buildPredictedSeverityPrompt(context: RiskAIContext): string {
  return `Predict the most appropriate severity for risk "${context.title}" given score ${context.riskScore ?? "unknown"}.`;
}

export function buildPredictedScorePrompt(context: RiskAIContext): string {
  return `Predict an updated risk score (1-25) for "${context.title}" based on likelihood ${context.likelihood ?? "?"} and impact ${context.impactScore ?? "?"}.`;
}
