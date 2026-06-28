"use server";

import {
  buildManualWorkflowEvent,
  buildPlatformEventId,
  buildWorkflowEngineEvent,
  dispatchWorkflowEngine,
  runWorkflowManually,
} from "@/lib/automation/engine-v2";
import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { requirePermission } from "@/lib/rbac/guards";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function dispatchWorkflowEngineEvent(input: {
  trigger: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  clientId?: string | null;
  actorUserId?: string | null;
  eventId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const event = buildWorkflowEngineEvent(input);
  if (!event) return;
  await dispatchWorkflowEngine(event);
}

export async function runWorkflowManuallyAction(
  workflowId: string,
): Promise<ActionResult<{ executionId: string; status: string }>> {
  try {
    const session = await requireSession();
    const access = await checkPlanFeatureForSession(session, "ai_automation_builder");
    if (!access.allowed) {
      return { ok: false, error: access.message };
    }

    requirePermission(session.role, "workflows", "manage");

    const { getWorkflowRow } = await import("@/lib/automation/storage/queries");
    const { rowToWorkflowDefinition } = await import("@/lib/automation/storage/types");
    const row = await getWorkflowRow(
      { organizationId: session.organization.id, userId: session.user.id },
      workflowId,
    );
    if (!row) {
      return { ok: false, error: "Workflow not found." };
    }

    const workflow = rowToWorkflowDefinition(row);
    const event = buildManualWorkflowEvent(
      workflow,
      session.organization.id,
      session.user.id,
    );

    const result = await runWorkflowManually(
      { organizationId: session.organization.id, userId: session.user.id },
      workflowId,
      event,
    );

    return {
      ok: true,
      data: { executionId: result.executionId, status: result.status },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Manual run failed.",
    };
  }
}

export { buildPlatformEventId, buildWorkflowEngineEvent, dispatchWorkflowEngine };
