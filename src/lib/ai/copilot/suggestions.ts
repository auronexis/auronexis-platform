import type { AIChecklistItem, AISmartSuggestion, ReportAIContext } from "@/lib/ai/types";
import type { ReportAISectionKey } from "@/lib/ai/types";
import { REPORT_AI_SECTION_LABELS } from "@/lib/ai/types";

export function buildSmartSuggestions(context: ReportAIContext): AISmartSuggestion[] {
  const suggestions: AISmartSuggestion[] = [];
  const openRisks = context.metrics?.openRisksCount ?? context.openRisks.length;

  if (openRisks > 0) {
    suggestions.push({
      id: "open-risks",
      message: `You have ${openRisks} unresolved risk${openRisks === 1 ? "" : "s"}. Consider addressing them in Key Risks.`,
    });
  }

  if ((context.slaBreachesCount ?? 0) > 0) {
    suggestions.push({
      id: "sla",
      message: "Consider mentioning SLA improvement or breach remediation in this report.",
    });
  }

  if (context.profitability?.margin != null && context.profitability.margin > 0) {
    suggestions.push({
      id: "margin",
      message: `This client's margin is ${context.profitability.margin}% — consider highlighting profitability in wins.`,
    });
  }

  if (!context.nextActions.trim()) {
    suggestions.push({
      id: "no-actions",
      message: "This report has no next actions — generate recommended follow-ups.",
    });
  }

  if ((context.metrics?.criticalIncidentsCount ?? 0) > 0) {
    suggestions.push({
      id: "critical-incidents",
      message: "Critical incidents are open — ensure the executive summary reflects operational urgency.",
    });
  }

  return suggestions.slice(0, 4);
}

export function buildReportChecklist(
  fieldValues: Record<ReportAISectionKey, string>,
  workspace: {
    clientId: string;
    reportingPeriodStart: string;
    reportingPeriodEnd: string;
  },
): AIChecklistItem[] {
  const has = (section: ReportAISectionKey) => fieldValues[section]?.trim().length > 0;

  const coreComplete =
    has("executive_summary") &&
    has("key_wins") &&
    has("key_risks") &&
    has("next_actions") &&
    has("recommendations");

  return [
    { id: "client", label: "Client selected", complete: Boolean(workspace.clientId) },
    { id: "period", label: "Period selected", complete: Boolean(workspace.reportingPeriodStart && workspace.reportingPeriodEnd) },
    { id: "summary", label: REPORT_AI_SECTION_LABELS.executive_summary, complete: has("executive_summary") },
    { id: "wins", label: REPORT_AI_SECTION_LABELS.key_wins, complete: has("key_wins") },
    { id: "risks", label: REPORT_AI_SECTION_LABELS.key_risks, complete: has("key_risks") },
    { id: "actions", label: REPORT_AI_SECTION_LABELS.next_actions, complete: has("next_actions") },
    { id: "recommendations", label: REPORT_AI_SECTION_LABELS.recommendations, complete: has("recommendations") },
    { id: "publish", label: "Ready to publish", complete: coreComplete && Boolean(workspace.clientId) },
  ];
}
