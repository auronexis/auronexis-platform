import type {
  ExecutiveSummary,
  HealthTrend,
  ReportMetrics,
  ReportSummary,
  SLASnapshot,
} from "@/lib/reports-v2/types";
import { scoreToHealthStatus } from "@/lib/health/types";

function formatDelta(delta: number | null): string {
  if (delta == null || delta === 0) {
    return "unchanged";
  }

  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function buildSummaryParagraph(input: {
  metrics: ReportMetrics;
  healthTrend: HealthTrend;
  slaSnapshot: SLASnapshot;
}): string {
  const parts: string[] = [];

  if (input.healthTrend.current != null) {
    if (input.healthTrend.previous != null && input.healthTrend.delta != null) {
      parts.push(
        `Client health ${input.healthTrend.delta >= 0 ? "improved" : "declined"} from ${input.healthTrend.previous} to ${input.healthTrend.current} (${formatDelta(input.healthTrend.delta)}).`,
      );
    } else {
      parts.push(`Client health score is ${input.healthTrend.current}.`);
    }
  }

  if (input.slaSnapshot.violations === 0) {
    parts.push("No SLA breaches detected.");
  } else {
    parts.push(
      `${input.slaSnapshot.violations} SLA breach${input.slaSnapshot.violations === 1 ? "" : "es"} detected.`,
    );
  }

  if (input.metrics.activityTrendPercent != null) {
    const direction =
      input.metrics.activityTrendPercent > 0
        ? "increased"
        : input.metrics.activityTrendPercent < 0
          ? "decreased"
          : "remained stable";
    parts.push(
      `Activity volume ${direction}${input.metrics.activityTrendPercent === 0 ? "" : ` ${Math.abs(input.metrics.activityTrendPercent)}%`}.`,
    );
  }

  if (input.healthTrend.status) {
    parts.push(`Overall status remains ${input.healthTrend.status.replace(/^./, (c) => c.toUpperCase())}.`);
  }

  return parts.join(" ") || "Operational summary generated for this reporting period.";
}

export function buildExecutiveSummary(input: {
  metrics: ReportMetrics;
  healthTrend: HealthTrend;
  slaSnapshot: SLASnapshot;
  monitoringSnapshot?: {
    connectorCount: number;
    failures: number;
    recoveries: number;
    healthImpactEvents: number;
  } | null;
  incidentAISnapshot?: {
    summary: string | null;
    rootCause: string | null;
    suggestedImprovements: string | null;
    confidence: number | null;
  } | null;
  riskAISnapshot?: {
    summary: string | null;
    topMitigationRecommendations: string[];
    predictedSeverity: string | null;
    predictedScore: number | null;
    confidence: number | null;
  } | null;
}): ExecutiveSummary {
  const paragraph = buildSummaryParagraph(input);
  const highlights: string[] = [];

  if (input.healthTrend.current != null) {
    highlights.push(`Health score: ${input.healthTrend.current}`);
  }

  if (input.slaSnapshot.score != null) {
    highlights.push(`SLA compliance: ${input.slaSnapshot.score}%`);
  }

  if (input.monitoringSnapshot && input.monitoringSnapshot.connectorCount > 0) {
    highlights.push(`Monitoring connectors: ${input.monitoringSnapshot.connectorCount}`);
    highlights.push(`Monitoring failures: ${input.monitoringSnapshot.failures}`);
    highlights.push(`Monitoring recoveries: ${input.monitoringSnapshot.recoveries}`);
    if (input.monitoringSnapshot.healthImpactEvents > 0) {
      highlights.push(`Health impact events: ${input.monitoringSnapshot.healthImpactEvents}`);
    }
  }

  if (input.incidentAISnapshot?.summary) {
    highlights.push(`AI incident summary available`);
    if (input.incidentAISnapshot.rootCause) {
      highlights.push(`AI root cause insight captured`);
    }
    if (input.incidentAISnapshot.suggestedImprovements) {
      highlights.push(`AI suggested improvements available`);
    }
    if (input.incidentAISnapshot.confidence != null) {
      highlights.push(`AI confidence: ${Math.round(input.incidentAISnapshot.confidence * 100)}%`);
    }
  }

  if (input.riskAISnapshot?.summary) {
    highlights.push("AI risk summary available");
    if (input.riskAISnapshot.topMitigationRecommendations.length > 0) {
      highlights.push(`${input.riskAISnapshot.topMitigationRecommendations.length} AI mitigation recommendations`);
    }
    if (input.riskAISnapshot.predictedSeverity) {
      highlights.push(`AI predicted risk severity: ${input.riskAISnapshot.predictedSeverity}`);
    }
    if (input.riskAISnapshot.predictedScore != null) {
      highlights.push(`AI predicted risk score: ${input.riskAISnapshot.predictedScore}`);
    }
    if (input.riskAISnapshot.confidence != null) {
      highlights.push(`AI risk confidence: ${Math.round(input.riskAISnapshot.confidence * 100)}%`);
    }
  }

  highlights.push(`Open risks: ${input.metrics.openRisks}`);
  highlights.push(`Open incidents: ${input.metrics.openIncidents}`);
  highlights.push(`Activity events: ${input.metrics.activityCount}`);

  return { paragraph, highlights };
}

export function buildReportSummary(input: {
  metrics: ReportMetrics;
  healthTrend: HealthTrend;
  slaSnapshot: SLASnapshot;
  monitoringSnapshot?: {
    connectorCount: number;
    failures: number;
    recoveries: number;
    healthImpactEvents: number;
  } | null;
  incidentAISnapshot?: {
    summary: string | null;
    rootCause: string | null;
    suggestedImprovements: string | null;
    confidence: number | null;
  } | null;
  riskAISnapshot?: {
    summary: string | null;
    topMitigationRecommendations: string[];
    predictedSeverity: string | null;
    predictedScore: number | null;
    confidence: number | null;
  } | null;
}): ReportSummary {
  const executiveSummary = buildExecutiveSummary(input);
  return {
    metrics: input.metrics,
    healthTrend: input.healthTrend,
    slaSnapshot: input.slaSnapshot,
    executiveSummary,
    summaryParagraph: executiveSummary.paragraph,
  };
}

export function deriveHealthTrend(
  points: Array<{ score: number; status: string; calculated_at: string }>,
): HealthTrend {
  const current = points[0]?.score ?? null;
  const previous = points[1]?.score ?? null;
  const delta = current != null && previous != null ? current - previous : null;

  return {
    current,
    previous,
    delta,
    status: current != null ? scoreToHealthStatus(current) : null,
    points: points.map((point) => ({
      score: point.score,
      status: point.status,
      calculatedAt: point.calculated_at,
    })),
  };
}

export function deriveSlaScore(violations: number): number {
  return Math.max(0, Math.min(100, 100 - violations * 15));
}
