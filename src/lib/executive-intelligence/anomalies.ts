import {
  ANOMALY_INCIDENT_SPIKE,
  ANOMALY_MONITORING_FAILURE_SPIKE,
  ANOMALY_OVERDUE_TASK_SPIKE,
  ANOMALY_REPORT_DROP_PERCENT,
  ANOMALY_RISK_SPIKE,
} from "@/lib/executive-intelligence/constants";
import { buildEvidence } from "@/lib/executive-intelligence/evidence";
import type { IntelligenceFinding } from "@/lib/executive-intelligence/types";

type AnomalyInput = {
  openRisksCurrent: number;
  openRisksPrevious: number;
  openIncidentsCurrent: number;
  openIncidentsPrevious: number;
  reportsPublishedCurrent: number;
  reportsPublishedPrevious: number;
  overdueTasksCurrent: number;
  overdueTasksPrevious: number;
  monitoringFailuresCurrent: number;
  monitoringFailuresPrevious: number;
  adoptionScoreCurrent: number | null;
  adoptionScorePrevious: number | null;
  criticalClientsCurrent: number;
  criticalClientsPrevious: number;
};

function makeFinding(
  id: string,
  category: IntelligenceFinding["category"],
  severity: IntelligenceFinding["severity"],
  title: string,
  summary: string,
  explanation: string,
  evidence: IntelligenceFinding["evidence"],
): IntelligenceFinding {
  return {
    id,
    category,
    severity,
    title,
    summary,
    explanation,
    confidence: "high",
    evidence,
    recommendedActions: [],
    generatedBy: "deterministic",
  };
}

export function detectAnomalies(input: AnomalyInput): IntelligenceFinding[] {
  const findings: IntelligenceFinding[] = [];

  const riskDelta = input.openRisksCurrent - input.openRisksPrevious;
  if (riskDelta >= ANOMALY_RISK_SPIKE) {
    findings.push(
      makeFinding(
        "anomaly_risk_spike",
        "risk",
        "high",
        "Unresolved risk exposure increased",
        `${input.openRisksCurrent} open risks, up from ${input.openRisksPrevious}.`,
        `Open risks increased by ${riskDelta}, exceeding the ${ANOMALY_RISK_SPIKE} threshold.`,
        [
          buildEvidence({ sourceType: "risk", sourceKey: "open_risks_current", label: "Open risks (current)", value: input.openRisksCurrent, route: "/risks" }),
          buildEvidence({ sourceType: "risk", sourceKey: "open_risks_previous", label: "Open risks (previous)", value: input.openRisksPrevious, route: "/risks" }),
        ],
      ),
    );
  }

  const incidentDelta = input.openIncidentsCurrent - input.openIncidentsPrevious;
  if (incidentDelta >= ANOMALY_INCIDENT_SPIKE) {
    findings.push(
      makeFinding(
        "anomaly_incident_spike",
        "incident",
        "critical",
        "Open incidents increased sharply",
        `${input.openIncidentsCurrent} open incidents, up from ${input.openIncidentsPrevious}.`,
        `Open incidents increased by ${incidentDelta}, exceeding the ${ANOMALY_INCIDENT_SPIKE} threshold.`,
        [
          buildEvidence({ sourceType: "incident", sourceKey: "open_incidents_current", label: "Open incidents (current)", value: input.openIncidentsCurrent, route: "/incidents" }),
          buildEvidence({ sourceType: "incident", sourceKey: "open_incidents_previous", label: "Open incidents (previous)", value: input.openIncidentsPrevious, route: "/incidents" }),
        ],
      ),
    );
  }

  if (input.reportsPublishedPrevious >= 2) {
    const dropPercent = Math.round(
      ((input.reportsPublishedPrevious - input.reportsPublishedCurrent) / input.reportsPublishedPrevious) * 100,
    );
    if (dropPercent >= ANOMALY_REPORT_DROP_PERCENT) {
      findings.push(
        makeFinding(
          "anomaly_report_drop",
          "delivery",
          "high",
          "Report delivery frequency declined",
          `Published reports dropped ${dropPercent}% versus the comparison period.`,
          `Published reports fell from ${input.reportsPublishedPrevious} to ${input.reportsPublishedCurrent}.`,
          [
            buildEvidence({ sourceType: "report", sourceKey: "reports_current", label: "Published reports (current)", value: input.reportsPublishedCurrent, route: "/reports" }),
            buildEvidence({ sourceType: "report", sourceKey: "reports_previous", label: "Published reports (previous)", value: input.reportsPublishedPrevious, route: "/reports" }),
          ],
        ),
      );
    }
  }

  const overdueDelta = input.overdueTasksCurrent - input.overdueTasksPrevious;
  if (overdueDelta >= ANOMALY_OVERDUE_TASK_SPIKE) {
    findings.push(
      makeFinding(
        "anomaly_overdue_tasks",
        "customer_success",
        "high",
        "Customer success work is overdue",
        `${input.overdueTasksCurrent} overdue tasks, up from ${input.overdueTasksPrevious}.`,
        `Overdue customer success tasks increased by ${overdueDelta}.`,
        [
          buildEvidence({ sourceType: "customer_success", sourceKey: "overdue_tasks_current", label: "Overdue tasks (current)", value: input.overdueTasksCurrent, route: "/customer-success" }),
          buildEvidence({ sourceType: "customer_success", sourceKey: "overdue_tasks_previous", label: "Overdue tasks (previous)", value: input.overdueTasksPrevious, route: "/customer-success" }),
        ],
      ),
    );
  }

  const monitoringDelta = input.monitoringFailuresCurrent - input.monitoringFailuresPrevious;
  if (monitoringDelta >= ANOMALY_MONITORING_FAILURE_SPIKE) {
    findings.push(
      makeFinding(
        "anomaly_monitoring_failures",
        "monitoring",
        "medium",
        "Monitoring reliability declined",
        `Monitoring failures increased by ${monitoringDelta}.`,
        `Monitoring failure events exceeded the ${ANOMALY_MONITORING_FAILURE_SPIKE} increase threshold.`,
        [
          buildEvidence({ sourceType: "monitoring", sourceKey: "failures_current", label: "Monitoring failures (current)", value: input.monitoringFailuresCurrent, route: "/monitoring" }),
          buildEvidence({ sourceType: "monitoring", sourceKey: "failures_previous", label: "Monitoring failures (previous)", value: input.monitoringFailuresPrevious, route: "/monitoring" }),
        ],
      ),
    );
  }

  if (
    input.adoptionScoreCurrent !== null &&
    input.adoptionScorePrevious !== null &&
    input.adoptionScoreCurrent < input.adoptionScorePrevious - 10
  ) {
    findings.push(
      makeFinding(
        "anomaly_adoption_decline",
        "adoption",
        "medium",
        "Adoption score deteriorated",
        `Adoption score fell from ${input.adoptionScorePrevious} to ${input.adoptionScoreCurrent}.`,
        "Adoption score dropped more than 10 points versus the comparison baseline.",
        [
          buildEvidence({ sourceType: "adoption", sourceKey: "adoption_score_current", label: "Adoption score (current)", value: input.adoptionScoreCurrent, route: "/adoption" }),
          buildEvidence({ sourceType: "adoption", sourceKey: "adoption_score_previous", label: "Adoption score (previous)", value: input.adoptionScorePrevious, route: "/adoption" }),
        ],
      ),
    );
  }

  if (input.criticalClientsCurrent > input.criticalClientsPrevious) {
    findings.push(
      makeFinding(
        "anomaly_critical_clients",
        "customer_success",
        "critical",
        "Critical client count increased",
        `${input.criticalClientsCurrent} critical clients, up from ${input.criticalClientsPrevious}.`,
        "More clients moved into critical health status.",
        [
          buildEvidence({ sourceType: "customer_success", sourceKey: "critical_clients_current", label: "Critical clients (current)", value: input.criticalClientsCurrent, route: "/customer-success" }),
          buildEvidence({ sourceType: "customer_success", sourceKey: "critical_clients_previous", label: "Critical clients (previous)", value: input.criticalClientsPrevious, route: "/customer-success" }),
        ],
      ),
    );
  }

  return findings;
}
