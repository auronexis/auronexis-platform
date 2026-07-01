import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEventType } from "@/lib/activity/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type SlaActivityEventType =
  | "sla.created"
  | "sla.started"
  | "sla.updated"
  | "sla.responded"
  | "sla.breached"
  | "sla.resolved"
  | "sla.completed"
  | "sla.policy_assigned";

export type RecordSlaActivityInput = {
  organizationId: string;
  eventType: SlaActivityEventType;
  actorUserId?: string | null;
  incidentId?: string | null;
  message: string;
  metadata?: Record<string, unknown>;
};

/** Persist SLA timeline entry and global activity feed event — never throws. */
export async function recordSLAActivity(input: RecordSlaActivityInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const metadata = input.metadata ?? {};

    const { error: timelineError } = await admin.from("sla_activity").insert({
      organization_id: input.organizationId,
      event_type: input.eventType,
      actor_user_id: input.actorUserId ?? null,
      incident_id: input.incidentId ?? null,
      message: input.message,
      metadata,
    } as never);

    if (timelineError) {
      console.warn("[sla] sla_activity insert failed:", timelineError.message);
    }

    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId ?? null,
      entityType: "incident",
      entityId: input.incidentId ?? null,
      eventType: input.eventType as ActivityEventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.message,
      metadata: { incidentId: input.incidentId, ...metadata },
    });
  } catch (error) {
    console.warn("[sla] activity recording failed:", error);
  }
}
