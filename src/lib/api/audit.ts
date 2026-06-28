import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEntityType } from "@/lib/activity/types";

export async function recordApiRequestLog(input: {
  organizationId: string;
  apiKeyId: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  rateLimited?: boolean;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("api_request_logs").insert({
    organization_id: input.organizationId,
    api_key_id: input.apiKeyId,
    method: input.method,
    path: input.path,
    status_code: input.statusCode,
    duration_ms: input.durationMs,
    rate_limited: input.rateLimited ?? false,
  } as never);

  if (error) {
    console.error("[api] failed to record request log:", error.message);
  }
}

export async function recordApiAuditEvent(input: {
  organizationId: string;
  actorUserId: string | null;
  action: string;
  title: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordActivityEvent({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId ?? undefined,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    action: input.action,
    title: input.title,
    metadata: {
      source: "public_api",
      ...(input.metadata ?? {}),
    },
  });
}
