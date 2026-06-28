import type { AuditEventView, AuditSeverity } from "@/lib/compliance/types";

export function buildAuditEventView(row: {
  id: string;
  organization_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  event_type: string;
  severity: AuditSeverity;
  ip_address: string | null;
  user_agent: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}): AuditEventView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    eventType: row.event_type,
    severity: row.severity,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    source: row.source,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    deepLink: buildAuditDeepLink(row.entity_type, row.entity_id),
  };
}

export function buildAuditDeepLink(entityType: string, entityId: string | null): string | null {
  if (!entityId) {
    return null;
  }

  switch (entityType) {
    case "client":
      return `/clients/${entityId}`;
    case "report":
      return `/reports/${entityId}`;
    case "risk":
      return `/risks/${entityId}`;
    case "incident":
      return `/incidents/${entityId}`;
    case "organization":
      return `/settings/organization`;
    case "team":
      return `/settings/team`;
    default:
      return null;
  }
}

export function buildActivityEventType(action: string, entityType: string): string {
  return `${entityType}_${action}`.replace(/-/g, "_");
}
