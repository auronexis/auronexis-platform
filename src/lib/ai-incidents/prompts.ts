import type { IncidentAIContext } from "@/lib/ai-incidents/types";

function formatList(items: string[], emptyLabel: string): string {
  return items.length > 0 ? items.join("\n") : emptyLabel;
}

/** Build the incident analysis system prompt. */
export function buildIncidentAnalysisSystemPrompt(): string {
  return [
    "You are an incident investigation assistant for an MSP/agency operations platform.",
    "Use only the provided verified context. Do not invent facts.",
    "Respond with valid JSON only using this schema:",
    "{",
    '  "summary": "executive summary",',
    '  "rootCause": "possible root cause analysis",',
    '  "recommendations": "recommended actions as bullet list",',
    '  "nextSteps": "immediate next steps",',
    '  "confidence": 0.0-1.0',
    "}",
  ].join("\n");
}

/** Build user prompt from incident context. */
export function buildIncidentAnalysisUserPrompt(context: IncidentAIContext): string {
  const timeline = formatList(
    context.timeline.map((item) => `- ${item.createdAt}: ${item.title}`),
    "- No timeline entries",
  );
  const monitoring = formatList(
    context.monitoringEvents.map((item) => `- [${item.severity}] ${item.message ?? "Event"}`),
    "- No monitoring events",
  );
  const risks = formatList(
    context.relatedRisks.map((item) => `- ${item.title} (${item.severity}, ${item.status})`),
    "- No related risks",
  );
  const activity = formatList(
    context.recentActivity.map((item) => `- ${item.createdAt}: ${item.title}`),
    "- No recent activity",
  );

  return [
    `Incident: ${context.title}`,
    `Severity: ${context.severity}`,
    `Status: ${context.status}`,
    `Client: ${context.clientName ?? "Unknown"}`,
    `Assignee: ${context.assigneeName ?? "Unassigned"}`,
    `Health score: ${context.clientHealthScore ?? "Unknown"}`,
    `SLA breached: ${context.slaBreached ? "Yes" : "No"}`,
    `SLA status: ${context.slaStatus ?? "None"}`,
    "",
    "Description:",
    context.description ?? "(none)",
    "",
    "Resolution notes:",
    context.resolutionNotes ?? "(none)",
    "",
    "Timeline:",
    timeline,
    "",
    "Monitoring events:",
    monitoring,
    "",
    "Related risks:",
    risks,
    "",
    "Recent activity:",
    activity,
  ].join("\n");
}

export function buildIncidentSummaryPrompt(context: IncidentAIContext): string {
  return `Write a concise executive summary for incident "${context.title}" (${context.severity}, ${context.status}).`;
}

export function buildRootCausePrompt(context: IncidentAIContext): string {
  return `Suggest possible root causes for incident "${context.title}" based on timeline and monitoring signals.`;
}

export function buildResolutionPrompt(context: IncidentAIContext): string {
  return `Recommend resolution actions and next steps for incident "${context.title}".`;
}

export function buildSeverityEstimatePrompt(context: IncidentAIContext): string {
  return `Estimate whether severity "${context.severity}" is appropriate for incident "${context.title}". Respond with one line.`;
}
