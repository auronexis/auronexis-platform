import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import { createClient } from "@/lib/supabase/server";
import type { WorkflowDefinition, WorkflowExecutionRecord } from "@/lib/automation/builder/types";
import { buildSimulatedExecutionRecord } from "@/lib/automation/builder/suggestions";
import {
  executionStatusToDb,
  rowToExecutionRecord,
  type AppendExecutionStepInput,
  type CompleteExecutionInput,
  type CreateExecutionInput,
  type AutomationRepositoryContext,
} from "@/lib/automation/storage/types";
import { getWorkflowRow } from "@/lib/automation/storage/queries";
import { listExecutionStepsByExecutionIds } from "@/lib/automation/storage/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AutomationExecution } from "@/types/database";

export async function importExecutionRecord(
  ctx: AutomationRepositoryContext,
  record: WorkflowExecutionRecord,
  trigger: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_executions").insert({
    id: record.id,
    workflow_id: record.workflowId,
    organization_id: ctx.organizationId,
    trigger,
    status: executionStatusToDb(record.status),
    started_at: record.startedAt,
    finished_at: record.finishedAt,
    duration_ms: record.durationMs,
    execution_log: {
      workflowName: record.workflowName,
      executedActions: record.executedActions,
      errors: record.errors,
    },
    simulated: record.simulated,
    initiated_by: record.triggeredBy,
  } as never);

  if (error && !error.message.includes("duplicate key")) {
    throw new Error(`Failed to import execution: ${error.message}`);
  }
}

export async function createExecution(
  ctx: AutomationRepositoryContext,
  input: CreateExecutionInput,
): Promise<WorkflowExecutionRecord> {
  const workflow = await getWorkflowRow(ctx, input.workflowId);
  if (!workflow) {
    throw new Error("Workflow not found.");
  }

  const supabase = await createClient();
  const status = input.status ?? (input.simulated ? "simulation" : "pending");

  const { data, error } = await supabase
    .from("automation_executions")
    .insert({
      workflow_id: input.workflowId,
      organization_id: ctx.organizationId,
      trigger: input.trigger,
      status,
      execution_log: input.executionLog ?? {},
      simulated: input.simulated,
      initiated_by: input.initiatedBy,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      event_id: input.eventId ?? null,
      trigger_hash: input.triggerHash ?? null,
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create execution: ${error.message}`);
  }

  return rowToExecutionRecord(data as AutomationExecution, workflow.name);
}

export async function appendExecutionStep(input: AppendExecutionStepInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_execution_steps").insert({
    execution_id: input.executionId,
    order_index: input.orderIndex,
    action: input.action,
    result: input.result ?? {},
    duration_ms: input.durationMs ?? null,
    status: input.status ?? "success",
  } as never);

  if (error) {
    throw new Error(`Failed to append execution step: ${error.message}`);
  }
}

export async function completeExecution(input: CompleteExecutionInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("automation_executions")
    .update({
      status: input.status,
      finished_at: new Date().toISOString(),
      duration_ms: input.durationMs,
      execution_log: input.executionLog ?? {},
    } as never)
    .eq("id", input.executionId);

  if (error) {
    throw new Error(`Failed to complete execution: ${error.message}`);
  }
}

export async function listExecutions(
  ctx: AutomationRepositoryContext,
  workflowId?: string,
): Promise<WorkflowExecutionRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("automation_executions")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("started_at", { ascending: false })
    .limit(100);

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list executions: ${error.message}`);
  }

  const rows = (data ?? []) as AutomationExecution[];
  const workflowIds = [...new Set(rows.map((row) => row.workflow_id))];
  const workflowNames = new Map<string, string>();

  if (workflowIds.length > 0) {
    const { data: workflows } = await supabase
      .from("automation_workflows")
      .select("id, name")
      .in("id", workflowIds);

    for (const workflow of (workflows ?? []) as Array<{ id: string; name: string }>) {
      workflowNames.set(workflow.id, workflow.name);
    }
  }

  const stepRows = await listExecutionStepsByExecutionIds(rows.map((row) => row.id));
  const stepsByExecution = new Map<string, import("@/lib/automation/builder/types").WorkflowExecutionStep[]>();
  for (const step of stepRows) {
    const bucket = stepsByExecution.get(step.execution_id) ?? [];
    bucket.push({
      orderIndex: step.order_index,
      action: step.action,
      status: step.status,
      message: typeof step.result === "object" && step.result && "message" in step.result
        ? String((step.result as { message?: string }).message)
        : undefined,
      durationMs: step.duration_ms ?? undefined,
    });
    stepsByExecution.set(step.execution_id, bucket);
  }

  return rows.map((row) =>
    rowToExecutionRecord(
      row,
      workflowNames.get(row.workflow_id) ?? "Automation",
      stepsByExecution.get(row.id),
    ),
  );
}

export async function recordSimulationExecution(
  session: SessionContext,
  workflow: WorkflowDefinition,
  triggeredBy: string,
): Promise<WorkflowExecutionRecord> {
  const ctx: AutomationRepositoryContext = {
    organizationId: session.organization.id,
    userId: session.user.id,
  };

  const record = buildSimulatedExecutionRecord(workflow, triggeredBy);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("automation_executions")
    .insert({
      id: record.id,
      workflow_id: workflow.id,
      organization_id: ctx.organizationId,
      trigger: workflow.trigger.type,
      status: executionStatusToDb(record.status),
      started_at: record.startedAt,
      finished_at: record.finishedAt,
      duration_ms: record.durationMs,
      execution_log: {
        workflowName: record.workflowName,
        executedActions: record.executedActions,
        errors: record.errors,
      },
      simulated: true,
      initiated_by: triggeredBy,
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to record simulation: ${error.message}`);
  }

  if (record.executedActions.length > 0) {
    await Promise.all(
      record.executedActions.map((action, index) =>
        appendExecutionStep({
          executionId: record.id,
          orderIndex: index,
          action,
          result: { status: "simulated" },
          durationMs: 0,
        }),
      ),
    );
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: workflow.id,
    action: "automation_workflow_simulated",
    title: "Automation workflow simulated",
    metadata: {
      workflowId: workflow.id,
      executionId: record.id,
      durationMs: record.durationMs,
    },
  });

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: workflow.id,
    action: "automation_execution_finished",
    title: "Automation simulation finished",
    metadata: {
      workflowId: workflow.id,
      executionId: record.id,
      status: record.status,
      simulated: true,
    },
  });

  return rowToExecutionRecord(data, workflow.name);
}
