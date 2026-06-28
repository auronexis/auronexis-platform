import "server-only";

import type { WorkflowDefinition, WorkflowExecutionRecord, WorkflowStatus } from "@/lib/automation/builder/types";
import type { AutomationStore } from "@/lib/automation/builder/types";
import {
  archiveWorkflowRecord,
  createWebhookRecord,
  deleteWorkflowRecord,
  markLocalStorageMigrated,
  restoreWorkflowRecord,
  setWorkflowStatusRecord,
  upsertWorkflowRecord,
} from "@/lib/automation/storage/mutations";
import {
  createExecution,
  importExecutionRecord,
  listExecutions,
  recordSimulationExecution,
} from "@/lib/automation/storage/executions";
import {
  getAutomationDiagnostics,
  getWorkflowRow,
  listWebhooks as listWebhookRows,
  loadAutomationStoreFromRepository,
} from "@/lib/automation/storage/queries";
import {
  getWorkflowVersion,
  listVersions,
  restoreWorkflowVersion,
} from "@/lib/automation/storage/versions";
import { validateAutomationStoreForMigration } from "@/lib/automation/storage/validation";
import type {
  AutomationDiagnosticsSnapshot,
  AutomationRepositoryContext,
  AutomationWebhookView,
  CreateExecutionInput,
  CreateWebhookInput,
} from "@/lib/automation/storage/types";
import { rowToWorkflowDefinition } from "@/lib/automation/storage/types";
import { insertWorkflowVersion } from "@/lib/automation/storage/versions";
import type { SessionContext } from "@/lib/tenancy/context";

function toContext(session: SessionContext): AutomationRepositoryContext {
  return {
    organizationId: session.organization.id,
    userId: session.user.id,
  };
}

export async function createWorkflow(
  session: SessionContext,
  workflow: WorkflowDefinition,
): Promise<WorkflowDefinition> {
  return upsertWorkflowRecord(session, workflow);
}

export async function updateWorkflow(
  session: SessionContext,
  workflow: WorkflowDefinition,
): Promise<WorkflowDefinition> {
  return upsertWorkflowRecord(session, workflow);
}

export async function deleteWorkflow(session: SessionContext, workflowId: string): Promise<void> {
  await deleteWorkflowRecord(session, workflowId);
}

export async function archiveWorkflow(
  session: SessionContext,
  workflowId: string,
): Promise<WorkflowDefinition> {
  return archiveWorkflowRecord(session, workflowId);
}

export async function restoreWorkflow(
  session: SessionContext,
  workflowId: string,
): Promise<WorkflowDefinition> {
  return restoreWorkflowRecord(session, workflowId);
}

export async function getWorkflow(
  session: SessionContext,
  workflowId: string,
): Promise<WorkflowDefinition | null> {
  const row = await getWorkflowRow(toContext(session), workflowId);
  return row ? rowToWorkflowDefinition(row) : null;
}

export { getWorkflowVersion, listVersions };

export async function listWorkflows(session: SessionContext): Promise<WorkflowDefinition[]> {
  const store = await loadAutomationStoreFromRepository(toContext(session));
  return store.automations;
}

export async function loadAutomationStore(session: SessionContext): Promise<AutomationStore> {
  return loadAutomationStoreFromRepository(toContext(session));
}

export async function setWorkflowStatus(
  session: SessionContext,
  workflowId: string,
  status: WorkflowStatus,
): Promise<WorkflowDefinition> {
  return setWorkflowStatusRecord(session, workflowId, status);
}

export async function restoreWorkflowFromVersion(
  session: SessionContext,
  workflowId: string,
  version: number,
): Promise<WorkflowDefinition | null> {
  return restoreWorkflowVersion(toContext(session), workflowId, version, session.user.id);
}

export {
  createExecution,
  listExecutions,
  recordSimulationExecution,
};

export async function createWebhook(
  session: SessionContext,
  input: CreateWebhookInput,
): Promise<AutomationWebhookView> {
  const row = await createWebhookRecord(session, input);
  return {
    id: row.id,
    name: row.name,
    endpoint: row.endpoint,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export async function listWebhooks(session: SessionContext): Promise<AutomationWebhookView[]> {
  return listWebhookRows(toContext(session));
}

export async function getAutomationRepositoryDiagnostics(
  session: SessionContext,
): Promise<AutomationDiagnosticsSnapshot> {
  return getAutomationDiagnostics(toContext(session));
}

export async function migrateLocalStorageStore(
  session: SessionContext,
  payload: unknown,
): Promise<{ migratedWorkflows: number; migratedExecutions: number; migratedVersions: number }> {
  const validated = validateAutomationStoreForMigration(payload);
  if (!validated.ok) {
    throw new Error(validated.error.message);
  }

  const store = validated.store;
  const ctx = toContext(session);
  let migratedWorkflows = 0;
  let migratedExecutions = 0;
  let migratedVersions = 0;

  for (const workflow of store.automations) {
    await upsertWorkflowRecord(session, workflow);
    migratedWorkflows += 1;
  }

  for (const [workflowId, snapshots] of Object.entries(store.versions)) {
    for (const snapshot of snapshots) {
      await insertWorkflowVersion(ctx, workflowId, snapshot.version, snapshot.workflow, ctx.userId);
      migratedVersions += 1;
    }
  }

  for (const execution of store.executions) {
    const workflow = store.automations.find((item) => item.id === execution.workflowId);
    if (!workflow) continue;

    await importExecutionRecord(ctx, execution, workflow.trigger.type);
    migratedExecutions += 1;
  }

  await markLocalStorageMigrated(session);

  return { migratedWorkflows, migratedExecutions, migratedVersions };
}

export type {
  AutomationDiagnosticsSnapshot,
  AutomationRepositoryContext,
  AutomationWebhookView,
  CreateExecutionInput,
  CreateWebhookInput,
  WorkflowExecutionRecord,
};
