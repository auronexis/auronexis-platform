import "server-only";

import { buildActivityEventType, buildAuditEventView } from "@/lib/audit/builder";
import { normalizeAuditFilters } from "@/lib/audit/filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActivityEntityType } from "@/lib/activity/types";
import type { AuditEventView, AuditSearchFilters, AuditSearchResult } from "@/lib/compliance/types";

type ActivityRow = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  title: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function mapActivityToAuditEvents(rows: ActivityRow[]): Array<{
  userId: string | null;
  entityType: string;
  entityId: string | null;
  eventType: string;
  source: string;
  metadata: Record<string, unknown>;
}> {
  return rows.map((row) => ({
    userId: row.actor_user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    eventType: buildActivityEventType(row.action, row.entity_type),
    source: "activity_feed",
    metadata: {
      title: row.title,
      ...(row.metadata ?? {}),
      activityEventId: row.id,
    },
  }));
}

function mapActivityRow(row: ActivityRow): AuditEventView {
  return buildAuditEventView({
    id: `activity-${row.id}`,
    organization_id: row.organization_id,
    user_id: row.actor_user_id,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    event_type: buildActivityEventType(row.action, row.entity_type),
    severity: "info",
    ip_address: null,
    user_agent: null,
    source: "activity_feed",
    metadata: { title: row.title, ...(row.metadata ?? {}), activityEventId: row.id },
    created_at: row.created_at,
  });
}

export async function searchAuditEvents(
  organizationId: string,
  filters: AuditSearchFilters,
): Promise<AuditSearchResult> {
  const normalized = normalizeAuditFilters(filters);
  const supabase = await createClient();
  const page = normalized.page ?? 1;
  const pageSize = normalized.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let auditQuery = supabase
    .from("audit_events")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (normalized.entityType) auditQuery = auditQuery.eq("entity_type", normalized.entityType);
  if (normalized.eventType) auditQuery = auditQuery.eq("event_type", normalized.eventType);
  if (normalized.severity) auditQuery = auditQuery.eq("severity", normalized.severity);
  if (normalized.dateFrom) auditQuery = auditQuery.gte("created_at", normalized.dateFrom);
  if (normalized.dateTo) auditQuery = auditQuery.lte("created_at", normalized.dateTo);
  if (normalized.query) {
    auditQuery = auditQuery.or(
      `event_type.ilike.%${normalized.query}%,entity_type.ilike.%${normalized.query}%`,
    );
  }

  auditQuery = auditQuery.range(from, to);
  const { data: auditRows, count: auditCount } = await auditQuery;

  const auditItems = ((auditRows ?? []) as Array<Record<string, unknown>>).map((row) =>
    buildAuditEventView(row as never),
  );

  if (auditItems.length >= pageSize) {
    return {
      items: auditItems,
      total: auditCount ?? auditItems.length,
      page,
      pageSize,
      hasMore: (auditCount ?? 0) > page * pageSize,
    };
  }

  const admin = createAdminClient();
  let activityQuery = admin
    .from("activity_events")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(pageSize);

  if (normalized.entityType) {
    activityQuery = activityQuery.eq(
      "entity_type",
      normalized.entityType as ActivityEntityType,
    );
  }
  if (normalized.dateFrom) activityQuery = activityQuery.gte("created_at", normalized.dateFrom);
  if (normalized.dateTo) activityQuery = activityQuery.lte("created_at", normalized.dateTo);

  const { data: activityRows } = await activityQuery;
  const activityItems = ((activityRows ?? []) as ActivityRow[])
    .map(mapActivityRow)
    .filter((item) => {
      if (normalized.eventType && item.eventType !== normalized.eventType) return false;
      if (normalized.query) {
        const q = normalized.query.toLowerCase();
        return item.eventType.includes(q) || item.entityType.includes(q);
      }
      return true;
    });

  const merged = [...auditItems, ...activityItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, pageSize);

  return {
    items: merged,
    total: (auditCount ?? 0) + activityItems.length,
    page,
    pageSize,
    hasMore: merged.length >= pageSize,
  };
}
