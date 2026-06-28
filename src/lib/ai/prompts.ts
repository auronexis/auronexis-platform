import type {
  ReportAIActionKey,
  ReportAIContext,
  ReportAISectionKey,
  ReportAIStyleMode,
} from "@/lib/ai/types";
import { REPORT_AI_ACTION_LABELS, REPORT_AI_SECTION_LABELS, REPORT_AI_STYLE_LABELS } from "@/lib/ai/types";
import { inferTargetSection, normalizeAction } from "@/lib/ai/copilot/sections";
import { formatKnowledgeBlock } from "@/lib/ai/knowledge/prompts";

const MISSING_EVENTS =
  "No relevant operational events occurred during this reporting period.";

function sectionContent(context: ReportAIContext, section: ReportAISectionKey): string {
  switch (section) {
    case "executive_summary":
      return context.executiveSummary;
    case "business_summary":
      return context.businessSummary;
    case "key_wins":
      return context.keyWins;
    case "key_risks":
      return context.keyRisks;
    case "next_actions":
      return context.nextActions;
    case "recommendations":
      return context.recommendations;
    case "customer_highlights":
      return context.customerHighlights;
    case "operational_health_summary":
      return context.operationalHealthSummary;
    case "management_summary":
      return context.managementSummary;
    case "customer_email":
      return "";
    case "meeting_agenda":
      return "";
  }
}

function mergeFieldValues(
  context: ReportAIContext,
  fieldOverrides?: Partial<Record<ReportAISectionKey, string>>,
): ReportAIContext {
  if (!fieldOverrides) return context;

  return {
    ...context,
    executiveSummary: fieldOverrides.executive_summary ?? context.executiveSummary,
    businessSummary: fieldOverrides.business_summary ?? context.businessSummary,
    keyWins: fieldOverrides.key_wins ?? context.keyWins,
    keyRisks: fieldOverrides.key_risks ?? context.keyRisks,
    nextActions: fieldOverrides.next_actions ?? context.nextActions,
    recommendations: fieldOverrides.recommendations ?? context.recommendations,
    customerHighlights: fieldOverrides.customer_highlights ?? context.customerHighlights,
    operationalHealthSummary:
      fieldOverrides.operational_health_summary ?? context.operationalHealthSummary,
    managementSummary: fieldOverrides.management_summary ?? context.managementSummary,
  };
}

function formatOpenItems(context: ReportAIContext): string {
  const risks =
    context.openRisks.length === 0
      ? "None listed"
      : context.openRisks.map((r) => `- ${r.title} (${r.severity}, ${r.status})`).join("\n");

  const incidents =
    context.openIncidents.length === 0
      ? "None listed"
      : context.openIncidents.map((i) => `- ${i.title} (${i.severity}, ${i.status})`).join("\n");

  return `Open risks:\n${risks}\n\nOpen incidents:\n${incidents}`;
}

function formatActivity(context: ReportAIContext): string {
  if (!context.recentActivity?.length) {
    return "No recent activity events available.";
  }

  return context.recentActivity
    .slice(0, 8)
    .map((event) => `- ${event.title} (${event.action})`)
    .join("\n");
}

function formatProfitability(context: ReportAIContext): string {
  if (!context.profitability) return "Not available — do not invent financial figures.";

  const { monthlyRevenue, monthlyCost, margin, profit, health } = context.profitability;
  return [
    health ? `Health: ${health}` : null,
    monthlyRevenue != null ? `Monthly revenue: ${monthlyRevenue}` : null,
    monthlyCost != null ? `Monthly cost: ${monthlyCost}` : null,
    profit != null ? `Profit: ${profit}` : null,
    margin != null ? `Margin: ${margin}%` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function styleInstructions(styleMode?: ReportAIStyleMode): string {
  if (!styleMode) return "Use a professional MSP / IT agency executive tone.";

  switch (styleMode) {
    case "executive":
      return "Write for executive stakeholders — outcome-focused, concise, strategic.";
    case "technical":
      return "Use precise technical language suitable for engineers and technical leads.";
    case "customer_friendly":
      return "Use approachable, customer-friendly language without jargon.";
    case "formal":
      return "Use formal business language suitable for contractual reporting.";
    case "concise":
      return "Be concise — short sentences, minimal filler.";
    case "detailed":
      return "Provide detailed narrative with clear structure.";
    default:
      return REPORT_AI_STYLE_LABELS[styleMode]
        ? `Style: ${REPORT_AI_STYLE_LABELS[styleMode]}.`
        : "Use a professional tone.";
  }
}

/** Build a provider-agnostic prompt string — no API call. */
export function buildReportAIPrompt(
  action: ReportAIActionKey,
  context: ReportAIContext,
  section?: ReportAISectionKey,
  fieldOverrides?: Partial<Record<ReportAISectionKey, string>>,
  styleMode?: ReportAIStyleMode,
): string {
  const normalizedAction = normalizeAction(action);
  const mergedContext = mergeFieldValues(context, fieldOverrides);
  const targetSection = section ?? inferTargetSection(normalizedAction);
  const targetLabel = targetSection ? REPORT_AI_SECTION_LABELS[targetSection] : "Full report";
  const targetText = targetSection ? sectionContent(mergedContext, targetSection) : "";

  const lines = [
    "You are an executive report copilot for Auroranexis — an MSP / IT agency operations platform.",
    "",
    "=== User intent ===",
    `Action: ${REPORT_AI_ACTION_LABELS[normalizedAction] ?? REPORT_AI_ACTION_LABELS[action]}`,
    `Target section: ${targetLabel}`,
    styleInstructions(styleMode),
    "",
    "=== Organization ===",
    `Agency: ${mergedContext.organizationName}`,
    "",
    "=== Client ===",
    `Name: ${mergedContext.clientName}`,
    `Report title: ${mergedContext.reportTitle || "(untitled)"}`,
    `Reporting period: ${mergedContext.periodLabel}`,
    mergedContext.assignedEngineer ? `Assigned engineer: ${mergedContext.assignedEngineer}` : null,
    mergedContext.customerHealth ? `Customer health: ${mergedContext.customerHealth}` : null,
    "",
    "=== Current report draft ===",
    `Executive summary:\n${mergedContext.executiveSummary || "(empty)"}`,
    `Business summary:\n${mergedContext.businessSummary || "(empty)"}`,
    `Key wins:\n${mergedContext.keyWins || "(empty)"}`,
    `Key risks:\n${mergedContext.keyRisks || "(empty)"}`,
    `Next actions:\n${mergedContext.nextActions || "(empty)"}`,
    `Recommendations:\n${mergedContext.recommendations || "(empty)"}`,
    "",
    "=== Verified operational context (ONLY use facts listed here) ===",
    formatOpenItems(mergedContext),
  ].filter((line) => line !== null) as string[];

  if (mergedContext.metrics) {
    lines.push(
      "",
      "=== Counts (verified) ===",
      `Open risks: ${mergedContext.metrics.openRisksCount}`,
      `Critical risks: ${mergedContext.metrics.criticalRisksCount}`,
      `Open incidents: ${mergedContext.metrics.openIncidentsCount}`,
      `Critical incidents: ${mergedContext.metrics.criticalIncidentsCount}`,
      `SLA breaches (recent activity): ${mergedContext.slaBreachesCount ?? 0}`,
    );
  }

  lines.push("", "=== Profitability (verified) ===", formatProfitability(mergedContext));

  lines.push("", "=== Recent activity (verified) ===", formatActivity(mergedContext));

  if (mergedContext.knowledgeSnippets?.length) {
    lines.push("", formatKnowledgeBlock(mergedContext.knowledgeSnippets));
  }

  if (mergedContext.previousReportSummary) {
    lines.push(
      "",
      "=== Previous report summary (reference only) ===",
      mergedContext.previousReportSummary,
    );
  } else {
    lines.push("", "=== Previous report summary ===", "No previous report available.");
  }

  if (mergedContext.latestReportVersion) {
    lines.push("", `Latest report version: ${mergedContext.latestReportVersion}`);
  }

  if (mergedContext.templateName) lines.push("", `Template: ${mergedContext.templateName}`);
  if (mergedContext.scheduleTitle) lines.push(`Schedule: ${mergedContext.scheduleTitle}`);

  if (targetSection && targetText) {
    lines.push("", "=== Focus text ===", targetText);
  }

  lines.push(
    "",
    "=== Strict rules ===",
    "- NEVER hallucinate incidents, risks, SLA values, revenue, margins, or client facts.",
    "- ONLY reference risks/incidents explicitly listed above.",
    "- If a section has no relevant verified data, write exactly:",
    `"${MISSING_EVENTS}"`,
    "- Do not invent metrics, percentages, or operational events.",
    "- Return ONLY the content for the target section — no preamble or markdown headings unless in the draft.",
  );

  return lines.join("\n");
}

export function buildReportAIContextFromForm(input: {
  reportId?: string;
  reportTitle: string;
  clientId: string;
  clientName: string;
  organizationName: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  periodLabel: string;
  executiveSummary?: string | null;
  businessSummary?: string | null;
  keyWins?: string | null;
  keyRisks?: string | null;
  nextActions?: string | null;
  recommendations?: string | null;
  customerHighlights?: string | null;
  operationalHealthSummary?: string | null;
  managementSummary?: string | null;
  templateName?: string | null;
  scheduleTitle?: string | null;
  assignedEngineer?: string | null;
  reviewer?: string | null;
  customerHealth?: string | null;
  openRisks?: Array<{ id: string; title: string; severity: string; status: string }>;
  openIncidents?: Array<{ id: string; title: string; severity: string; status: string }>;
  metrics?: ReportAIContext["metrics"];
  profitability?: ReportAIContext["profitability"];
  slaBreachesCount?: number;
  recentActivity?: ReportAIContext["recentActivity"];
  completedReportsCount?: number;
  previousReportSummary?: string | null;
  latestReportVersion?: string | null;
  knowledgeSnippets?: ReportAIContext["knowledgeSnippets"];
}): ReportAIContext {
  return {
    reportId: input.reportId,
    reportTitle: input.reportTitle,
    clientId: input.clientId,
    clientName: input.clientName,
    organizationName: input.organizationName,
    periodLabel: input.periodLabel,
    reportingPeriodStart: input.reportingPeriodStart,
    reportingPeriodEnd: input.reportingPeriodEnd,
    executiveSummary: input.executiveSummary ?? "",
    businessSummary: input.businessSummary ?? "",
    keyWins: input.keyWins ?? "",
    keyRisks: input.keyRisks ?? "",
    nextActions: input.nextActions ?? "",
    recommendations: input.recommendations ?? "",
    customerHighlights: input.customerHighlights ?? "",
    operationalHealthSummary: input.operationalHealthSummary ?? "",
    managementSummary: input.managementSummary ?? "",
    templateName: input.templateName,
    scheduleTitle: input.scheduleTitle,
    assignedEngineer: input.assignedEngineer,
    reviewer: input.reviewer,
    customerHealth: input.customerHealth,
    openRisks: input.openRisks ?? [],
    openIncidents: input.openIncidents ?? [],
    metrics: input.metrics,
    profitability: input.profitability,
    slaBreachesCount: input.slaBreachesCount,
    recentActivity: input.recentActivity,
    completedReportsCount: input.completedReportsCount,
    previousReportSummary: input.previousReportSummary,
    latestReportVersion: input.latestReportVersion,
    knowledgeSnippets: input.knowledgeSnippets,
  };
}

export { inferTargetSection, normalizeAction };
