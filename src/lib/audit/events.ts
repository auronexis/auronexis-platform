import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditSeverity } from "@/lib/compliance/types";

export type RecordAuditEventInput = {
  organizationId: string;
  userId?: string | null;
  entityType: string;
  entityId?: string | null;
  eventType: string;
  severity?: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  source?: string;
  metadata?: Record<string, unknown>;
  skipDuplicateCheck?: boolean;
};

export async function getRequestAuditContext(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  const headerStore = await headers();
  return {
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      null,
    userAgent: headerStore.get("user-agent"),
  };
}

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  const admin = createAdminClient();
  const requestContext = input.ipAddress || input.userAgent ? null : await getRequestAuditContext();

  const payload = {
    organization_id: input.organizationId,
    user_id: input.userId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    event_type: input.eventType,
    severity: input.severity ?? "info",
    ip_address: input.ipAddress ?? requestContext?.ipAddress ?? null,
    user_agent: input.userAgent ?? requestContext?.userAgent ?? null,
    source: input.source ?? "application",
    metadata: input.metadata ?? {},
  };

  const { error } = await admin.from("audit_events").insert(payload as never);

  if (error) {
    console.error("[audit] failed to record event:", error.message);
  }
}

export const AUDIT_EVENT_TYPES = [
  "client_created",
  "report_published",
  "workflow_executed",
  "api_key_created",
  "invoice_paid",
  "connector_connected",
  "oauth_authorized",
  "secret_rotated",
  "branding_published",
  "automation_activated",
  "ai_generation_completed",
  "gdpr_request_created",
  "security_incident_created",
  "audit_export_requested",
  "policy_updated",
  "consent_recorded",
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];
