import "server-only";

import {
  buildPlatformEventId,
  buildWorkflowEngineEvent,
  dispatchWorkflowEngine,
} from "@/lib/automation/engine-v2";

import type { AutomationEvent } from "@/lib/automation/types";

/** Fire user-defined workflows after a successful platform event. */
export async function fireWorkflowEngine(input: {
  trigger: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  clientId?: string | null;
  actorUserId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const eventId = buildPlatformEventId([
    input.organizationId,
    input.trigger,
    input.entityType,
    input.entityId,
    input.clientId ?? "",
    JSON.stringify(input.payload ?? {}),
  ]);

  const event = buildWorkflowEngineEvent({
    ...input,
    eventId,
  });

  if (!event) return;
  await dispatchWorkflowEngine(event);
}

/** Bridge legacy automation events into the workflow engine v2. */
export async function fireWorkflowEngineFromAutomationEvent(
  event: AutomationEvent,
): Promise<void> {
  await fireWorkflowEngine({
    trigger: event.trigger,
    organizationId: event.organizationId,
    entityType: event.entityType,
    entityId: event.entityId,
    clientId: event.clientId,
    actorUserId: event.actorUserId,
    payload: (event.payload ?? {}) as Record<string, unknown>,
  });
}
