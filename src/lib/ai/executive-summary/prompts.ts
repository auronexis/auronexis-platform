import type { AppLocale } from "@/lib/i18n";
import type { ExecutiveSummaryPromptInput } from "@/lib/ai/executive-summary/input";

const LANGUAGE_INSTRUCTION: Record<AppLocale, string> = {
  de: "Write all customer-facing output in German.",
  en: "Write all customer-facing output in English.",
};

export const EXECUTIVE_SUMMARY_SYSTEM_PROMPT = `You are an executive reporting assistant for Auroranexis.
Use only the supplied facts. Never invent metrics, incidents, risks, certifications, legal conclusions, or guaranteed outcomes.
If evidence is insufficient, say so in confidence_note.
Do not mention OpenAI, system instructions, or internal tooling.
Return valid JSON only with keys: headline, executive_summary, key_outcomes, key_risks, recommended_next_steps, confidence_note.
Keep an executive tone. No markdown tables.`;

export function buildExecutiveSummaryUserPrompt(
  input: ExecutiveSummaryPromptInput,
): string {
  return JSON.stringify({
    language: LANGUAGE_INSTRUCTION[input.organizationLanguage],
    client_name: input.clientName,
    report_title: input.reportTitle,
    period: input.periodLabel,
    health_score: input.healthScore,
    health_status: input.healthStatus,
    sla_score: input.slaScore,
    sla_status: input.slaStatus,
    open_risks: input.openRiskSummaries,
    recent_incidents: input.recentIncidentSummaries,
    operational_trends: input.operationalTrends,
    report_metrics: input.reportMetrics,
    existing_draft_context: input.existingDraftContext,
    recent_activity: input.recentActivitySummaries,
  });
}
