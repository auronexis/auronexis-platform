import type { OperationalSnapshot } from "@/lib/ai/insights/queries";
import { getFirstName, getTimeGreeting } from "@/lib/dashboard/display";
import { formatCurrency } from "@/lib/profitability/types";
import type {
  CustomerSuccessCategory,
  ExecutiveBrief,
  ExecutiveInsight,
  PrioritySeverity,
  SmartTimelineEvent,
} from "@/lib/intelligence/types";
import {
  calculateClientPriority,
  isClientRequiringAttention,
  isReportOverdue,
  rankClientPriorities,
  severityFromScore,
} from "@/lib/intelligence/scoring";
import type { ActivityEventView } from "@/lib/activity/types";
import {
  formatActivityRelativeTime,
  getActivityEntityHref,
} from "@/lib/activity/types";

const ATTENTION_SCORE_THRESHOLD = 26;
const HIGH_PRIORITY_SCORE_THRESHOLD = 51;

export function buildExecutiveBrief(
  snapshot: OperationalSnapshot,
  userFullName: string,
): ExecutiveBrief {
  const priorities = rankClientPriorities(snapshot.clients);
  const clientsRequiringAttention = priorities.filter(isClientRequiringAttention).length;
  const overdueReportsCount = snapshot.clients.filter(isReportOverdue).length;
  const criticalIncidentCount = snapshot.dashboard.features.incidents
    ? snapshot.dashboard.criticalAlerts.filter((alert) => alert.type === "incident").length
    : 0;

  const revenueAtRisk = priorities
    .filter((priority) => priority.score >= HIGH_PRIORITY_SCORE_THRESHOLD)
    .reduce((sum, priority) => sum + priority.monthlyRevenue, 0);

  const highestPriorityClient = priorities[0]?.score
    ? {
        clientId: priorities[0].clientId,
        clientName: priorities[0].clientName,
        score: priorities[0].score,
        severity: priorities[0].severity,
      }
    : null;

  const summaryLines = [
    `${clientsRequiringAttention} client${clientsRequiringAttention === 1 ? "" : "s"} require attention.`,
    `${overdueReportsCount} report${overdueReportsCount === 1 ? "" : "s"} overdue.`,
    `${criticalIncidentCount} critical incident${criticalIncidentCount === 1 ? "" : "s"}.`,
  ];

  return {
    greeting: getTimeGreeting(),
    firstName: getFirstName(userFullName),
    clientsRequiringAttention,
    overdueReportsCount,
    criticalIncidentCount,
    revenueAtRisk,
    revenueAtRiskFormatted: formatCurrency(revenueAtRisk),
    highestPriorityClient,
    summaryLines,
  };
}

export function buildExecutiveInsights(snapshot: OperationalSnapshot): ExecutiveInsight[] {
  const priorities = rankClientPriorities(snapshot.clients);
  const { dashboard } = snapshot;

  const clientsWithoutReports = snapshot.clients.filter(isReportOverdue).length;
  const decliningHealthClients = snapshot.clients.filter(
    (client) =>
      client.profitability.health === "watch" ||
      client.profitability.health === "critical" ||
      client.incidentsThisPeriod > client.incidentsPreviousPeriod,
  ).length;
  const criticalRiskCount = dashboard.features.risks
    ? dashboard.riskSummary.criticalCount
    : 0;
  const incidentEscalationCount = dashboard.features.incidents
    ? dashboard.criticalAlerts.filter((alert) => alert.type === "incident").length
    : 0;
  const revenueAtRisk = priorities
    .filter((priority) => priority.score >= HIGH_PRIORITY_SCORE_THRESHOLD)
    .reduce((sum, priority) => sum + priority.monthlyRevenue, 0);
  const lowProfitabilityClients = snapshot.clients.filter(
    (client) => client.profitability.margin != null && client.profitability.margin < 20,
  ).length;
  const inactiveClients = snapshot.clients.filter((client) => client.recentActivityCount === 0).length;

  return [
    {
      id: "clients-without-reports",
      title: "Clients without reports",
      value: clientsWithoutReports,
      description: "Accounts missing a recent published report.",
      href: "/reports",
      tone: clientsWithoutReports > 0 ? "warning" : "success",
    },
    {
      id: "declining-health",
      title: "Declining health",
      value: decliningHealthClients,
      description: "Clients on watch, critical, or with rising incidents.",
      href: "/clients",
      tone: decliningHealthClients > 0 ? "warning" : "success",
    },
    {
      id: "critical-risks",
      title: "Critical risks",
      value: criticalRiskCount,
      description: "Open risks at critical severity.",
      href: "/risks?tab=open",
      tone: criticalRiskCount > 0 ? "danger" : "success",
    },
    {
      id: "incident-escalation",
      title: "Incident escalation",
      value: incidentEscalationCount,
      description: "Critical incidents requiring immediate action.",
      href: "/incidents",
      tone: incidentEscalationCount > 0 ? "danger" : "success",
    },
    {
      id: "revenue-at-risk",
      title: "Revenue at risk",
      value: formatCurrency(revenueAtRisk),
      description: "Monthly revenue tied to high-priority accounts.",
      href: "/profitability",
      tone: revenueAtRisk > 0 ? "warning" : "success",
    },
    {
      id: "low-profitability",
      title: "Low profitability",
      value: lowProfitabilityClients,
      description: "Clients below a 20% margin threshold.",
      href: "/profitability",
      tone: lowProfitabilityClients > 0 ? "warning" : "success",
    },
    {
      id: "inactive-clients",
      title: "Inactive clients",
      value: inactiveClients,
      description: "Accounts with no recent workspace activity.",
      href: "/clients",
      tone: inactiveClients > 0 ? "info" : "success",
    },
  ];
}

export function buildCustomerSuccessCategories(
  snapshot: OperationalSnapshot,
): CustomerSuccessCategory[] {
  const priorities = rankClientPriorities(snapshot.clients);

  const needsReport = snapshot.clients.filter(isReportOverdue);
  const needsFollowUp = snapshot.clients.filter(
    (client) =>
      client.profitability.health === "watch" ||
      client.recentActivityCount === 0 ||
      client.openIncidents > 0,
  );
  const highRisk = priorities.filter(
    (priority) => priority.severity === "High" || priority.severity === "Critical",
  );
  const healthy = snapshot.clients.filter(
    (client) =>
      client.profitability.health === "healthy" &&
      calculateClientPriority(client).score < ATTENTION_SCORE_THRESHOLD,
  );
  const inactive = snapshot.clients.filter((client) => client.recentActivityCount === 0);
  const revenueOpportunity = snapshot.clients.filter(
    (client) =>
      client.profitability.health === "healthy" &&
      client.profitability.monthlyRevenue > 0 &&
      (client.profitability.margin ?? 0) >= 30,
  );

  return [
    {
      id: "needs-report",
      label: "Needs Report",
      count: needsReport.length,
      description: "Publish or schedule the next client report.",
      href: "/reports",
      tone: needsReport.length > 0 ? "warning" : "success",
    },
    {
      id: "needs-follow-up",
      label: "Needs Follow-up",
      count: needsFollowUp.length,
      description: "Accounts needing proactive customer success outreach.",
      href: "/clients/success",
      tone: needsFollowUp.length > 0 ? "warning" : "default",
    },
    {
      id: "high-risk",
      label: "High Risk",
      count: highRisk.length,
      description: "Priority accounts with elevated operational risk.",
      href: "/risks?tab=open",
      tone: highRisk.length > 0 ? "danger" : "success",
    },
    {
      id: "healthy",
      label: "Healthy",
      count: healthy.length,
      description: "Stable accounts with healthy delivery signals.",
      href: "/clients",
      tone: "success",
    },
    {
      id: "inactive",
      label: "Inactive",
      count: inactive.length,
      description: "Clients without recent workspace activity.",
      href: "/clients",
      tone: inactive.length > 0 ? "info" : "default",
    },
    {
      id: "revenue-opportunity",
      label: "Revenue Opportunity",
      count: revenueOpportunity.length,
      description: "Healthy, profitable accounts ready for expansion.",
      href: "/profitability",
      tone: "info",
    },
  ];
}

const TIMELINE_EVENT_TYPES = new Set([
  "report.published",
  "report.generated",
  "risk.created",
  "risk.resolved",
  "risk.mitigated",
  "incident.created",
  "incident.resolved",
  "health.changed",
  "client.updated",
  "client.created",
]);

function categorizeTimelineEvent(eventType: string): string {
  if (eventType.startsWith("report.")) return "Report";
  if (eventType.startsWith("risk.")) return "Risk";
  if (eventType.startsWith("incident.")) return "Incident";
  if (eventType.startsWith("health.")) return "Health";
  if (eventType.startsWith("client.")) return "Client";
  return "Activity";
}

export function buildSmartTimeline(events: ActivityEventView[]): SmartTimelineEvent[] {
  return events
    .filter((event) => TIMELINE_EVENT_TYPES.has(event.event_type))
    .map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      category: categorizeTimelineEvent(event.event_type),
      href: getActivityEntityHref(event.entity_type, event.entity_id),
      createdAt: event.created_at,
      relativeTime: formatActivityRelativeTime(event.created_at),
    }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function buildPriorityClientSummaries(snapshot: OperationalSnapshot) {
  return rankClientPriorities(snapshot.clients).slice(0, 5);
}

export function describePrioritySeverity(score: number): PrioritySeverity {
  return severityFromScore(score);
}
