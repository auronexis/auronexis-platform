import "server-only";

import { createHash, randomUUID } from "crypto";
import { recordActivityEvent } from "@/lib/activity/record";
import { executeWorkflowAction } from "@/lib/automation/engine-v2/actions";
import { buildExecutionContext } from "@/lib/automation/engine-v2/context";
import { evaluateWorkflowConditionsDetailed } from "@/lib/automation/engine-v2/conditions";
import { buildTriggerHash } from "@/lib/automation/engine-v2/events";
import { assertExecutableWorkflow } from "@/lib/automation/engine-v2/guards";
import type {
  ExecuteWorkflowOptions,
  WorkflowEngineEvent,
  WorkflowRunResult,
} from "@/lib/automation/engine-v2/types";
import type { WorkflowDefinition, WorkflowExecutionStep } from "@/lib/automation/builder/types";
import {
  appendExecutionStep,
  completeExecution,
  createExecution,
} from "@/lib/automation/storage/executions";
import { findExecutionByTriggerHash } from "@/lib/automation/storage/queries";
import type { AutomationRepositoryContext } from "@/lib/automation/storage/types";
import type { AutomationExecutionStatus } from "@/types/database";

function resolveFinalStatus(
  steps: WorkflowExecutionStep[],
  conditionsMatched: boolean,
): AutomationExecutionStatus {
  if (!conditionsMatched) return "skipped";
  if (steps.length === 0) return "completed";

  const failed = steps.filter((step) => step.status === "failed").length;
  const success = steps.filter((step) => step.status === "success").length;

  if (failed > 0 && success > 0) return "partial";
  if (failed > 0) return "failed";
  return "completed";
}

export async function executeWorkflow(
  ctx: AutomationRepositoryContext,
  workflowInput: WorkflowDefinition,
  event: WorkflowEngineEvent,
  options: ExecuteWorkflowOptions = {},
): Promise<WorkflowRunResult> {
  const startedAt = Date.now();
  const workflow = assertExecutableWorkflow(workflowInput);
  const triggerHash = buildTriggerHash(workflow.id, event);
  const eventId = event.eventId ?? triggerHash;

  if (!options.manual && !options.simulated) {
    const duplicate = await findExecutionByTriggerHash(ctx, workflow.id, triggerHash);
    if (duplicate) {
      return {
        executionId: duplicate.id,
        workflowId: workflow.id,
        status: "skipped",
        conditionsMatched: false,
        steps: [],
        executedActions: [],
        errors: ["Duplicate event skipped"],
        durationMs: 0,
        skippedDuplicate: true,
      };
    }
  }

  const context = buildExecutionContext(event);
  const conditionResult = evaluateWorkflowConditionsDetailed(workflow, context);
  const initiatedBy =
    options.initiatedBy ??
    (options.manual ? "manual" : event.actorUserId ? `user:${event.actorUserId}` : "system");

  const execution = await createExecution(ctx, {
    workflowId: workflow.id,
    trigger: event.trigger,
    initiatedBy,
    simulated: Boolean(options.simulated),
    entityType: event.entityType,
    entityId: event.entityId,
    eventId,
    triggerHash,
    status: "running",
    executionLog: {
      workflowName: workflow.name,
      conditionsMatched: conditionResult.matched,
      conditionDetails: conditionResult.details,
    },
  });

  const steps: WorkflowExecutionStep[] = [];
  const executedActions: string[] = [];
  const errors: string[] = [];

  await appendExecutionStep({
    executionId: execution.id,
    orderIndex: 0,
    action: "conditions",
    status: conditionResult.matched ? "success" : "skipped",
    result: {
      message: conditionResult.matched ? "Conditions matched" : "Conditions not matched",
      details: conditionResult.details,
    },
    durationMs: 0,
  });

  steps.push({
    orderIndex: 0,
    action: "conditions",
    status: conditionResult.matched ? "success" : "skipped",
    message: conditionResult.matched ? "Conditions matched" : "Conditions not matched",
    durationMs: 0,
  });

  if (!conditionResult.matched) {
    const durationMs = Date.now() - startedAt;
    await completeExecution({
      executionId: execution.id,
      status: "skipped",
      durationMs,
      executionLog: {
        workflowName: workflow.name,
        conditionsMatched: false,
        conditionDetails: conditionResult.details,
        steps,
        executedActions,
        errors,
      },
    });

    await recordActivityEvent({
      organizationId: ctx.organizationId,
      actorUserId: event.actorUserId ?? null,
      entityType: "organization",
      entityId: workflow.id,
      action: "workflow_action_skipped",
      title: `Workflow skipped — ${workflow.name}`,
      metadata: {
        workflowId: workflow.id,
        executionId: execution.id,
        trigger: event.trigger,
        reason: "conditions_not_matched",
      },
    });

    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: "skipped",
      conditionsMatched: false,
      steps,
      executedActions,
      errors,
      durationMs,
    };
  }

  if (options.simulated) {
    const durationMs = Date.now() - startedAt;
    await completeExecution({
      executionId: execution.id,
      status: "simulation",
      durationMs,
      executionLog: {
        workflowName: workflow.name,
        conditionsMatched: true,
        steps,
        executedActions,
        errors,
      },
    });

    return {
      executionId: execution.id,
      workflowId: workflow.id,
      status: "simulation",
      conditionsMatched: true,
      steps,
      executedActions,
      errors,
      durationMs,
    };
  }

  let orderIndex = 1;
  for (const action of workflow.actions) {
    const outcome = await executeWorkflowAction({
      ctx,
      event,
      workflow,
      action,
      context,
      executionId: execution.id,
      forceSimulation: Boolean(options.simulated),
    });

    const stepStatus =
      outcome.status === "success"
        ? "success"
        : outcome.status === "failed"
          ? "failed"
          : "skipped";

    await appendExecutionStep({
      executionId: execution.id,
      orderIndex,
      action: action.type,
      status: stepStatus,
      result: { message: outcome.message },
      durationMs: outcome.durationMs,
    });

    steps.push({
      orderIndex,
      action: action.type,
      status: stepStatus,
      message: outcome.message,
      durationMs: outcome.durationMs,
    });

    if (outcome.status === "success") {
      executedActions.push(action.type);
    } else if (outcome.status === "failed") {
      errors.push(outcome.message);
    } else {
      await recordActivityEvent({
        organizationId: ctx.organizationId,
        actorUserId: event.actorUserId ?? null,
        entityType: "organization",
        entityId: workflow.id,
        action: "workflow_action_skipped",
        title: `Workflow action skipped — ${action.type}`,
        metadata: {
          workflowId: workflow.id,
          executionId: execution.id,
          actionType: action.type,
          reason: outcome.message,
        },
      });
    }

    orderIndex += 1;
  }

  const durationMs = Date.now() - startedAt;
  const finalStatus = resolveFinalStatus(steps.slice(1), true);

  await completeExecution({
    executionId: execution.id,
    status: finalStatus,
    durationMs,
    executionLog: {
      workflowName: workflow.name,
      conditionsMatched: true,
      conditionDetails: conditionResult.details,
      steps,
      executedActions,
      errors,
    },
  });

  await recordActivityEvent({
    organizationId: ctx.organizationId,
    actorUserId: event.actorUserId ?? null,
    entityType: "organization",
    entityId: workflow.id,
    action: finalStatus === "failed" ? "workflow_failed" : "workflow_executed",
    title:
      finalStatus === "failed"
        ? `Workflow failed — ${workflow.name}`
        : `Workflow executed — ${workflow.name}`,
    metadata: {
      workflowId: workflow.id,
      executionId: execution.id,
      trigger: event.trigger,
      status: finalStatus,
      durationMs,
      manual: Boolean(options.manual),
    },
  });

  if (options.manual) {
    await recordActivityEvent({
      organizationId: ctx.organizationId,
      actorUserId: event.actorUserId ?? null,
      entityType: "organization",
      entityId: workflow.id,
      action: "workflow_manual_run",
      title: `Manual workflow run — ${workflow.name}`,
      metadata: {
        workflowId: workflow.id,
        executionId: execution.id,
        status: finalStatus,
      },
    });
  }

  return {
    executionId: execution.id,
    workflowId: workflow.id,
    status: finalStatus,
    conditionsMatched: true,
    steps,
    executedActions,
    errors,
    durationMs,
  };
}

export function buildManualWorkflowEvent(
  workflow: WorkflowDefinition,
  organizationId: string,
  actorUserId: string,
): WorkflowEngineEvent {
  return {
    trigger: "manual_trigger",
    organizationId,
    entityType: "workflow",
    entityId: workflow.id,
    actorUserId,
    eventId: randomUUID(),
    payload: {
      title: workflow.name,
      trigger_type: workflow.trigger.type,
      status: workflow.status,
    },
  };
}

export function buildPlatformEventId(parts: string[]): string {
  return createHash("sha256").update(parts.join(":")).digest("hex").slice(0, 24);
}
