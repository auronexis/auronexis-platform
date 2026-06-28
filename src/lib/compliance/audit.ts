import "server-only";

import { recordAuditEvent } from "@/lib/audit/events";
import { logDataAccess } from "@/lib/compliance/security";

export async function recordComplianceAudit(input: {
  organizationId: string;
  userId: string;
  entityType: string;
  entityId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await recordAuditEvent({
    organizationId: input.organizationId,
    userId: input.userId,
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType,
    source: "compliance",
    metadata: input.metadata,
  });

  await logDataAccess({
    organizationId: input.organizationId,
    userId: input.userId,
    resourceType: input.entityType,
    resourceId: input.entityId ?? null,
    action: input.eventType,
  });
}
