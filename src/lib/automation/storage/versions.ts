import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WorkflowDefinition } from "@/lib/automation/builder/types";
import { getWorkflowRow } from "@/lib/automation/storage/queries";
import {
  rowToWorkflowDefinition,
  versionRowToSnapshot,
  workflowStatusToDb,
  type AutomationRepositoryContext,
} from "@/lib/automation/storage/types";
import type { WorkflowVersionSnapshot } from "@/lib/automation/builder/types";
import type { AutomationWorkflow } from "@/types/database";

export async function insertWorkflowVersion(
  ctx: AutomationRepositoryContext,
  workflowId: string,
  version: number,
  workflow: WorkflowDefinition,
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("automation_workflow_versions").insert({
    workflow_id: workflowId,
    version,
    workflow_json: workflow as never,
    created_by: userId,
  } as never);

  if (error && !error.message.includes("duplicate key")) {
    throw new Error(`Failed to save workflow version: ${error.message}`);
  }
}

export async function getWorkflowVersion(
  ctx: AutomationRepositoryContext,
  workflowId: string,
  version: number,
): Promise<WorkflowVersionSnapshot | null> {
  const supabase = await createClient();
  const workflow = await getWorkflowRow(ctx, workflowId);
  if (!workflow) return null;

  const { data, error } = await supabase
    .from("automation_workflow_versions")
    .select("version, created_at, workflow_json")
    .eq("workflow_id", workflowId)
    .eq("version", version)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load workflow version: ${error.message}`);
  }

  return data ? versionRowToSnapshot(data) : null;
}

export async function listVersions(
  ctx: AutomationRepositoryContext,
  workflowId: string,
): Promise<WorkflowVersionSnapshot[]> {
  const supabase = await createClient();
  const workflow = await getWorkflowRow(ctx, workflowId);
  if (!workflow) return [];

  const { data, error } = await supabase
    .from("automation_workflow_versions")
    .select("version, created_at, workflow_json")
    .eq("workflow_id", workflowId)
    .order("version", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to list workflow versions: ${error.message}`);
  }

  return (data ?? []).map(versionRowToSnapshot);
}

export async function restoreWorkflowVersion(
  ctx: AutomationRepositoryContext,
  workflowId: string,
  version: number,
  userId: string,
): Promise<WorkflowDefinition | null> {
  const snapshot = await getWorkflowVersion(ctx, workflowId, version);
  if (!snapshot) return null;

  const restored: WorkflowDefinition = {
    ...structuredClone(snapshot.workflow),
    version: snapshot.version + 1,
    updatedAt: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_workflows")
    .update({
      name: restored.name,
      description: restored.description ?? null,
      status: workflowStatusToDb(restored.status),
      version: restored.version,
      workflow_json: restored as never,
      updated_by: userId,
    } as never)
    .eq("organization_id", ctx.organizationId)
    .eq("id", workflowId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to restore workflow version: ${error.message}`);
  }

  await insertWorkflowVersion(ctx, workflowId, restored.version, restored, userId);
  return rowToWorkflowDefinition(data as AutomationWorkflow);
}
