import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import { createAdminClient } from "@/lib/supabase/admin";

export type IncidentActivityEventType =
  | "incident.created"
  | "incident.assigned"
  | "incident.status_changed"
  | "incident.resolved"
  | "incident.closed";

export type RecordIncidentActivityInput = {
  organizationId: string;
  incidentId: string;
  actorUserId: string | null;
  eventType: IncidentActivityEventType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

/** Persist incident timeline entry and global activity feed event. */
export async function recordIncidentActivity(input: RecordIncidentActivityInput): Promise<void> {
  try {
    const admin = createAdminClient();
    const metadata = input.metadata ?? {};

    const { error: timelineError } = await admin.from("incident_activity").insert({
      organization_id: input.organizationId,
      incident_id: input.incidentId,
      actor_user_id: input.actorUserId,
      event_type: input.eventType,
      title: input.title,
      description: input.description ?? null,
      metadata,
    } as never);

    if (timelineError) {
      console.warn("[incidents] incident_activity insert failed:", timelineError.message);
    }

    await recordActivityEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      entityType: "incident",
      entityId: input.incidentId,
      eventType: input.eventType,
      action: input.eventType.split(".")[1] ?? "updated",
      title: input.title,
      description: input.description ?? undefined,
      metadata: { incidentId: input.incidentId, ...metadata },
    });
  } catch (error) {
    console.warn("[incidents] activity recording failed:", error);
  }
}
