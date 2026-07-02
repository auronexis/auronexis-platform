import type { Json } from "@/types/database";

export type ActivityEntityType =
  | "client"
  | "risk"
  | "incident"
  | "report"
  | "financial"
  | "team"
  | "organization";

/** Canonical dot-notation event types for Sprint 7 activity producers. */
export type ActivityEventType =
  | "client.created"
  | "client.updated"
  | "client.archived"
  | "client.deleted"
  | "team.invited"
  | "team.role_updated"
  | "team.user_disabled"
  | "team.user_reactivated"
  | "sla.created"
  | "sla.started"
  | "sla.updated"
  | "sla.responded"
  | "sla.breached"
  | "sla.resolved"
  | "sla.completed"
  | "sla.policy_assigned"
  | "sla.deleted"
  | "report.created"
  | "report.updated"
  | "report.generated"
  | "report.published"
  | "report.archived"
  | "report.versioned"
  | "settings.updated"
  | "health.changed"
  | "portal.login"
  | "portal.viewed"
  | "risk.created"
  | "risk.updated"
  | "risk.assigned"
  | "risk.score_changed"
  | "risk.status_changed"
  | "risk.accepted"
  | "risk.acknowledged"
  | "risk.mitigated"
  | "risk.resolved"
  | "risk.dismissed"
  | "risk.deleted"
  | "risk.detected"
  | "incident.created"
  | "incident.assigned"
  | "incident.status_changed"
  | "incident.resolved"
  | "incident.closed"
  | "monitoring.connector_created"
  | "monitoring.connector_updated"
  | "monitoring.connector_failed"
  | "monitoring.connector_recovered"
  | "monitoring.event_detected"
  | "monitoring.health_checked"
  | "incident.ai_analysis_created"
  | "incident.ai_summary_generated"
  | "incident.ai_recommendation_created";

export type ActivityFilter =
  | "all"
  | "clients"
  | "risks"
  | "incidents"
  | "reports"
  | "team"
  | "financial";

export const ACTIVITY_ENTITY_LABELS: Record<ActivityEntityType, string> = {
  client: "Client",
  risk: "Risk",
  incident: "Incident",
  report: "Report",
  financial: "Financial",
  team: "Team",
  organization: "Organization",
};

export const ACTIVITY_EVENT_TYPE_LABELS: Record<ActivityEventType, string> = {
  "client.created": "Client created",
  "client.updated": "Client updated",
  "client.archived": "Client archived",
  "client.deleted": "Client deleted",
  "team.invited": "Team invited",
  "team.role_updated": "Role updated",
  "team.user_disabled": "User disabled",
  "team.user_reactivated": "User reactivated",
  "sla.created": "SLA created",
  "sla.started": "SLA started",
  "sla.updated": "SLA updated",
  "sla.responded": "SLA responded",
  "sla.breached": "SLA breached",
  "sla.resolved": "SLA resolved",
  "sla.completed": "SLA completed",
  "sla.policy_assigned": "SLA policy assigned",
  "sla.deleted": "SLA deleted",
  "report.created": "Report created",
  "report.updated": "Report updated",
  "report.generated": "Report generated",
  "report.published": "Report published",
  "report.archived": "Report archived",
  "report.versioned": "Report versioned",
  "settings.updated": "Settings updated",
  "health.changed": "Health changed",
  "portal.login": "Portal login",
  "portal.viewed": "Portal viewed",
  "risk.created": "Risk created",
  "risk.updated": "Risk updated",
  "risk.assigned": "Risk assigned",
  "risk.score_changed": "Risk score changed",
  "risk.status_changed": "Risk status changed",
  "risk.accepted": "Risk accepted",
  "risk.acknowledged": "Risk acknowledged",
  "risk.mitigated": "Risk mitigated",
  "risk.resolved": "Risk resolved",
  "risk.dismissed": "Risk dismissed",
  "risk.deleted": "Risk deleted",
  "risk.detected": "Risk detected",
  "incident.created": "Incident created",
  "incident.assigned": "Incident assigned",
  "incident.status_changed": "Incident status changed",
  "incident.resolved": "Incident resolved",
  "incident.closed": "Incident closed",
  "monitoring.connector_created": "Monitoring connector created",
  "monitoring.connector_updated": "Monitoring connector updated",
  "monitoring.connector_failed": "Monitoring connector failed",
  "monitoring.connector_recovered": "Monitoring connector recovered",
  "monitoring.event_detected": "Monitoring event detected",
  "monitoring.health_checked": "Monitoring health checked",
  "incident.ai_analysis_created": "AI incident analysis created",
  "incident.ai_summary_generated": "AI incident summary generated",
  "incident.ai_recommendation_created": "AI incident recommendations created",
};

export const ACTIVITY_FILTER_LABELS: Record<ActivityFilter, string> = {
  all: "All",
  clients: "Clients",
  risks: "Risks",
  incidents: "Incidents",
  reports: "Reports",
  team: "Team",
  financial: "Financial",
};

export const FILTER_TO_ENTITY_TYPE: Record<
  Exclude<ActivityFilter, "all">,
  ActivityEntityType
> = {
  clients: "client",
  risks: "risk",
  incidents: "incident",
  reports: "report",
  team: "team",
  financial: "financial",
};

export type ActivityEventView = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  event_type: string;
  action: string;
  title: string;
  description: string | null;
  metadata: Json;
  created_at: string;
  actor: { full_name: string } | null;
};

export type RecordActivityInput = {
  organizationId?: string;
  actorUserId?: string | null;
  entityType: ActivityEntityType;
  entityId?: string | null;
  /** Preferred canonical event type (e.g. client.created). */
  eventType?: ActivityEventType | string;
  /** Legacy action slug — kept for backward compatibility with existing producers. */
  action?: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export function formatActivityEventType(eventType: string): string {
  if (eventType in ACTIVITY_EVENT_TYPE_LABELS) {
    return ACTIVITY_EVENT_TYPE_LABELS[eventType as ActivityEventType];
  }

  return eventType
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function formatActivityTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatActivityRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 48) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 14) {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(diffDays, "day");
  }

  return formatActivityTimestamp(value);
}

export function getActivityEntityHref(
  entityType: ActivityEntityType,
  entityId: string | null,
): string | null {
  if (!entityId) {
    return null;
  }

  switch (entityType) {
    case "client":
      return `/clients/${entityId}`;
    case "risk":
      return `/risks/${entityId}`;
    case "incident":
      return `/incidents/${entityId}`;
    case "report":
      return `/reports/${entityId}`;
    case "financial":
      return `/profitability`;
    case "team":
      return `/settings/team`;
    case "organization":
      return `/settings/organization`;
    default:
      return null;
  }
}
