import type { AppLocale } from "@/lib/i18n";

export type ExecutiveSummaryPromptInput = {
  clientName: string;
  reportTitle: string;
  periodLabel: string;
  organizationLanguage: AppLocale;
  healthScore: string | null;
  healthStatus: string | null;
  slaScore: string | null;
  slaStatus: string | null;
  openRiskSummaries: string[];
  recentIncidentSummaries: string[];
  operationalTrends: string[];
  reportMetrics: string[];
  existingDraftContext: string | null;
  recentActivitySummaries: string[];
};

export function buildExecutiveSummaryPromptInput(input: {
  clientName: string;
  reportTitle: string;
  periodLabel: string;
  organizationLanguage: AppLocale;
  healthScore?: number | null;
  healthStatus?: string | null;
  slaScore?: number | null;
  slaStatus?: string | null;
  openRisks?: Array<{ title: string; severity: string }>;
  openIncidents?: Array<{ title: string; severity: string }>;
  trends?: string[];
  metrics?: string[];
  existingExecutiveSummary?: string | null;
  activity?: Array<{ title: string; action: string }>;
}): ExecutiveSummaryPromptInput {
  return {
    clientName: input.clientName.slice(0, 120),
    reportTitle: input.reportTitle.slice(0, 160),
    periodLabel: input.periodLabel.slice(0, 80),
    organizationLanguage: input.organizationLanguage,
    healthScore: input.healthScore != null ? String(input.healthScore) : null,
    healthStatus: input.healthStatus ?? null,
    slaScore: input.slaScore != null ? String(input.slaScore) : null,
    slaStatus: input.slaStatus ?? null,
    openRiskSummaries: (input.openRisks ?? [])
      .slice(0, 5)
      .map((risk) => `${risk.title} (${risk.severity})`.slice(0, 180)),
    recentIncidentSummaries: (input.openIncidents ?? [])
      .slice(0, 5)
      .map((incident) => `${incident.title} (${incident.severity})`.slice(0, 180)),
    operationalTrends: (input.trends ?? []).slice(0, 5).map((item) => item.slice(0, 180)),
    reportMetrics: (input.metrics ?? []).slice(0, 8).map((item) => item.slice(0, 180)),
    existingDraftContext: input.existingExecutiveSummary?.trim()
      ? input.existingExecutiveSummary.trim().slice(0, 1200)
      : null,
    recentActivitySummaries: (input.activity ?? [])
      .slice(0, 5)
      .map((item) => `${item.title}: ${item.action}`.slice(0, 180)),
  };
}
