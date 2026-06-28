import "server-only";

import type { RecordAuditEventInput } from "@/lib/audit/events";
import { recordAuditEvent } from "@/lib/audit/events";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AuditEventView,
  AuditSearchFilters,
  AuditSearchResult,
} from "@/lib/compliance/types";
import { mapActivityToAuditEvents, searchAuditEvents } from "@/lib/audit/search";
import type { SessionContext } from "@/lib/tenancy/context";

export async function listAuditTimeline(
  session: SessionContext,
  filters: AuditSearchFilters = {},
): Promise<AuditSearchResult> {
  return searchAuditEvents(session.organization.id, filters);
}

export async function countAuditEvents(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function countAuditEventsSince(
  organizationId: string,
  since: string,
): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("audit_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function getLatestAuditExport(session: SessionContext): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("audit_exports")
    .select("completed_at, created_at")
    .eq("organization_id", session.organization.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as { completed_at: string | null; created_at: string } | null;
  return row?.completed_at ?? row?.created_at ?? null;
}

export async function mirrorRecentActivityToAudit(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("activity_events")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);

  const events = mapActivityToAuditEvents((data ?? []) as never[]);
  let inserted = 0;

  for (const event of events) {
    await recordAuditEvent({
      ...event,
      organizationId,
      skipDuplicateCheck: true,
    } as RecordAuditEventInput);
    inserted += 1;
  }

  return inserted;
}

export type { AuditEventView, AuditSearchResult };
