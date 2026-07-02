import type { IncidentAIReportSnapshot } from "@/lib/ai-incidents/types";
import type { RiskAIReportSnapshot } from "@/lib/ai-risks/types";
import type { ExecutiveReportContent, ExecutiveReportMetadata } from "@/lib/executive-reports/types";
import type { HealthTrend, ReportMetrics, SLASnapshot } from "@/lib/reports-v2/types";

type ExecutiveSummaryInput = {
  metrics: ReportMetrics;
  healthTrend: HealthTrend;
  slaSnapshot: SLASnapshot;
  monitoringSnapshot?: {
    connectorCount: number;
    failures: number;
    recoveries: number;
    healthImpactEvents: number;
  } | null;
  incidentAISnapshot?: IncidentAIReportSnapshot | null;
  riskAISnapshot?: RiskAIReportSnapshot | null;
  complianceScore?: number | null;
  timeline?: Array<{ title: string; created_at: string }>;
};

function formatDelta(delta: number | null): string {
  if (delta == null || delta === 0) {
    return "unchanged";
  }

  return delta > 0 ? `+${delta}` : `${delta}`;
}

/** Build risk-focused executive summary text. */
export function buildRiskExecutiveSummary(input: ExecutiveSummaryInput): string {
  const parts: string[] = [];

  if (input.metrics.openRisks > 0) {
    parts.push(`${input.metrics.openRisks} open risk${input.metrics.openRisks === 1 ? "" : "s"} require attention.`);
  } else {
    parts.push("No open risks detected for this client.");
  }

  if (input.riskAISnapshot?.summary) {
    parts.push(input.riskAISnapshot.summary);
  }

  if (input.riskAISnapshot?.topMitigationRecommendations.length) {
    parts.push(
      `Priority mitigations: ${input.riskAISnapshot.topMitigationRecommendations.slice(0, 3).join("; ")}.`,
    );
  }

  return parts.join(" ") || "Risk posture is stable for this reporting period.";
}

/** Build incident-focused executive summary text. */
export function buildIncidentExecutiveSummary(input: ExecutiveSummaryInput): string {
  const parts: string[] = [];

  if (input.metrics.openIncidents > 0) {
    parts.push(
      `${input.metrics.openIncidents} open incident${input.metrics.openIncidents === 1 ? "" : "s"} remain active.`,
    );
  } else {
    parts.push("No open incidents for this client.");
  }

  if (input.incidentAISnapshot?.summary) {
    parts.push(input.incidentAISnapshot.summary);
  }

  if (input.incidentAISnapshot?.rootCause) {
    parts.push(`Primary concern: ${input.incidentAISnapshot.rootCause}`);
  }

  return parts.join(" ") || "Incident volume is within normal operating bounds.";
}

/** Build SLA executive summary text. */
export function buildSLAExecutiveSummary(input: ExecutiveSummaryInput): string {
  const { slaSnapshot } = input;

  if (slaSnapshot.violations === 0) {
    return `SLA compliance is on track${slaSnapshot.score != null ? ` at ${slaSnapshot.score}%` : ""}. No breaches detected in this period.`;
  }

  return `${slaSnapshot.violations} SLA breach${slaSnapshot.violations === 1 ? "" : "es"} detected. Compliance score${slaSnapshot.score != null ? ` is ${slaSnapshot.score}%` : " requires review"}. Response and resolution targets should be prioritized.`;
}

/** Build monitoring executive summary text. */
export function buildMonitoringExecutiveSummary(input: ExecutiveSummaryInput): string {
  const monitoring = input.monitoringSnapshot;

  if (!monitoring || monitoring.connectorCount === 0) {
    return "No active monitoring connectors configured for this client.";
  }

  const parts = [
    `${monitoring.connectorCount} monitoring connector${monitoring.connectorCount === 1 ? "" : "s"} active.`,
  ];

  if (monitoring.failures > 0) {
    parts.push(`${monitoring.failures} failure${monitoring.failures === 1 ? "" : "s"} recorded.`);
  }

  if (monitoring.recoveries > 0) {
    parts.push(`${monitoring.recoveries} recovery event${monitoring.recoveries === 1 ? "" : "s"}.`);
  }

  if (monitoring.healthImpactEvents > 0) {
    parts.push(`${monitoring.healthImpactEvents} event${monitoring.healthImpactEvents === 1 ? "" : "s"} impacted client health.`);
  }

  return parts.join(" ");
}

/** Build combined AI insights summary with fallback when assistants are disabled. */
export function buildAISummary(input: ExecutiveSummaryInput): string {
  const parts: string[] = [];
  const confidences: number[] = [];

  if (input.incidentAISnapshot?.summary) {
    parts.push(`Incident AI: ${input.incidentAISnapshot.summary}`);
    if (input.incidentAISnapshot.confidence != null) {
      confidences.push(input.incidentAISnapshot.confidence);
    }
  }

  if (input.riskAISnapshot?.summary) {
    parts.push(`Risk AI: ${input.riskAISnapshot.summary}`);
    if (input.riskAISnapshot.confidence != null) {
      confidences.push(input.riskAISnapshot.confidence);
    }
  }

  if (parts.length === 0) {
    return "AI assistants did not produce insights for this period. Operational summaries above reflect verified platform data.";
  }

  if (confidences.length > 0) {
    const avg = confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
    parts.push(`Average AI confidence: ${Math.round(avg * 100)}%.`);
  }

  return parts.join(" ");
}

function buildTopConcerns(input: ExecutiveSummaryInput): string[] {
  const concerns: string[] = [];

  if (input.metrics.openRisks > 0) {
    concerns.push(`${input.metrics.openRisks} open risks`);
  }
  if (input.metrics.openIncidents > 0) {
    concerns.push(`${input.metrics.openIncidents} open incidents`);
  }
  if (input.slaSnapshot.violations > 0) {
    concerns.push(`${input.slaSnapshot.violations} SLA breach${input.slaSnapshot.violations === 1 ? "" : "es"}`);
  }
  if (input.monitoringSnapshot && input.monitoringSnapshot.failures > 0) {
    concerns.push(`${input.monitoringSnapshot.failures} monitoring failure${input.monitoringSnapshot.failures === 1 ? "" : "s"}`);
  }
  if (input.riskAISnapshot?.predictedSeverity === "critical") {
    concerns.push("AI flagged critical risk severity");
  }

  return concerns.slice(0, 5);
}

function buildPositiveDevelopments(input: ExecutiveSummaryInput): string[] {
  const positives: string[] = [];

  if (input.healthTrend.delta != null && input.healthTrend.delta > 0) {
    positives.push(`Health improved ${formatDelta(input.healthTrend.delta)} points`);
  }
  if (input.slaSnapshot.violations === 0) {
    positives.push("SLA compliance maintained");
  }
  if (input.monitoringSnapshot && input.monitoringSnapshot.recoveries > 0) {
    positives.push(`${input.monitoringSnapshot.recoveries} monitoring recoveries`);
  }
  if (input.metrics.openRisks === 0 && input.metrics.openIncidents === 0) {
    positives.push("No open risks or incidents");
  }
  if (input.complianceScore != null && input.complianceScore >= 80) {
    positives.push(`Compliance readiness at ${input.complianceScore}%`);
  }

  return positives.slice(0, 5);
}

function buildSuggestedPriorities(input: ExecutiveSummaryInput): string[] {
  const priorities: string[] = [];

  if (input.metrics.openIncidents > 0) {
    priorities.push("Resolve open incidents and confirm stakeholder communication.");
  }
  if (input.metrics.openRisks > 0) {
    priorities.push("Review high-severity risks and confirm mitigation ownership.");
  }
  if (input.slaSnapshot.violations > 0) {
    priorities.push("Address SLA breaches and review response workflows.");
  }
  if (input.riskAISnapshot?.topMitigationRecommendations.length) {
    priorities.push(...input.riskAISnapshot.topMitigationRecommendations.slice(0, 2));
  }
  if (input.incidentAISnapshot?.suggestedImprovements) {
    priorities.push(input.incidentAISnapshot.suggestedImprovements);
  }

  if (priorities.length === 0) {
    priorities.push("Maintain current operational cadence and schedule next executive review.");
  }

  return priorities.slice(0, 5);
}

function buildTrendAnalysis(input: ExecutiveSummaryInput): string {
  const parts: string[] = [];

  if (input.healthTrend.current != null) {
    if (input.healthTrend.previous != null && input.healthTrend.delta != null) {
      parts.push(
        `Health moved from ${input.healthTrend.previous} to ${input.healthTrend.current} (${formatDelta(input.healthTrend.delta)}).`,
      );
    } else {
      parts.push(`Current health score is ${input.healthTrend.current}.`);
    }
  }

  if (input.metrics.activityTrendPercent != null) {
    const direction =
      input.metrics.activityTrendPercent > 0
        ? "increased"
        : input.metrics.activityTrendPercent < 0
          ? "decreased"
          : "remained stable";
    parts.push(
      `Activity volume ${direction}${input.metrics.activityTrendPercent === 0 ? "" : ` ${Math.abs(input.metrics.activityTrendPercent)}%`} versus the prior period.`,
    );
  }

  return parts.join(" ") || "Trend data is limited for this reporting period.";
}

function buildExecutiveRecommendations(input: ExecutiveSummaryInput): string[] {
  const recommendations: string[] = [];

  recommendations.push(...buildSuggestedPriorities(input));

  if (input.complianceScore != null && input.complianceScore < 80) {
    recommendations.push("Improve compliance readiness with policy and retention coverage.");
  }

  if (input.monitoringSnapshot && input.monitoringSnapshot.connectorCount === 0) {
    recommendations.push("Enable monitoring connectors for proactive signal detection.");
  }

  return [...new Set(recommendations)].slice(0, 6);
}

/** Compose the top-level executive summary paragraph. */
export function generateExecutiveSummary(input: ExecutiveSummaryInput): string {
  const parts: string[] = [];

  if (input.healthTrend.current != null) {
    parts.push(`Client health score is ${input.healthTrend.current}${input.healthTrend.status ? ` (${input.healthTrend.status})` : ""}.`);
  }

  parts.push(buildSLAExecutiveSummary(input));
  parts.push(buildTrendAnalysis(input));

  const concerns = buildTopConcerns(input);
  if (concerns.length > 0) {
    parts.push(`Top concerns: ${concerns.join(", ")}.`);
  }

  return parts.join(" ") || "Executive summary generated for this reporting period.";
}

/** Build full executive report content payload. */
export function buildExecutiveReportContent(input: ExecutiveSummaryInput): ExecutiveReportContent {
  const confidences = [
    input.incidentAISnapshot?.confidence,
    input.riskAISnapshot?.confidence,
  ].filter((value): value is number => value != null);
  const averageConfidence =
    confidences.length > 0
      ? Math.round((confidences.reduce((sum, value) => sum + value, 0) / confidences.length) * 100) / 100
      : null;

  const metadata: ExecutiveReportMetadata = {
    healthScore: input.healthTrend.current,
    healthStatus: input.healthTrend.status,
    healthDelta: input.healthTrend.delta,
    complianceScore: input.complianceScore ?? null,
    averageConfidence,
    openRisks: input.metrics.openRisks,
    openIncidents: input.metrics.openIncidents,
    slaScore: input.slaSnapshot.score,
    slaViolations: input.slaSnapshot.violations,
    topConcerns: buildTopConcerns(input),
    positiveDevelopments: buildPositiveDevelopments(input),
    suggestedPriorities: buildSuggestedPriorities(input),
    trendAnalysis: buildTrendAnalysis(input),
    executiveRecommendations: buildExecutiveRecommendations(input),
    timeline: (input.timeline ?? []).map((item) => ({
      title: item.title,
      createdAt: item.created_at,
    })),
  };

  return {
    executiveSummary: generateExecutiveSummary(input),
    riskSummary: buildRiskExecutiveSummary(input),
    incidentSummary: buildIncidentExecutiveSummary(input),
    slaSummary: buildSLAExecutiveSummary(input),
    monitoringSummary: buildMonitoringExecutiveSummary(input),
    aiSummary: buildAISummary(input),
    metadata,
  };
}
