import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type RecordPredictiveActivityInput = {
  organizationId: string;
  actorUserId?: string | null;
  eventType: ActivityEventType;
  message?: string | null;
  metadata?: Record<string, unknown>;
  entityType?: "organization" | "client";
  entityId?: string | null;
};

/** Dual-write predictive activity — never throws. */
export async function recordPredictiveActivity(input: RecordPredictiveActivityInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("predictive_activity").insert({
      organization_id: input.organizationId,
      event_type: input.eventType,
      message: input.message ?? null,
      metadata: (input.metadata ?? {}) as Json,
    } as never);
  } catch (error) {
    console.warn("[predictive] failed to record predictive_activity:", error);
  }

  try {
    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType ?? "organization",
      entityId: input.entityId ?? input.organizationId,
      action: input.eventType,
      title: input.message ?? input.eventType,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.warn("[predictive] failed to record activity_events:", error);
  }
}

export async function recordPredictiveActivitySafe(
  input: RecordPredictiveActivityInput,
): Promise<void> {
  await recordPredictiveActivity(input);
}
