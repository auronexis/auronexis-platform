import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { countAuditEvents } from "@/lib/compliance/queries";
import type { SessionContext } from "@/lib/tenancy/context";

type EvidenceSourceTable =
  | "activity_events"
  | "billing_events"
  | "automation_executions"
  | "integration_sync_jobs"
  | "api_request_logs"
  | "ai_usage_events"
  | "security_incidents";

export type EvidenceSnapshot = {
  generatedAt: string;
  sources: Record<string, number | boolean | string | null>;
};

export async function generateEvidenceSnapshot(session: SessionContext): Promise<EvidenceSnapshot> {
  const admin = createAdminClient();
  const orgId = session.organization.id;

  const [
    auditEvents,
    activityCount,
    billingEvents,
    automationExecutions,
    connectorSyncs,
    apiLogs,
    aiUsage,
    securityIncidents,
  ] = await Promise.all([
    countAuditEvents(orgId),
    countTable(admin, "activity_events", orgId),
    countTable(admin, "billing_events", orgId),
    countTable(admin, "automation_executions", orgId),
    countTable(admin, "integration_sync_jobs", orgId),
    countTable(admin, "api_request_logs", orgId),
    countTable(admin, "ai_usage_events", orgId),
    countTable(admin, "security_incidents", orgId),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    sources: {
      audit_events: auditEvents,
      activity_events: activityCount,
      billing_events: billingEvents,
      workflow_executions: automationExecutions,
      connector_syncs: connectorSyncs,
      api_logs: apiLogs,
      ai_usage_events: aiUsage,
      security_incidents: securityIncidents,
      secrets_module: "integration_secrets",
      oauth_events: "integration_oauth_states",
    },
  };
}

async function countTable(
  admin: ReturnType<typeof createAdminClient>,
  table: EvidenceSourceTable,
  organizationId: string,
): Promise<number> {
  const { count, error } = await admin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

export function serializeEvidenceSnapshot(snapshot: EvidenceSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
