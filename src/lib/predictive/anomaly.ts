import type { OrganizationPredictiveSnapshot } from "@/lib/predictive/queries";
import {
  computeAutomationSuccessTrend,
  computeChurnProbability,
  computeClientHealthScoreFromSnapshot,
  computeIncidentProbability,
} from "@/lib/predictive/scoring";

export type PredictiveAnomaly = {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  href?: string;
};

export function detectPredictiveAnomalies(
  snapshot: OrganizationPredictiveSnapshot,
): PredictiveAnomaly[] {
  const anomalies: PredictiveAnomaly[] = [];

  const window7 = snapshot.historicalWindows.find((window) => window.key === "7d");
  const window30 = snapshot.historicalWindows.find((window) => window.key === "30d");

  if (window7 && window30 && window7.incidents > window30.incidents * 0.5 && window7.incidents >= 2) {
    anomalies.push({
      id: "incident-spike",
      title: "Incident spike detected",
      description: `${window7.incidents} incidents in the last 7 days versus ${window30.incidents} in 30 days.`,
      severity: "high",
      href: "/incidents",
    });
  }

  if (window7 && window7.slaBreaches >= 2) {
    anomalies.push({
      id: "sla-spike",
      title: "SLA breach cluster",
      description: `${window7.slaBreaches} SLA breaches recorded in the last 7 days.`,
      severity: "high",
      href: "/settings/sla",
    });
  }

  if (window7 && window7.automationSuccessRate != null && window7.automationSuccessRate < 60) {
    anomalies.push({
      id: "automation-degradation",
      title: "Automation success declining",
      description: `Automation success rate is ${window7.automationSuccessRate}% in the last 7 days.`,
      severity: "medium",
      href: "/automation",
    });
  }

  const highChurnClients = snapshot.clients.filter(
    (client) => computeChurnProbability(client) >= 65,
  );
  if (highChurnClients.length >= 2) {
    anomalies.push({
      id: "churn-cluster",
      title: "Multiple accounts at churn risk",
      description: `${highChurnClients.length} clients exceed churn risk thresholds from verified signals.`,
      severity: "high",
      href: "/predictive",
    });
  }

  const lowHealth = snapshot.clients.filter(
    (client) => computeClientHealthScoreFromSnapshot(client) < 40,
  );
  if (lowHealth.length >= 3) {
    anomalies.push({
      id: "health-decline",
      title: "Portfolio health decline",
      description: `${lowHealth.length} clients are below critical health thresholds.`,
      severity: "medium",
      href: "/clients/success",
    });
  }

  const incidentHotspots = snapshot.clients.filter(
    (client) => computeIncidentProbability(client) >= 60,
  );
  if (incidentHotspots.length >= 2) {
    anomalies.push({
      id: "incident-hotspot",
      title: "Incident hotspots emerging",
      description: `${incidentHotspots.length} clients show elevated incident probability.`,
      severity: "medium",
      href: "/predictive",
    });
  }

  const automationTrend = computeAutomationSuccessTrend(snapshot.historicalWindows);
  if (automationTrend === "declining") {
    anomalies.push({
      id: "automation-trend",
      title: "Automation reliability trend down",
      description: "Verified automation execution success is trending downward.",
      severity: "low",
      href: "/automation",
    });
  }

  return anomalies.slice(0, 8);
}
