"use server";

import type { AutomationStore, WorkflowDefinition, WorkflowExecutionRecord } from "@/lib/automation/builder/types";
import { AutomationLimitError } from "@/lib/automation/storage/mutations";
import {
  deleteWorkflow,
  loadAutomationStore as loadStore,
  migrateLocalStorageStore,
  recordSimulationExecution,
  restoreWorkflowFromVersion,
  setWorkflowStatus,
  updateWorkflow,
} from "@/lib/automation/storage/repository";
import { requireSession } from "@/lib/auth/session";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function ensureAutomationBuilderAccess() {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_automation_builder");
  if (!access.allowed) {
    throw new Error(access.message);
  }
  return session;
}

function toActionError(error: unknown): string {
  if (error instanceof AutomationLimitError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong.";
}

export async function loadAutomationStoreAction(): Promise<ActionResult<AutomationStore>> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const data = await loadStore(session);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function saveWorkflowAction(
  workflow: WorkflowDefinition,
): Promise<ActionResult<WorkflowDefinition>> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const data = await updateWorkflow(session, workflow);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function deleteWorkflowAction(workflowId: string): Promise<ActionResult<null>> {
  try {
    const session = await ensureAutomationBuilderAccess();
    await deleteWorkflow(session, workflowId);
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function setWorkflowStatusAction(
  workflowId: string,
  status: WorkflowDefinition["status"],
): Promise<ActionResult<WorkflowDefinition>> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const data = await setWorkflowStatus(session, workflowId, status);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function restoreWorkflowVersionAction(
  workflowId: string,
  version: number,
): Promise<ActionResult<WorkflowDefinition | null>> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const data = await restoreWorkflowFromVersion(session, workflowId, version);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function recordSimulationAction(
  workflow: WorkflowDefinition,
  triggeredBy: string,
): Promise<ActionResult<WorkflowExecutionRecord>> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const data = await recordSimulationExecution(session, workflow, triggeredBy);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function migrateLocalStorageAction(
  payload: AutomationStore,
): Promise<
  ActionResult<{
    migratedWorkflows: number;
    migratedExecutions: number;
    migratedVersions: number;
  }>
> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const data = await migrateLocalStorageStore(session, payload);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function getMigrationStatusAction(): Promise<
  ActionResult<{ localStorageMigratedAt: string | null }>
> {
  try {
    const session = await ensureAutomationBuilderAccess();
    const { getOrgState } = await import("@/lib/automation/storage/queries");
    const state = await getOrgState({
      organizationId: session.organization.id,
      userId: session.user.id,
    });
    return { ok: true, data: { localStorageMigratedAt: state?.local_storage_migrated_at ?? null } };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
