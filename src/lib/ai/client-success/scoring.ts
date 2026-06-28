import type { ClientSuccessSnapshot } from "@/lib/ai/client-success/queries";
import type {
  ChurnRiskLevel,
  ClientHealthLabel,
  ClientPriorityLabel,
  CommunicationRating,
  ConfidenceLabel,
  MaturityLevel,
  RelationshipStatus,
  ReportQualityRating,
} from "@/lib/ai/client-success/types";

export function computeClientHealthScore(snapshot: ClientSuccessSnapshot): number {
  let score = 100;
  const { overview, profitability } = snapshot;

  if (profitability?.health === "critical") score -= 25;
  else if (profitability?.health === "watch") score -= 12;

  score -= Math.min(20, overview.kpis.openIncidentsCount * 4);
  score -= Math.min(16, overview.kpis.openRisksCount * 3);

  if (snapshot.daysSinceLastPublishedReport != null && snapshot.daysSinceLastPublishedReport > 30) {
    score -= Math.min(15, Math.floor(snapshot.daysSinceLastPublishedReport / 7) * 2);
  }

  if (snapshot.slaBreachesThisPeriod > 0) score -= Math.min(12, snapshot.slaBreachesThisPeriod * 4);
  if (snapshot.draftReportsCount > 0) score -= Math.min(8, snapshot.draftReportsCount * 2);
  if (snapshot.daysSinceLastActivity != null && snapshot.daysSinceLastActivity > 21) {
    score -= Math.min(10, Math.floor(snapshot.daysSinceLastActivity / 7));
  }

  if (snapshot.incidentsThisPeriod > snapshot.incidentsPreviousPeriod) score -= 8;
  if (snapshot.risksThisPeriod > snapshot.risksPreviousPeriod) score -= 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function healthLabelFromScore(score: number): ClientHealthLabel {
  if (score >= 90) return "excellent";
  if (score >= 75) return "healthy";
  if (score >= 55) return "watch";
  if (score >= 35) return "attention";
  return "critical";
}

export function computeChurnRisk(snapshot: ClientSuccessSnapshot): {
  level: ChurnRiskLevel;
  factors: string[];
} {
  const factors: string[] = [];
  let points = 0;

  if (snapshot.daysSinceLastPublishedReport == null) {
    factors.push("No published reports on record");
    points += 3;
  } else if (snapshot.daysSinceLastPublishedReport > 45) {
    factors.push(`No published report in ${snapshot.daysSinceLastPublishedReport} days`);
    points += 3;
  } else if (snapshot.daysSinceLastPublishedReport > 30) {
    factors.push(`Reporting cadence lapsed (${snapshot.daysSinceLastPublishedReport} days)`);
    points += 2;
  }

  if (snapshot.overview.kpis.openIncidentsCount >= 3) {
    factors.push(`${snapshot.overview.kpis.openIncidentsCount} open incidents`);
    points += 2;
  }

  if (!snapshot.hasEmailActivity && snapshot.recentActivity.length === 0) {
    factors.push("No recent communication activity");
    points += 2;
  }

  if (snapshot.profitabilityEnabled && snapshot.profitability?.margin != null && snapshot.profitability.margin < 0) {
    factors.push("Negative profitability margin");
    points += 3;
  } else if (snapshot.profitability?.health === "critical") {
    factors.push("Critical profitability health");
    points += 2;
  }

  if (snapshot.risksThisPeriod > snapshot.risksPreviousPeriod && snapshot.risksThisPeriod > 0) {
    factors.push("Increasing open risk volume");
    points += 2;
  }

  if (snapshot.slaBreachesThisPeriod > 0) {
    factors.push(`${snapshot.slaBreachesThisPeriod} SLA failure(s) this period`);
    points += 2;
  }

  if (snapshot.daysSinceLastActivity != null && snapshot.daysSinceLastActivity > 30) {
    factors.push("Customer inactivity detected");
    points += 2;
  }

  if (snapshot.clientStatus === "archived") {
    factors.push("Client account is archived");
    points += 4;
  }

  let level: ChurnRiskLevel = "very_low";
  if (points >= 9) level = "critical";
  else if (points >= 7) level = "high";
  else if (points >= 4) level = "medium";
  else if (points >= 2) level = "low";

  return { level, factors };
}

export function computeCommunicationScore(snapshot: ClientSuccessSnapshot): {
  score: number;
  rating: CommunicationRating;
  recommendations: string[];
} {
  let score = 70;
  const recommendations: string[] = [];

  if (snapshot.reportsPublishedThisPeriod >= 1) score += 10;
  if (snapshot.scheduledReportsCount > 0) score += 8;
  if (snapshot.hasEmailActivity) score += 10;
  if (snapshot.portalUsersCount > 0) score += 5;
  if (snapshot.recentActivity.length >= 3) score += 7;

  if (snapshot.daysSinceLastPublishedReport != null && snapshot.daysSinceLastPublishedReport > 30) {
    score -= 15;
    recommendations.push("Publish report");
  }

  if (!snapshot.hasEmailActivity) {
    score -= 8;
    recommendations.push("Send update");
  }

  if (snapshot.daysSinceLastActivity != null && snapshot.daysSinceLastActivity > 21) {
    score -= 10;
    recommendations.push("Follow up");
  }

  if (snapshot.scheduledReportsCount === 0 && snapshot.schedulingEnabled) {
    score -= 5;
    recommendations.push("Schedule review");
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  let rating: CommunicationRating = "poor";
  if (clamped >= 85) rating = "excellent";
  else if (clamped >= 65) rating = "good";
  else if (clamped >= 45) rating = "needs_attention";

  return { score: clamped, rating, recommendations: [...new Set(recommendations)] };
}

export function evaluateReportQuality(snapshot: ClientSuccessSnapshot): {
  rating: ReportQualityRating;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  const report = snapshot.latestPublishedReport ?? snapshot.overview.latestReport;

  if (snapshot.publishedReportsCount === 0) {
    issues.push("No published reports");
    suggestions.push("Publish the first executive report for this client.");
    return { rating: "poor", issues, suggestions };
  }

  if (snapshot.draftReportsCount > 0) {
    issues.push(`${snapshot.draftReportsCount} draft report(s) pending`);
    suggestions.push("Finalize and publish draft reports.");
  }

  if (report) {
    if (!report.executive_summary?.trim()) {
      issues.push("Missing executive summary");
      suggestions.push("Add an executive summary before publishing.");
    }
    if (!report.next_actions?.trim()) {
      issues.push("Missing next actions");
      suggestions.push("Include clear next actions in the report.");
    }
    if (report.status === "draft") {
      issues.push("Latest report is still a draft");
    }
    if (snapshot.daysSinceLastPublishedReport != null && snapshot.daysSinceLastPublishedReport > 45) {
      issues.push("Reports are outdated");
      suggestions.push("Increase reporting frequency.");
    }
  }

  let rating: ReportQualityRating = "excellent";
  if (issues.length >= 3) rating = "poor";
  else if (issues.length === 2) rating = "needs_improvement";
  else if (issues.length === 1) rating = "good";

  return { rating, issues, suggestions };
}

export function estimateMaturity(snapshot: ClientSuccessSnapshot): {
  level: MaturityLevel;
  reasoning: string;
} {
  let points = 0;

  if (snapshot.publishedReportsCount >= 4) points += 2;
  else if (snapshot.publishedReportsCount >= 1) points += 1;

  if (snapshot.scheduledReportsCount > 0) points += 1;
  if (snapshot.slaEnabled && snapshot.slaBreachesThisPeriod === 0) points += 1;
  if (snapshot.overview.kpis.openIncidentsCount === 0 && snapshot.overview.kpis.openRisksCount === 0) points += 1;
  if (snapshot.profitability?.health === "healthy") points += 1;
  if (snapshot.hasEmailActivity) points += 1;

  if (snapshot.overview.kpis.openIncidentsCount >= 3) points -= 2;
  if (snapshot.overview.kpis.openRisksCount >= 3) points -= 1;

  let level: MaturityLevel = "reactive";
  if (points >= 5) level = "strategic";
  else if (points >= 4) level = "optimized";
  else if (points >= 2) level = "managed";
  else if (points >= 1) level = "developing";

  const reasoning = [
    snapshot.publishedReportsCount > 0
      ? `${snapshot.publishedReportsCount} published report(s) on record`
      : "Limited reporting history",
    snapshot.scheduledReportsCount > 0 ? "Active report schedule" : "No scheduled reporting",
    snapshot.overview.kpis.openIncidentsCount + snapshot.overview.kpis.openRisksCount > 0
      ? "Open operational items remain"
      : "Operational queue is clear",
  ].join(". ");

  return { level, reasoning };
}

export function computeRelationshipStatus(
  healthScore: number,
  churnRisk: ChurnRiskLevel,
): RelationshipStatus {
  if (churnRisk === "critical" || churnRisk === "high" || healthScore < 35) return "critical";
  if (churnRisk === "medium" || healthScore < 55) return "at_risk";
  if (healthScore >= 75) return "strong";
  return "stable";
}

export function computePriorityScore(snapshot: ClientSuccessSnapshot, healthScore: number): {
  score: number;
  label: ClientPriorityLabel;
} {
  const urgency = 100 - healthScore;
  const score = Math.max(0, Math.min(100, Math.round(urgency + snapshot.overview.kpis.openIncidentsCount * 2)));

  let label: ClientPriorityLabel = "excellent";
  if (score >= 76) label = "critical";
  else if (score >= 51) label = "attention";
  else if (score >= 26) label = "good";

  return { score, label };
}

export function computeConfidence(snapshot: ClientSuccessSnapshot): {
  score: number;
  label: ConfidenceLabel;
} {
  let score = 30;
  if (snapshot.profitability) score += 15;
  if (snapshot.publishedReportsCount > 0) score += 15;
  if (snapshot.recentActivity.length > 0) score += 10;
  if (snapshot.incidentsEnabled || snapshot.risksEnabled) score += 10;
  if (snapshot.latestPublishedReport) score += 10;
  if (snapshot.hasEmailActivity) score += 5;
  if (snapshot.scheduledReportsCount > 0) score += 5;

  const clamped = Math.min(100, score);
  let label: ConfidenceLabel = "low";
  if (clamped >= 75) label = "high";
  else if (clamped >= 50) label = "medium";

  return { score: clamped, label };
}
