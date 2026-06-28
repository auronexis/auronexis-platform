import { createAdminClient } from "@/lib/supabase/admin";
import type { RecordActivityInput } from "@/lib/activity/types";

/** Insert an activity event via service role — server actions only. */
export async function recordActivityEvent(input: RecordActivityInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("activity_events").insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId ?? null,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    title: input.title,
    description: input.description ?? null,
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    console.error("[activity] failed to record event:", error.message);
  }
}
