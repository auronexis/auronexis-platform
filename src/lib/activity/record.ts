import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RecordActivityInput } from "@/lib/activity/types";

function resolveEventFields(input: RecordActivityInput): { eventType: string; action: string } {
  const eventType = input.eventType ?? input.action ?? "unknown";
  const action = input.action ?? eventType.split(".").pop() ?? eventType;

  return { eventType, action };
}

/** Insert an activity event — never throws; failures are logged only. */
export async function recordActivityEvent(input: RecordActivityInput): Promise<void> {
  try {
    let organizationId = input.organizationId;
    let actorUserId = input.actorUserId;

    if (!organizationId || actorUserId === undefined) {
      const session = await getSession();
      if (session) {
        organizationId ??= session.organization.id;
        if (actorUserId === undefined) {
          actorUserId = session.user.id;
        }
      }
    }

    if (!organizationId) {
      console.warn("[activity] skipped event — missing organizationId");
      return;
    }

    const { eventType, action } = resolveEventFields(input);
    const admin = createAdminClient();

    const insertPayload = {
      organization_id: organizationId,
      actor_user_id: actorUserId ?? null,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action,
      event_type: eventType,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
    };

    let { error } = await admin.from("activity_events").insert(insertPayload as never);

    if (error?.message.toLowerCase().includes("event_type")) {
      const legacyPayload = { ...insertPayload };
      delete (legacyPayload as { event_type?: string }).event_type;
      ({ error } = await admin.from("activity_events").insert(legacyPayload as never));
    }

    if (error) {
      console.warn("[activity] failed to record event:", error.message);
    }
  } catch (error) {
    console.warn("[activity] failed to record event:", error);
  }
}

/** Alias for recordActivityEvent — Sprint 7 canonical entry point. */
export const recordActivity = recordActivityEvent;
