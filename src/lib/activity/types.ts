import type { Json } from "@/types/database";

export type ActivityEntityType =
  | "client"
  | "risk"
  | "incident"
  | "report"
  | "financial"
  | "team"
  | "organization";

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
  action: string;
  title: string;
  description: string | null;
  metadata: Json;
  created_at: string;
  actor: { full_name: string } | null;
};

export type RecordActivityInput = {
  organizationId: string;
  actorUserId?: string | null;
  entityType: ActivityEntityType;
  entityId?: string | null;
  action: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export function formatActivityTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
