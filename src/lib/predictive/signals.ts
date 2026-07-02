import type { ClientPredictiveSnapshot, OrganizationPredictiveSnapshot } from "@/lib/predictive/queries";
import { computeCommunicationScore } from "@/lib/ai/client-success/scoring";
import {
  computeClientHealthScoreFromSnapshot,
  computeIncidentProbability,
  computeRiskEscalationProbability,
  computeSlaBreachProbability,
} from "@/lib/predictive/scoring";

export type ClientPredictiveSignals = {
  healthScore: number;
  riskScore: number;
  incidentCount: number;
  breachCount: number;
  monitoringFailures: number;
  engagementScore: number;
  reportCadenceDays: number | null;
  inactivityDays: number | null;
  activityEventCount: number;
};

export function extractClientSignals(snapshot: ClientPredictiveSnapshot): ClientPredictiveSignals {
  const communication = computeCommunicationScore(snapshot.success);

  return {
    healthScore: computeClientHealthScoreFromSnapshot(snapshot),
    riskScore: computeRiskEscalationProbability(snapshot),
    incidentCount: snapshot.success.incidentsThisPeriod,
    breachCount: snapshot.success.slaBreachesThisPeriod,
    monitoringFailures: 0,
    engagementScore: communication.score,
    reportCadenceDays: snapshot.success.daysSinceLastPublishedReport,
    inactivityDays: snapshot.success.daysSinceLastActivity,
    activityEventCount: snapshot.success.recentActivity.length,
  };
}

export function extractOrganizationSignalSummary(snapshot: OrganizationPredictiveSnapshot): {
  avgHealth: number;
  avgRisk: number;
  totalIncidents: number;
  totalBreaches: number;
  clientCount: number;
} {
  if (snapshot.clients.length === 0) {
    return { avgHealth: 0, avgRisk: 0, totalIncidents: 0, totalBreaches: 0, clientCount: 0 };
  }

  let healthSum = 0;
  let riskSum = 0;
  let incidents = 0;
  let breaches = 0;

  for (const client of snapshot.clients) {
    const signals = extractClientSignals(client);
    healthSum += signals.healthScore;
    riskSum += signals.riskScore;
    incidents += signals.incidentCount;
    breaches += signals.breachCount;
  }

  const count = snapshot.clients.length;
  return {
    avgHealth: Math.round(healthSum / count),
    avgRisk: Math.round(riskSum / count),
    totalIncidents: incidents,
    totalBreaches: breaches,
    clientCount: count,
  };
}

export function computeMonitoringFailureEstimate(_snapshot: ClientPredictiveSnapshot): number {
  return 0;
}

export function computePredictedBreachCount(snapshot: ClientPredictiveSnapshot): number {
  const probability = computeSlaBreachProbability(snapshot);
  if (probability >= 70) return 2;
  if (probability >= 45) return 1;
  return 0;
}

export function computePredictedIncidentCount(snapshot: ClientPredictiveSnapshot): number {
  const probability = computeIncidentProbability(snapshot);
  if (probability >= 60) return 2;
  if (probability >= 35) return 1;
  return 0;
}
