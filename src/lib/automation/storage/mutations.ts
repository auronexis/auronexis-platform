import "server-only";

import { recordActivityEvent } from "@/lib/activity/record";
import { getPlanLimit } from "@/lib/plans/features";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { requirePermission } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { WorkflowDefinition, WorkflowStatus } from "@/lib/automation/builder/types";
import { validateWorkflowForPersistence } from "@/lib/automation/storage/validation";
import {
  rowToWorkflowDefinition,
  workflowStatusToDb,
  workflowToRowFields,
  type AutomationRepositoryContext,
} from "@/lib/automation/storage/types";
import { insertWorkflowVersion } from "@/lib/automation/storage/versions";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AutomationWorkflow, AutomationWorkflowStatus } from "@/types/database";

export class AutomationLimitError extends Error {
  readonly code = "PLAN_LIMIT";

  constructor(message: string) {
    super(message);
    this.name = "AutomationLimitError";
  }
}

async function countBillableWorkflows(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("automation_workflows")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["draft", "active", "paused"]);

  if (error) {
    throw new Error(`Failed to count workflows: ${error.message}`);
  }

  return count ?? 0;
}

export async function assertServerAutomationLimit(session: SessionContext): Promise<void> {
  const plan = await getOrganizationPlanContextForSession(session);
  const limit = getPlanLimit(plan.planKey, "max_automations");
  if (limit === null) return;

  const used = await countBillableWorkflows(session.organization.id);
  if (used >= limit) {
    throw new AutomationLimitError(
      `Your plan allows ${limit} automation${limit === 1 ? "" : "s"}. Disable or delete one to create another.`,
    );
  }
}

async function recordWorkflowActivity(
  session: SessionContext,
  action: string,
  title: string,
  workflow: WorkflowDefinition,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: workflow.id,
    action,
    title,
    description: workflow.description ?? null,
    metadata: {
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowStatus: workflow.status,
      workflowVersion: workflow.version,
      ...metadata,
    },
  });
}

export async function createWorkflowRecord(
  session: SessionContext,
  workflowInput: WorkflowDefinition,
): Promise<WorkflowDefinition> {
  requirePermission(session.role, "workflows", "create");
  await assertServerAutomationLimit(session);

  const validated = validateWorkflowForPersistence(workflowInput);
  if (!validated.ok) {
    throw new Error(validated.error.message);
  }

  const ctx: AutomationRepositoryContext = {
    organizationId: session.organization.id,
    userId: session.user.id,
  };
  const workflow = validated.workflow;
  const supabase = await createClient();
  const row = workflowToRowFields(workflow, ctx.organizationId, ctx.userId);

  const { data, error } = await supabase
    .from("automation_workflows")
    .insert(row as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create workflow: ${error.message}`);
  }

  await insertWorkflowVersion(ctx, (data as AutomationWorkflow).id, workflow.version, workflow, ctx.userId);
  await recordWorkflowActivity(session, "automation_workflow_created", "Automation workflow created", workflow);

  return rowToWorkflowDefinition(data as AutomationWorkflow);
}

export async function updateWorkflowRecord(
  session: SessionContext,
  workflowInput: WorkflowDefinition,
): Promise<WorkflowDefinition> {
  requirePermission(session.role, "workflows", "update");

  const validated = validateWorkflowForPersistence(workflowInput);
  if (!validated.ok) {
    throw new Error(validated.error.message);
  }

  const ctx: AutomationRepositoryContext = {
    organizationId: session.organization.id,
    userId: session.user.id,
  };
  const workflow = validated.workflow;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("automation_workflows")
    .update({
      name: workflow.name,
      description: workflow.description ?? null,
      status: workflowStatusToDb(workflow.status),
      version: workflow.version,
      workflow_json: workflow as never,
      updated_by: ctx.userId,
    } as never)
    .eq("organization_id", ctx.organizationId)
    .eq("id", workflow.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update workflow: ${error.message}`);
  }

  await insertWorkflowVersion(ctx, workflow.id, workflow.version, workflow, ctx.userId);
  await recordWorkflowActivity(session, "automation_workflow_updated", "Automation workflow updated", workflow, {
    versioned: true,
  });
  await recordWorkflowActivity(session, "automation_workflow_versioned", "Automation workflow version saved", workflow, {
    version: workflow.version,
  });

  return rowToWorkflowDefinition(data as AutomationWorkflow);
}

export async function upsertWorkflowRecord(
  session: SessionContext,
  workflowInput: WorkflowDefinition,
): Promise<WorkflowDefinition> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("automation_workflows")
    .select("id")
    .eq("organization_id", session.organization.id)
    .eq("id", workflowInput.id)
    .maybeSingle();

  if (existing) {
    return updateWorkflowRecord(session, workflowInput);
  }

  return createWorkflowRecord(session, workflowInput);
}

export async function deleteWorkflowRecord(
  session: SessionContext,
  workflowId: string,
): Promise<void> {
  requirePermission(session.role, "workflows", "delete");

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("id", workflowId)
    .maybeSingle();

  if (loadError) {
    throw new Error(`Failed to load workflow: ${loadError.message}`);
  }

  if (!existing) return;

  const { error } = await supabase
    .from("automation_workflows")
    .delete()
    .eq("organization_id", session.organization.id)
    .eq("id", workflowId);

  if (error) {
    throw new Error(`Failed to delete workflow: ${error.message}`);
  }

  const workflow = rowToWorkflowDefinition(existing);
  await recordWorkflowActivity(session, "automation_workflow_deleted", "Automation workflow deleted", workflow);
}

export async function setWorkflowStatusRecord(
  session: SessionContext,
  workflowId: string,
  status: WorkflowStatus,
): Promise<WorkflowDefinition> {
  requirePermission(session.role, "workflows", "update");

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("id", workflowId)
    .maybeSingle();

  if (loadError || !existing) {
    throw new Error("Workflow not found.");
  }

  const workflow = rowToWorkflowDefinition(existing);
  workflow.status = status;
  workflow.updatedAt = new Date().toISOString();

  return updateWorkflowRecord(session, workflow);
}

export async function archiveWorkflowRecord(
  session: SessionContext,
  workflowId: string,
): Promise<WorkflowDefinition> {
  return setWorkflowStatusInternal(session, workflowId, "archived", "automation_workflow_archived");
}

export async function restoreWorkflowRecord(
  session: SessionContext,
  workflowId: string,
): Promise<WorkflowDefinition> {
  return setWorkflowStatusInternal(session, workflowId, "draft", "automation_workflow_restored");
}

async function setWorkflowStatusInternal(
  session: SessionContext,
  workflowId: string,
  status: AutomationWorkflowStatus,
  activityAction: string,
): Promise<WorkflowDefinition> {
  requirePermission(session.role, "workflows", "update");

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("automation_workflows")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("id", workflowId)
    .maybeSingle();

  if (loadError || !existing) {
    throw new Error("Workflow not found.");
  }

  const { data, error } = await supabase
    .from("automation_workflows")
    .update({
      status,
      updated_by: session.user.id,
    } as never)
    .eq("organization_id", session.organization.id)
    .eq("id", workflowId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update workflow status: ${error.message}`);
  }

  const workflow = rowToWorkflowDefinition(data as AutomationWorkflow);
  await recordWorkflowActivity(session, activityAction, `Automation workflow ${status}`, workflow);
  return workflow;
}

export async function markLocalStorageMigrated(session: SessionContext): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_org_state").upsert(
    {
      organization_id: session.organization.id,
      local_storage_migrated_at: new Date().toISOString(),
    } as never,
    { onConflict: "organization_id" },
  );

  if (error) {
    throw new Error(`Failed to record migration status: ${error.message}`);
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    action: "automation_local_storage_migrated",
    title: "Automation data migrated to database",
    description: "Local browser drafts were imported into persistent storage.",
    metadata: { storageBackend: "supabase" },
  });
}

export async function createWebhookRecord(
  session: SessionContext,
  input: { name: string; secret: string; endpoint: string; enabled?: boolean },
) {
  requirePermission(session.role, "workflows", "manage");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_webhooks")
    .insert({
      organization_id: session.organization.id,
      name: input.name,
      secret: input.secret,
      endpoint: input.endpoint,
      enabled: input.enabled ?? true,
    } as never)
    .select("id, organization_id, name, endpoint, enabled, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create webhook: ${error.message}`);
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: (data as { id: string }).id,
    action: "automation_webhook_created",
    title: "Automation webhook created",
    metadata: { webhookName: input.name },
  });

  return data as { id: string; name: string; endpoint: string; enabled: boolean; created_at: string };
}
