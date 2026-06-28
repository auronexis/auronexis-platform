import type {
  AIConfidenceScore,
  AIWarning,
  ReportAIContext,
  ReportAIContextSnapshot,
} from "@/lib/ai/types";

export function buildContextSnapshot(context: ReportAIContext): ReportAIContextSnapshot {
  return {
    clientName: context.clientName,
    organizationName: context.organizationName,
    periodLabel: context.periodLabel,
    openRisksCount: context.metrics?.openRisksCount ?? context.openRisks.length,
    criticalRisksCount: context.metrics?.criticalRisksCount ?? 0,
    openIncidentsCount: context.metrics?.openIncidentsCount ?? context.openIncidents.length,
    criticalIncidentsCount: context.metrics?.criticalIncidentsCount ?? 0,
    slaBreachesCount: context.slaBreachesCount ?? 0,
    hasProfitability: Boolean(
      context.profitability &&
        (context.profitability.monthlyRevenue != null ||
          context.profitability.margin != null ||
          context.profitability.health),
    ),
    hasTemplate: Boolean(context.templateName),
    hasSchedule: Boolean(context.scheduleTitle),
    assignedEngineer: context.assignedEngineer ?? null,
    reviewer: context.reviewer ?? null,
    customerHealth: context.customerHealth ?? null,
    hasPreviousReport: Boolean(context.previousReportSummary),
    completedReportsCount: context.completedReportsCount ?? 0,
    recentActivityCount: context.recentActivity?.length ?? 0,
  };
}

export function calculateConfidence(context: ReportAIContext): AIConfidenceScore {
  let score = 35;

  if (context.clientName) score += 10;
  if (context.reportingPeriodStart && context.reportingPeriodEnd) score += 10;
  if ((context.metrics?.openRisksCount ?? 0) > 0 || context.openRisks.length > 0) score += 8;
  if ((context.metrics?.openIncidentsCount ?? 0) > 0 || context.openIncidents.length > 0) score += 8;
  if (context.profitability?.margin != null || context.profitability?.monthlyRevenue != null) score += 10;
  if (context.previousReportSummary) score += 8;
  if ((context.completedReportsCount ?? 0) > 0) score += 5;
  if ((context.recentActivity?.length ?? 0) > 0) score += 6;
  if (context.templateName) score += 5;
  if (context.assignedEngineer) score += 5;

  const clamped = Math.min(100, Math.max(0, score));
  let label = "Low";

  if (clamped >= 80) label = "High";
  else if (clamped >= 55) label = "Moderate";

  return { score: clamped, label };
}

export function buildAIWarnings(
  context: ReportAIContext,
  workspace: { clientId: string; reportingPeriodStart: string; reportingPeriodEnd: string },
): AIWarning[] {
  const warnings: AIWarning[] = [];

  if (!workspace.clientId) {
    warnings.push({ id: "no-client", message: "No client selected — output quality will be limited." });
  }

  if (!workspace.reportingPeriodStart || !workspace.reportingPeriodEnd) {
    warnings.push({
      id: "no-period",
      message: "Reporting period is not set — the AI cannot anchor content to a timeframe.",
    });
  }

  if (!context.previousReportSummary && (context.completedReportsCount ?? 0) === 0) {
    warnings.push({
      id: "no-history",
      message: "No previous reports for this client — historical continuity is unavailable.",
    });
  }

  if ((context.metrics?.openIncidentsCount ?? 0) === 0 && context.openIncidents.length === 0) {
    warnings.push({
      id: "no-incidents",
      message: "No open incidents in context — incident narratives may be generic.",
    });
  }

  if ((context.metrics?.openRisksCount ?? 0) === 0 && context.openRisks.length === 0) {
    warnings.push({
      id: "no-risks",
      message: "No open risks in context — risk sections may state no relevant events.",
    });
  }

  if (
    !context.profitability ||
    (context.profitability.monthlyRevenue == null && context.profitability.margin == null)
  ) {
    warnings.push({
      id: "no-profitability",
      message: "Profitability data is unavailable — financial claims will be omitted.",
    });
  }

  return warnings;
}
