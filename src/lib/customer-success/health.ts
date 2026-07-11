import { CLIENT_HEALTH_WEIGHTS, NEW_CLIENT_GRACE_DAYS } from "@/lib/customer-success/constants";
import type {
  ClientSuccessHealthBreakdown,
  ClientSuccessHealthStatus,
  ClientSuccessTrend,
} from "@/lib/customer-success/types";
import type { ClientSuccessSnapshot as AiClientData } from "@/lib/ai/client-success/queries";

export type HealthInput = {
  data: AiClientData;
  openRiskCount: number;
  criticalRiskCount: number;
  openIncidentCount: number;
  overdueTaskCount: number;
  clientCreatedAt: string;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function isNewClient(createdAt: string): boolean {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  return days <= NEW_CLIENT_GRACE_DAYS;
}

function scoreDelivery(data: AiClientData, isNew: boolean): number {
  if (data.publishedReportsCount === 0 && isNew) {
    return 12;
  }
  let score = 0;
  if (data.reportsPublishedThisPeriod >= 2) score = 25;
  else if (data.reportsPublishedThisPeriod >= 1) score = 18;
  else if (data.publishedReportsCount > 0) score = 10;
  if (data.scheduledReportsCount > 0) score = Math.min(25, score + 5);
  return clamp(score, 0, CLIENT_HEALTH_WEIGHTS.deliveryConsistency);
}

function scoreRiskExposure(critical: number, open: number, enabled: boolean, isNew: boolean): number {
  if (!enabled) return CLIENT_HEALTH_WEIGHTS.riskExposure;
  if (open === 0 && critical === 0) return CLIENT_HEALTH_WEIGHTS.riskExposure;
  if (critical > 0) return 0;
  if (open > 2) return 5;
  if (open > 0 && isNew) return 12;
  return open > 0 ? 8 : CLIENT_HEALTH_WEIGHTS.riskExposure;
}

function scoreIncidents(open: number, enabled: boolean, isNew: boolean): number {
  if (!enabled) return CLIENT_HEALTH_WEIGHTS.incidentStability;
  if (open === 0) return CLIENT_HEALTH_WEIGHTS.incidentStability;
  if (open >= 2) return 0;
  return isNew ? 8 : 4;
}

function scoreEngagement(data: AiClientData): number {
  let score = 0;
  if (data.daysSinceLastActivity !== null && data.daysSinceLastActivity <= 7) score = 15;
  else if (data.daysSinceLastActivity !== null && data.daysSinceLastActivity <= 21) score = 10;
  else if (data.daysSinceLastActivity !== null && data.daysSinceLastActivity <= 45) score = 5;
  if (data.portalUsersCount > 0) score = Math.min(15, score + 3);
  return clamp(score, 0, CLIENT_HEALTH_WEIGHTS.customerEngagement);
}

function scoreServiceReliability(breaches: number, enabled: boolean): number {
  if (!enabled) return CLIENT_HEALTH_WEIGHTS.serviceReliability;
  if (breaches === 0) return CLIENT_HEALTH_WEIGHTS.serviceReliability;
  if (breaches >= 3) return 0;
  return 5;
}

function scoreVisibility(data: AiClientData): number {
  let score = 0;
  if (data.publishedReportsCount > 0) score += 5;
  if (data.portalUsersCount > 0) score += 3;
  if (data.hasEmailActivity) score += 2;
  return clamp(score, 0, CLIENT_HEALTH_WEIGHTS.customerVisibility);
}

function scoreExecution(overdue: number): number {
  if (overdue === 0) return CLIENT_HEALTH_WEIGHTS.successExecution;
  if (overdue >= 3) return 0;
  return 2;
}

export function computeClientHealth(input: HealthInput): ClientSuccessHealthBreakdown {
  const isNew = isNewClient(input.clientCreatedAt);
  const deliveryConsistency = scoreDelivery(input.data, isNew);
  const riskExposure = scoreRiskExposure(
    input.criticalRiskCount,
    input.openRiskCount,
    input.data.risksEnabled,
    isNew,
  );
  const incidentStability = scoreIncidents(
    input.openIncidentCount,
    input.data.incidentsEnabled,
    isNew,
  );
  const customerEngagement = scoreEngagement(input.data);
  const serviceReliability = scoreServiceReliability(
    input.data.slaBreachesThisPeriod,
    input.data.slaEnabled,
  );
  const customerVisibility = scoreVisibility(input.data);
  const successExecution = scoreExecution(input.overdueTaskCount);

  const total = clamp(
    deliveryConsistency +
      riskExposure +
      incidentStability +
      customerEngagement +
      serviceReliability +
      customerVisibility +
      successExecution,
    0,
    100,
  );

  return {
    deliveryConsistency,
    riskExposure,
    incidentStability,
    customerEngagement,
    serviceReliability,
    customerVisibility,
    successExecution,
    total,
  };
}

export function resolveHealthStatus(
  breakdown: ClientSuccessHealthBreakdown,
  data: AiClientData,
  criticalRiskCount: number,
  openIncidentCount: number,
  isNew: boolean,
): ClientSuccessHealthStatus {
  if (data.publishedReportsCount === 0 && data.draftReportsCount === 0 && isNew) {
    return "insufficient_data";
  }
  if (criticalRiskCount > 0 || openIncidentCount >= 2) {
    return "critical";
  }
  if (breakdown.total < 40) return "at_risk";
  if (breakdown.total < 55) return "watch";
  if (breakdown.total < 70) return "stable";
  return "healthy";
}

export function resolveClientTrend(data: AiClientData): ClientSuccessTrend {
  const current = data.reportsPublishedThisPeriod + data.incidentsThisPeriod + data.risksThisPeriod;
  const previous =
    data.reportsPublishedPreviousPeriod +
    data.incidentsPreviousPeriod +
    data.risksPreviousPeriod;
  if (current + previous < 2) return "insufficient_data";
  if (previous === 0) return current > 0 ? "improving" : "insufficient_data";
  const ratio = current / previous;
  if (ratio >= 1.2) return "improving";
  if (ratio <= 0.8) return "declining";
  return "stable";
}
