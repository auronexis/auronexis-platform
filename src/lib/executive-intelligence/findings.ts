import { MAX_FINDINGS } from "@/lib/executive-intelligence/constants";
import { detectAnomalies } from "@/lib/executive-intelligence/anomalies";
import { buildEvidence } from "@/lib/executive-intelligence/evidence";
import type {
  ExecutiveIntelligenceSnapshot,
  IntelligenceFinding,
  IntelligenceRecommendedAction,
} from "@/lib/executive-intelligence/types";

function action(
  key: string,
  title: string,
  description: string,
  route: string | null,
  priority: number,
  permitted: boolean,
): IntelligenceRecommendedAction {
  return {
    key,
    title,
    description,
    route,
    ctaLabel: route ? "Open" : null,
    priority,
    permitted,
    available: true,
    rationale: description,
  };
}

export function buildExecutiveFindings(
  snapshot: Pick<
    ExecutiveIntelligenceSnapshot,
    | "criticalChanges"
    | "negativeChanges"
    | "positiveChanges"
    | "adoption"
    | "customerSuccess"
    | "delivery"
    | "riskExposure"
    | "incidentStability"
    | "overdueOperationalWork"
    | "underusedCapabilities"
  >,
  anomalyInput: Parameters<typeof detectAnomalies>[0],
): IntelligenceFinding[] {
  const findings: IntelligenceFinding[] = [...detectAnomalies(anomalyInput)];

  if (snapshot.overdueOperationalWork.length > 0) {
    findings.push({
      id: "finding_overdue_work",
      category: "customer_success",
      severity: "high",
      title: "Operational work is overdue",
      summary: `${snapshot.overdueOperationalWork.length} overdue operational item(s) require attention.`,
      explanation: "Customer success tasks and operational deadlines have passed without completion.",
      confidence: "high",
      evidence: [
        buildEvidence({
          sourceType: "customer_success",
          sourceKey: "overdue_count",
          label: "Overdue items",
          value: snapshot.overdueOperationalWork.length,
          route: "/customer-success",
        }),
      ],
      recommendedActions: [
        action("complete_overdue", "Complete overdue work", "Finish overdue tasks to restore portfolio health.", "/customer-success", 90, true),
      ],
      generatedBy: "deterministic",
    });
  }

  if (snapshot.adoption.interpretation === "negative" && snapshot.adoption.currentValue !== null) {
    findings.push({
      id: "finding_adoption_stagnation",
      category: "adoption",
      severity: "medium",
      title: "Adoption signals weakened",
      summary: `Adoption score is ${snapshot.adoption.currentValue}, down from ${snapshot.adoption.previousValue ?? "baseline"}.`,
      explanation: "Workspace adoption declined versus the comparison period.",
      confidence: "high",
      evidence: snapshot.adoption.evidence,
      recommendedActions: [
        action("review_adoption", "Review adoption", "Open adoption guidance to re-engage the workspace.", "/adoption", 70, true),
      ],
      generatedBy: "deterministic",
    });
  }

  if (snapshot.delivery.interpretation === "negative") {
    findings.push({
      id: "finding_delivery_decline",
      category: "delivery",
      severity: "high",
      title: "Delivery consistency declined",
      summary: "Published report volume decreased versus the comparison period.",
      explanation: "Recurring client-facing delivery weakened.",
      confidence: "high",
      evidence: snapshot.delivery.evidence,
      recommendedActions: [
        action("review_reports", "Review reports", "Audit draft and scheduled reports.", "/reports", 85, true),
      ],
      generatedBy: "deterministic",
    });
  }

  if (snapshot.riskExposure.interpretation === "negative") {
    findings.push({
      id: "finding_risk_increase",
      category: "risk",
      severity: "high",
      title: "Risk exposure increased",
      summary: "Open risk count rose versus the comparison period.",
      explanation: "Unresolved risks require remediation.",
      confidence: "high",
      evidence: snapshot.riskExposure.evidence,
      recommendedActions: [
        action("review_risks", "Review risks", "Triage open risks.", "/risks", 88, true),
      ],
      generatedBy: "deterministic",
    });
  }

  if (snapshot.incidentStability.interpretation === "negative") {
    findings.push({
      id: "finding_incident_increase",
      category: "incident",
      severity: "critical",
      title: "Incident stability worsened",
      summary: "Open incident count increased.",
      explanation: "Active incidents affect service reliability.",
      confidence: "high",
      evidence: snapshot.incidentStability.evidence,
      recommendedActions: [
        action("review_incidents", "Review incidents", "Resolve open incidents.", "/incidents", 95, true),
      ],
      generatedBy: "deterministic",
    });
  }

  for (const gap of snapshot.underusedCapabilities.slice(0, 3)) {
    if (!gap.available) continue;
    findings.push({
      id: `finding_gap_${gap.key}`,
      category: "operational",
      severity: "low",
      title: `${gap.label} underused`,
      summary: gap.description,
      explanation: "Available capability has limited adoption in the workspace.",
      confidence: "medium",
      evidence: [
        buildEvidence({
          sourceType: "adoption",
          sourceKey: gap.key,
          label: gap.label,
          value: false,
          route: gap.route,
        }),
      ],
      recommendedActions: gap.route
        ? [action(`adopt_${gap.key}`, `Explore ${gap.label}`, gap.description, gap.route, 40, true)]
        : [],
      generatedBy: "deterministic",
    });
  }

  for (const change of snapshot.positiveChanges.filter((c) => c.significance === "major").slice(0, 2)) {
    findings.push({
      id: `finding_positive_${change.key}`,
      category: "operational",
      severity: "info",
      title: `${change.label} improved`,
      summary: change.label,
      explanation: `Positive change detected: ${change.absoluteChange ?? 0} versus comparison period.`,
      confidence: "high",
      evidence: change.evidence,
      recommendedActions: [],
      generatedBy: "deterministic",
    });
  }

  const severityRank = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  return findings
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity])
    .slice(0, MAX_FINDINGS);
}
