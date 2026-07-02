import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";

export async function recordEnterpriseActivity(input: {
  organizationId: string;
  actorUserId?: string | null;
  eventType:
    | "enterprise.request_created"
    | "enterprise.request_approved"
    | "enterprise.request_rejected"
    | "enterprise.override_updated";
  title: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordActivityEvent({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId ?? null,
    entityType: "organization",
    entityId: input.organizationId,
    eventType: input.eventType,
    action: input.eventType.replace(/\./g, "_"),
    title: input.title,
    metadata: input.metadata ?? {},
  });
}

export async function recordEnterpriseActivitySafe(input: {
  organizationId: string;
  actorUserId?: string | null;
  eventType:
    | "enterprise.request_created"
    | "enterprise.request_approved"
    | "enterprise.request_rejected"
    | "enterprise.override_updated";
  title: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordEnterpriseActivity(input).catch(() => undefined);
}
