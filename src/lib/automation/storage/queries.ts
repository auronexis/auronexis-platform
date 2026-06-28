import "server-only";

import { cache } from "react";
import { checkDatabaseHealth } from "@/lib/diagnostics/platform-health";
import { createClient } from "@/lib/supabase/server";
import type { AutomationStore } from "@/lib/automation/builder/types";
import {
  buildAutomationStore,
  rowToExecutionRecord,
  rowToWorkflowDefinition,
  versionRowToSnapshot,
  webhookRowToView,
  type AutomationDiagnosticsSnapshot,
  type AutomationRepositoryContext,
  type AutomationWebhookView,
} from "@/lib/automation/storage/types";
import type {
  AutomationExecution,
  AutomationOrgState,
  AutomationWebhook,
  AutomationWorkflow,
  AutomationWorkflowVersion,
} from "@/types/database";

const EXECUTION_LIST_LIMIT = 100;

export async function getWorkflowRow(
  ctx: AutomationRepositoryContext,
  workflowId: string,
): Promise<AutomationWorkflow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .eq("id", workflowId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load workflow: ${error.message}`);
  }

  return data as AutomationWorkflow | null;
}

export async function listWorkflowRows(
  ctx: AutomationRepositoryContext,
): Promise<AutomationWorkflow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list workflows: ${error.message}`);
  }

  return (data ?? []) as AutomationWorkflow[];
}

export async function listExecutionRows(
  ctx: AutomationRepositoryContext,
  workflowId?: string,
): Promise<AutomationExecution[]> {
  const supabase = await createClient();
  let query = supabase
    .from("automation_executions")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("started_at", { ascending: false })
    .limit(EXECUTION_LIST_LIMIT);

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list executions: ${error.message}`);
  }

  return (data ?? []) as AutomationExecution[];
}

export async function listVersionRowsForWorkflow(
  ctx: AutomationRepositoryContext,
  workflowId: string,
) {
  const supabase = await createClient();
  const workflow = await getWorkflowRow(ctx, workflowId);
  if (!workflow) return [];

  const { data, error } = await supabase
    .from("automation_workflow_versions")
    .select("id, workflow_id, version, workflow_json, created_by, created_at")
    .eq("workflow_id", workflowId)
    .order("version", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to list versions: ${error.message}`);
  }

  return (data ?? []) as Pick<
    AutomationWorkflowVersion,
    "id" | "workflow_id" | "version" | "workflow_json" | "created_by" | "created_at"
  >[];
}

export async function listAllVersionRows(ctx: AutomationRepositoryContext) {
  const workflows = await listWorkflowRows(ctx);
  if (workflows.length === 0) return [];

  const supabase = await createClient();
  const workflowIds = workflows.map((row) => row.id);
  const { data, error } = await supabase
    .from("automation_workflow_versions")
    .select("id, workflow_id, version, workflow_json, created_by, created_at")
    .in("workflow_id", workflowIds)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(`Failed to list workflow versions: ${error.message}`);
  }

  return (data ?? []) as Pick<
    AutomationWorkflowVersion,
    "id" | "workflow_id" | "version" | "workflow_json" | "created_by" | "created_at"
  >[];
}

export async function listWebhooks(ctx: AutomationRepositoryContext): Promise<AutomationWebhookView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_webhooks")
    .select("id, organization_id, name, endpoint, enabled, created_at")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list webhooks: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const webhook = row as Pick<
      AutomationWebhook,
      "id" | "organization_id" | "name" | "endpoint" | "enabled" | "created_at"
    >;
    return webhookRowToView({
      id: webhook.id,
      organization_id: ctx.organizationId,
      name: webhook.name,
      secret: "",
      endpoint: webhook.endpoint,
      enabled: webhook.enabled,
      created_at: webhook.created_at,
    });
  });
}

export async function getOrgState(
  ctx: AutomationRepositoryContext,
): Promise<AutomationOrgState | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_org_state")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load automation org state: ${error.message}`);
  }

  return data as AutomationOrgState | null;
}

export async function countWorkflowsByStatus(
  ctx: AutomationRepositoryContext,
): Promise<{ total: number; draft: number; active: number; disabled: number }> {
  const rows = await listWorkflowRows(ctx);
  return {
    total: rows.length,
    draft: rows.filter((row) => row.status === "draft").length,
    active: rows.filter((row) => row.status === "active" || row.status === "paused").length,
    disabled: rows.filter((row) => row.status === "disabled" || row.status === "archived").length,
  };
}

export const loadAutomationStoreFromRepository = cache(
  async (ctx: AutomationRepositoryContext): Promise<AutomationStore> => {
    const [workflowRows, executionRows, versionRows] = await Promise.all([
      listWorkflowRows(ctx),
      listExecutionRows(ctx),
      listAllVersionRows(ctx),
    ]);

    const workflows = workflowRows.map(rowToWorkflowDefinition);
    const workflowNameById = new Map(workflows.map((workflow) => [workflow.id, workflow.name]));

    const executions = executionRows.map((row) =>
      rowToExecutionRecord(row, workflowNameById.get(row.workflow_id) ?? "Automation"),
    );

    const stepRows = await listExecutionStepsByExecutionIds(executionRows.map((row) => row.id));
    const stepsByExecution = new Map<string, import("@/lib/automation/builder/types").WorkflowExecutionStep[]>();
    for (const step of stepRows) {
      const bucket = stepsByExecution.get(step.execution_id) ?? [];
      bucket.push({
        orderIndex: step.order_index,
        action: step.action,
        status: step.status,
        message:
          typeof step.result === "object" && step.result && "message" in step.result
            ? String((step.result as { message?: string }).message)
            : undefined,
        durationMs: step.duration_ms ?? undefined,
      });
      stepsByExecution.set(step.execution_id, bucket);
    }

    const executionsWithSteps = executions.map((record) => ({
      ...record,
      steps: stepsByExecution.get(record.id) ?? record.steps,
    }));

    const versions: AutomationStore["versions"] = {};
    for (const row of versionRows) {
      const snapshot = versionRowToSnapshot(row);
      const workflowId = row.workflow_id as string;
      const bucket = versions[workflowId] ?? [];
      bucket.push(snapshot);
      versions[workflowId] = bucket.slice(0, 10);
    }

    return buildAutomationStore(workflows, executionsWithSteps, versions);
  },
);

export async function getAutomationDiagnostics(
  ctx: AutomationRepositoryContext,
): Promise<AutomationDiagnosticsSnapshot> {
  const started = Date.now();
  let repositoryStatus: AutomationDiagnosticsSnapshot["repositoryStatus"] = "healthy";
  let databaseLatencyMs: number | null = null;

  try {
    const dbHealth = await checkDatabaseHealth();
    databaseLatencyMs = dbHealth.latencyMs ?? Date.now() - started;
    if (!dbHealth.ok) {
      repositoryStatus = "unavailable";
    }
  } catch {
    repositoryStatus = "unavailable";
    databaseLatencyMs = Date.now() - started;
  }

  try {
    const [counts, orgState, versionRows, webhookRows, executionRows] = await Promise.all([
      countWorkflowsByStatus(ctx),
      getOrgState(ctx),
      listAllVersionRows(ctx),
      listWebhooks(ctx),
      listExecutionRows(ctx),
    ]);

    return {
      workflowCount: counts.total,
      executionCount: executionRows.length,
      draftCount: counts.draft,
      versionCount: versionRows.length,
      webhookCount: webhookRows.length,
      storageBackend: "supabase",
      migrationStatus: orgState?.local_storage_migrated_at ? "complete" : "not_needed",
      localStorageMigratedAt: orgState?.local_storage_migrated_at ?? null,
      repositoryStatus,
      databaseLatencyMs,
    };
  } catch {
    return {
      workflowCount: 0,
      executionCount: 0,
      draftCount: 0,
      versionCount: 0,
      webhookCount: 0,
      storageBackend: "supabase",
      migrationStatus: "not_needed",
      localStorageMigratedAt: null,
      repositoryStatus: "degraded",
      databaseLatencyMs,
    };
  }
}

export async function listActiveWorkflowsByTrigger(
  ctx: AutomationRepositoryContext,
  triggerType: string,
): Promise<AutomationWorkflow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to list active workflows: ${error.message}`);
  }

  return ((data ?? []) as AutomationWorkflow[]).filter((row) => {
    const workflow = row.workflow_json as { trigger?: { type?: string } };
    return workflow.trigger?.type === triggerType;
  });
}

export async function findExecutionByTriggerHash(
  ctx: AutomationRepositoryContext,
  workflowId: string,
  triggerHash: string,
): Promise<AutomationExecution | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_executions")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .eq("workflow_id", workflowId)
    .eq("trigger_hash", triggerHash)
    .in("status", ["pending", "running", "completed", "partial", "skipped"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check execution idempotency: ${error.message}`);
  }

  return data as AutomationExecution | null;
}

export async function listExecutionStepsByExecutionIds(executionIds: string[]) {
  if (executionIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_execution_steps")
    .select("*")
    .in("execution_id", executionIds)
    .order("order_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to list execution steps: ${error.message}`);
  }

  return (data ?? []) as import("@/types/database").AutomationExecutionStep[];
}

export async function getAutomationEngineDiagnostics(
  ctx: AutomationRepositoryContext,
): Promise<import("@/lib/automation/storage/types").AutomationEngineDiagnosticsSnapshot> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [activeRows, todayExecutions] = await Promise.all([
    supabase
      .from("automation_workflows")
      .select("id")
      .eq("organization_id", ctx.organizationId)
      .eq("status", "active"),
    supabase
      .from("automation_executions")
      .select("status, duration_ms, execution_log, started_at")
      .eq("organization_id", ctx.organizationId)
      .gte("started_at", `${today}T00:00:00.000Z`)
      .eq("simulated", false),
  ]);

  const activeCount = ((activeRows.data ?? []) as Array<{ id: string }>).length;

  const executions = (todayExecutions.data ?? []) as Array<{
    status: string;
    duration_ms: number | null;
    execution_log: Record<string, unknown>;
    started_at: string;
  }>;

  const failedExecutionsToday = executions.filter((row) => row.status === "failed").length;
  const durations = executions
    .map((row) => row.duration_ms)
    .filter((value): value is number => typeof value === "number");
  const averageExecutionDurationMs =
    durations.length > 0
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : null;

  const { data: lastExecution } = await supabase
    .from("automation_executions")
    .select("status")
    .eq("organization_id", ctx.organizationId)
    .eq("simulated", false)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let placeholderActionsToday = 0;
  for (const row of executions) {
    const log = row.execution_log ?? {};
    const steps = (log as { steps?: Array<{ status?: string }> }).steps ?? [];
    placeholderActionsToday += steps.filter((step) => step.status === "skipped").length;
  }

  return {
    engineVersion: "v1",
    activeWorkflowCount: activeCount,
    executionsToday: executions.length,
    failedExecutionsToday,
    averageExecutionDurationMs,
    lastExecutionStatus: (lastExecution as { status?: string } | null)?.status ?? null,
    placeholderActionsToday,
    queueStatus: "inline",
  };
}
