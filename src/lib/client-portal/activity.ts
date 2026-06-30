import { recordActivityEvent } from "@/lib/activity/record";
import type { ClientPortalSessionContext } from "@/lib/client-portal/types";

type PortalActivityInput = {
  eventType: "portal.login" | "portal.viewed";
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

/** Record a portal activity event — never throws. */
export async function recordPortalActivity(
  session: ClientPortalSessionContext,
  input: PortalActivityInput,
): Promise<void> {
  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: null,
    entityType: "client",
    entityId: session.client.id,
    eventType: input.eventType,
    action: input.eventType.split(".").pop() ?? "viewed",
    title: input.title,
    description: input.description ?? null,
    metadata: {
      portal_user_id: session.portalUser.id,
      client_id: session.client.id,
      ...input.metadata,
    },
  });
}
