import { STALE_ACTIVITY_DAYS, STALE_REPORT_DAYS } from "@/lib/customer-success/constants";
import type { ClientSuccessRiskSignal, ClientSuccessSignal } from "@/lib/customer-success/types";
import type { ClientSuccessSnapshot as AiClientData } from "@/lib/ai/client-success/queries";

export type SignalInput = {
  data: AiClientData;
  openRiskCount: number;
  criticalRiskCount: number;
  openIncidentCount: number;
  overdueTaskCount: number;
};

export function buildClientSignals(input: SignalInput): {
  adoptionSignals: ClientSuccessSignal[];
  riskSignals: ClientSuccessRiskSignal[];
  valueSignals: ClientSuccessSignal[];
} {
  const adoptionSignals: ClientSuccessSignal[] = [];
  const riskSignals: ClientSuccessRiskSignal[] = [];
  const valueSignals: ClientSuccessSignal[] = [];
  const { data } = input;
  const now = new Date().toISOString();

  if (data.reportsPublishedThisPeriod > 0) {
    valueSignals.push({
      code: "report_published_recent",
      label: "Recent report published",
      description: "A report was published in the current period.",
      impact: "positive",
      severity: "low",
      evidence: `${data.reportsPublishedThisPeriod} report(s) published this period.`,
      source: "reports",
      observedAt: data.latestPublishedReport?.updated_at ?? now,
    });
  }

  if (data.scheduledReportsCount > 0) {
    adoptionSignals.push({
      code: "recurring_schedule_active",
      label: "Recurring schedule active",
      description: "Report scheduling is configured for this client.",
      impact: "positive",
      severity: "low",
      evidence: `${data.scheduledReportsCount} active schedule(s).`,
      source: "report_schedules",
      observedAt: now,
    });
  }

  if (
    data.daysSinceLastPublishedReport !== null &&
    data.daysSinceLastPublishedReport > STALE_REPORT_DAYS
  ) {
    riskSignals.push({
      code: "no_recent_report",
      label: "No recent published report",
      description: "Published delivery has stalled beyond the healthy window.",
      impact: "negative",
      severity: "high",
      evidence: `${data.daysSinceLastPublishedReport} days since last published report.`,
      source: "reports",
      observedAt: null,
    });
  }

  if (input.criticalRiskCount > 0) {
    riskSignals.push({
      code: "critical_risk",
      label: "Critical risk open",
      description: "Unresolved critical-severity risks require attention.",
      impact: "negative",
      severity: "high",
      evidence: `${input.criticalRiskCount} critical risk(s) open.`,
      source: "risks",
      observedAt: null,
    });
  } else if (input.openRiskCount > 0) {
    riskSignals.push({
      code: "high_risk_open",
      label: "Open risks",
      description: "Unresolved risks affect client stability.",
      impact: "negative",
      severity: "medium",
      evidence: `${input.openRiskCount} open risk(s).`,
      source: "risks",
      observedAt: null,
    });
  }

  if (input.openIncidentCount > 0) {
    riskSignals.push({
      code: input.openIncidentCount >= 2 ? "critical_incident" : "open_incident",
      label: "Open incidents",
      description: "Active incidents require operational response.",
      impact: "negative",
      severity: input.openIncidentCount >= 2 ? "high" : "medium",
      evidence: `${input.openIncidentCount} open incident(s).`,
      source: "incidents",
      observedAt: null,
    });
  }

  if (data.slaEnabled && data.slaBreachesThisPeriod > 0) {
    riskSignals.push({
      code: "sla_breach",
      label: "SLA breach",
      description: "SLA targets were breached in the current period.",
      impact: "negative",
      severity: "high",
      evidence: `${data.slaBreachesThisPeriod} breach(es) this period.`,
      source: "sla",
      observedAt: null,
    });
  }

  if (
    data.daysSinceLastActivity !== null &&
    data.daysSinceLastActivity > STALE_ACTIVITY_DAYS
  ) {
    riskSignals.push({
      code: "stale_activity",
      label: "Stale client activity",
      description: "No recent meaningful activity detected.",
      impact: "negative",
      severity: "medium",
      evidence: `${data.daysSinceLastActivity} days since last activity.`,
      source: "activity_events",
      observedAt: null,
    });
  }

  if (data.publishedReportsCount > 0 && data.portalUsersCount === 0) {
    riskSignals.push({
      code: "portal_unused",
      label: "Portal unused",
      description: "Reports exist but no portal users are configured.",
      impact: "negative",
      severity: "low",
      evidence: "Zero portal users with published reports.",
      source: "client_portal",
      observedAt: null,
    });
  }

  if (input.overdueTaskCount > 0) {
    riskSignals.push({
      code: "overdue_success_tasks",
      label: "Overdue success tasks",
      description: "Customer success tasks are past due.",
      impact: "negative",
      severity: "medium",
      evidence: `${input.overdueTaskCount} overdue task(s).`,
      source: "customer_success_tasks",
      observedAt: null,
    });
  }

  if (data.reportsPublishedPreviousPeriod > data.reportsPublishedThisPeriod && data.publishedReportsCount > 0) {
    riskSignals.push({
      code: "declining_delivery",
      label: "Declining delivery frequency",
      description: "Report publishing declined versus the prior period.",
      impact: "negative",
      severity: "medium",
      evidence: "Current period has fewer published reports than previous.",
      source: "reports",
      observedAt: null,
    });
  }

  if (data.publishedReportsCount >= 2 && input.openRiskCount === 0 && input.openIncidentCount === 0) {
    adoptionSignals.push({
      code: "healthy_expansion",
      label: "Expansion candidate",
      description: "Healthy delivery with stable operations.",
      impact: "positive",
      severity: "low",
      evidence: "Multiple reports with no open risks or incidents.",
      source: "health",
      observedAt: now,
    });
  }

  return { adoptionSignals, riskSignals, valueSignals };
}

export function getPrimaryRiskReason(riskSignals: ClientSuccessRiskSignal[]): string | null {
  const sorted = [...riskSignals].sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 };
    return sev[b.severity] - sev[a.severity];
  });
  return sorted[0]?.description ?? null;
}
