import type {
  IncidentAIActionKey,
  OperationalAIActionKey,
  OperationalAIContext,
  OperationalEntityType,
  OperationalFieldKey,
  RiskAIActionKey,
} from "@/lib/ai/operational/types";
import {
  INCIDENT_AI_ACTION_LABELS,
  RISK_AI_ACTION_LABELS,
} from "@/lib/ai/operational/types";
import { formatKnowledgeBlock } from "@/lib/ai/knowledge/prompts";

const ROOT_CAUSE_UNKNOWN = "Root cause cannot yet be determined.";

export function inferOperationalTargetField(
  action: OperationalAIActionKey,
): OperationalFieldKey | null {
  switch (action) {
    case "summarize_risk":
    case "improve_description":
    case "summarize_incident":
    case "generate_investigation_notes":
      return "description";
    case "generate_mitigation_plan":
    case "generate_recommended_actions":
    case "generate_resolution_notes":
      return "resolution_notes";
    default:
      return null;
  }
}

export function buildOperationalAIPrompt(
  action: OperationalAIActionKey,
  context: OperationalAIContext,
  fieldOverrides?: Partial<Record<OperationalFieldKey, string>>,
): string {
  const description = fieldOverrides?.description ?? context.description;
  const resolutionNotes = fieldOverrides?.resolution_notes ?? context.resolutionNotes;
  const label =
    context.entityType === "risk"
      ? RISK_AI_ACTION_LABELS[action as RiskAIActionKey]
      : INCIDENT_AI_ACTION_LABELS[action as IncidentAIActionKey];

  const openRisks =
    context.openRisks.length === 0
      ? "None"
      : context.openRisks.map((r) => `- ${r.title} (${r.severity}, ${r.status})`).join("\n");
  const openIncidents =
    context.openIncidents.length === 0
      ? "None"
      : context.openIncidents.map((i) => `- ${i.title} (${i.severity}, ${i.status})`).join("\n");
  const activity =
    context.recentActivity.length === 0
      ? "No recent activity."
      : context.recentActivity.map((e) => `- ${e.title} (${e.action})`).join("\n");
  const reports =
    context.relatedReports.length === 0
      ? "None"
      : context.relatedReports.map((r) => `- ${r.title} (${r.status})`).join("\n");

  const modeInstructions = buildModeInstructions(action, context.entityType);

  return [
    "You are an operational copilot for Auroranexis — an MSP / IT agency platform.",
    "",
    "=== User intent ===",
    `Action: ${label}`,
    `Entity: ${context.entityType}`,
    "",
    "=== Verified entity ===",
    `Title: ${context.title || "(untitled)"}`,
    `Client: ${context.clientName}`,
    `Severity: ${context.severity}`,
    `Status: ${context.status}`,
    `Assignee: ${context.assigneeName ?? "Unassigned"}`,
    `Created: ${context.createdAt}`,
    `Updated: ${context.updatedAt}`,
    context.dueDate ? `Due: ${context.dueDate}` : null,
    context.linkedRiskTitle ? `Linked risk: ${context.linkedRiskTitle}` : null,
    "",
    "=== Current text ===",
    `Description:\n${description || "(empty)"}`,
    `Resolution / mitigation notes:\n${resolutionNotes || "(empty)"}`,
    "",
    "=== Verified client context ===",
    `Open risks (${context.openRisksCount}):\n${openRisks}`,
    `Open incidents (${context.openIncidentsCount}):\n${openIncidents}`,
    `SLA policy: ${context.slaPolicyName ?? "None"}`,
    `SLA breached: ${context.slaBreached ? "Yes" : "No"}`,
    context.customerHealth ? `Customer health: ${context.customerHealth}` : null,
    context.profitabilityMargin != null ? `Client margin: ${context.profitabilityMargin}%` : null,
    "",
    "=== Related reports ===",
    reports,
    "",
    "=== Recent activity ===",
    activity,
    "",
    ...(context.knowledgeSnippets?.length
      ? [formatKnowledgeBlock(context.knowledgeSnippets), ""]
      : []),
    "=== Mode instructions ===",
    modeInstructions,
    "",
    "=== Strict rules ===",
    "- NEVER invent incidents, risks, SLA values, root causes, or financial data.",
    "- ONLY use facts listed above.",
    "- If evidence is insufficient for root cause, state exactly:",
    `"${ROOT_CAUSE_UNKNOWN}"`,
    "- For estimate_priority: advisory only — do not change stored severity.",
    "- Return ONLY the requested content — no preamble unless the mode requires sections.",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildModeInstructions(action: OperationalAIActionKey, entityType: OperationalEntityType): string {
  if (action === "generate_root_cause_analysis") {
    return [
      "Structure output as:",
      "Possible Root Cause:",
      "Possible Contributing Factors:",
      "Investigation Checklist:",
      "Unknown Information:",
      "Recommended Validation Steps:",
      "If insufficient evidence, state root cause cannot yet be determined.",
    ].join("\n");
  }

  if (action === "generate_mitigation_plan") {
    return [
      "Structure output as:",
      "Immediate Actions:",
      "Short-term Actions:",
      "Long-term Actions:",
      "Monitoring Suggestions:",
      "Owner Recommendations:",
      "Priority:",
      "Dependencies:",
    ].join("\n");
  }

  if (action === "generate_resolution_notes") {
    return [
      "Structure as professional resolution notes:",
      "Issue:",
      "Cause:",
      "Resolution:",
      "Verification:",
      "Next Monitoring Steps:",
    ].join("\n");
  }

  if (action === "estimate_priority") {
    return "Provide advisory Likelihood, Impact, Priority, Confidence, and Reasoning. Do not overwrite stored severity.";
  }

  if (action === "generate_customer_update") {
    return "Write a customer-facing status update — professional, reassuring, no internal jargon.";
  }

  if (action === "generate_internal_update") {
    return "Write an internal team update — technical, actionable.";
  }

  if (action === "executive_explanation") {
    return "Explain for executive stakeholders — outcome-focused.";
  }

  if (action === "technical_explanation") {
    return "Explain for engineers — precise and technical.";
  }

  if (action === "customer_friendly_explanation") {
    return "Explain for the customer — approachable, no jargon.";
  }

  if (action === "generate_timeline_summary") {
    return "Summarize timeline, major events, actions taken, current state, outstanding actions from verified activity only.";
  }

  return `Generate ${entityType} copilot content using verified context only.`;
}
