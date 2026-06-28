import "server-only";

import { executeWorkflow } from "@/lib/automation/engine-v2/executor";
import { loadActiveWorkflowsForTrigger } from "@/lib/automation/engine-v2/triggers";
import type { WorkflowEngineEvent, WorkflowRunResult } from "@/lib/automation/engine-v2/types";
import { toWorkflowEngineError } from "@/lib/automation/engine-v2/errors";
import { checkPlanFeature } from "@/lib/plans/guards";
import type { AutomationRepositoryContext } from "@/lib/automation/storage/types";

/**
 * Dispatch a platform event to all matching active workflows.
 * Non-blocking — errors are logged, never thrown to callers.
 */
export async function dispatchWorkflowEngine(event: WorkflowEngineEvent): Promise<void> {
  const access = await checkPlanFeature(event.organizationId, "ai_automation_builder");
  if (!access.allowed) {
    return;
  }

  const ctx: AutomationRepositoryContext = {
    organizationId: event.organizationId,
    userId: event.actorUserId ?? "system",
  };

  try {
    const candidates = await loadActiveWorkflowsForTrigger(ctx, event.trigger);
    if (candidates.length === 0) {
      return;
    }

    for (const candidate of candidates) {
      try {
        await executeWorkflow(ctx, candidate.workflow, event);
      } catch (error) {
        const normalized = toWorkflowEngineError(error);
        console.error(
          `[workflow-engine] workflow ${candidate.workflow.id} failed:`,
          normalized.message,
        );
      }
    }
  } catch (error) {
    const normalized = toWorkflowEngineError(error);
    console.error(`[workflow-engine] dispatch failed for ${event.trigger}:`, normalized.message);
  }
}

export async function runWorkflowManually(
  ctx: AutomationRepositoryContext,
  workflowId: string,
  event: WorkflowEngineEvent,
): Promise<WorkflowRunResult> {
  const { getWorkflowRow } = await import("@/lib/automation/storage/queries");
  const { rowToWorkflowDefinition } = await import("@/lib/automation/storage/types");

  const row = await getWorkflowRow(ctx, workflowId);
  if (!row) {
    throw new Error("Workflow not found.");
  }

  const workflow = rowToWorkflowDefinition(row);
  return executeWorkflow(ctx, workflow, event, {
    manual: true,
    initiatedBy: `user:${ctx.userId}`,
  });
}
