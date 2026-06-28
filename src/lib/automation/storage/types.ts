import type {
  AutomationExecution,
  AutomationExecutionStatus,
  AutomationWebhook,
  AutomationWorkflow,
  AutomationWorkflowStatus,
  Database,
} from "@/types/database";
import type {
  AutomationStore,
  WorkflowDefinition,
  WorkflowExecutionRecord,
  WorkflowExecutionStatus,
  WorkflowStatus,
  WorkflowVersionSnapshot,
} from "@/lib/automation/builder/types";

export type StorageBackend = "supabase";

export type AutomationRepositoryContext = {
  organizationId: string;
  userId: string;
};

export type AutomationWebhookView = {
  id: string;
  name: string;
  endpoint: string;
  enabled: boolean;
  createdAt: string;
};

export type AutomationDiagnosticsSnapshot = {
  workflowCount: number;
  executionCount: number;
  draftCount: number;
  versionCount: number;
  webhookCount: number;
  storageBackend: StorageBackend;
  migrationStatus: "not_needed" | "pending" | "complete";
  localStorageMigratedAt: string | null;
  repositoryStatus: "healthy" | "degraded" | "unavailable";
  databaseLatencyMs: number | null;
};

export type AutomationEngineDiagnosticsSnapshot = {
  engineVersion: string;
  activeWorkflowCount: number;
  executionsToday: number;
  failedExecutionsToday: number;
  averageExecutionDurationMs: number | null;
  lastExecutionStatus: string | null;
  placeholderActionsToday: number;
  queueStatus: "inline";
};

export type CreateWebhookInput = {
  name: string;
  secret: string;
  endpoint: string;
  enabled?: boolean;
};

export type CreateExecutionInput = {
  workflowId: string;
  trigger: string;
  initiatedBy: string;
  simulated: boolean;
  executionLog?: Record<string, unknown>;
  entityType?: string | null;
  entityId?: string | null;
  eventId?: string | null;
  triggerHash?: string | null;
  status?: AutomationExecutionStatus;
};

export type CompleteExecutionInput = {
  executionId: string;
  status: AutomationExecutionStatus;
  durationMs: number;
  executionLog?: Record<string, unknown>;
};

export type AppendExecutionStepInput = {
  executionId: string;
  orderIndex: number;
  action: string;
  result?: Record<string, unknown>;
  durationMs?: number;
  status?: import("@/types/database").AutomationExecutionStepStatus;
};

const UI_TO_DB_STATUS: Record<WorkflowStatus, AutomationWorkflowStatus> = {
  draft: "draft",
  active: "active",
  disabled: "disabled",
};

const DB_TO_UI_STATUS: Record<AutomationWorkflowStatus, WorkflowStatus> = {
  draft: "draft",
  active: "active",
  paused: "active",
  disabled: "disabled",
  archived: "disabled",
};

const EXECUTION_UI_TO_DB: Record<WorkflowExecutionStatus, AutomationExecutionStatus> = {
  success: "completed",
  failed: "failed",
  partial: "partial",
  simulated: "simulation",
  skipped: "skipped",
  running: "running",
};

const EXECUTION_DB_TO_UI: Record<AutomationExecutionStatus, WorkflowExecutionStatus> = {
  pending: "running",
  running: "running",
  completed: "success",
  failed: "failed",
  cancelled: "failed",
  simulation: "simulated",
  partial: "partial",
  skipped: "skipped",
};

export function workflowStatusToDb(status: WorkflowStatus): AutomationWorkflowStatus {
  return UI_TO_DB_STATUS[status];
}

export function workflowStatusFromDb(status: AutomationWorkflowStatus): WorkflowStatus {
  return DB_TO_UI_STATUS[status];
}

export function executionStatusToDb(status: WorkflowExecutionStatus): AutomationExecutionStatus {
  return EXECUTION_UI_TO_DB[status];
}

export function executionStatusFromDb(status: AutomationExecutionStatus): WorkflowExecutionStatus {
  return EXECUTION_DB_TO_UI[status];
}

export function rowToWorkflowDefinition(row: AutomationWorkflow): WorkflowDefinition {
  const parsed = row.workflow_json as WorkflowDefinition;
  return {
    ...parsed,
    id: row.id,
    name: row.name,
    description: row.description ?? parsed.description,
    status: workflowStatusFromDb(row.status),
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function workflowToRowFields(
  workflow: WorkflowDefinition,
  organizationId: string,
  userId: string,
): Database["public"]["Tables"]["automation_workflows"]["Insert"] {
  return {
    id: workflow.id,
    organization_id: organizationId,
    name: workflow.name,
    description: workflow.description ?? null,
    status: workflowStatusToDb(workflow.status),
    version: workflow.version,
    workflow_json: workflow as unknown as Database["public"]["Tables"]["automation_workflows"]["Insert"]["workflow_json"],
    created_by: userId,
    updated_by: userId,
  };
}

export function rowToExecutionRecord(
  row: AutomationExecution,
  workflowName: string,
  steps?: import("@/lib/automation/builder/types").WorkflowExecutionStep[],
): WorkflowExecutionRecord {
  const log = (row.execution_log ?? {}) as {
    executedActions?: string[];
    errors?: string[];
    workflowName?: string;
    conditionsMatched?: boolean;
    steps?: import("@/lib/automation/builder/types").WorkflowExecutionStep[];
  };

  return {
    id: row.id,
    workflowId: row.workflow_id,
    workflowName: log.workflowName ?? workflowName,
    status: executionStatusFromDb(row.status),
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? row.started_at,
    durationMs: row.duration_ms ?? 0,
    triggeredBy: row.initiated_by,
    trigger: row.trigger,
    executedActions: log.executedActions ?? [],
    errors: log.errors ?? [],
    simulated: row.simulated,
    conditionsMatched: log.conditionsMatched,
    steps: steps ?? log.steps,
  };
}

export function versionRowToSnapshot(
  row: { version: number; created_at: string; workflow_json: unknown },
): WorkflowVersionSnapshot {
  const workflow = row.workflow_json as WorkflowDefinition;
  return {
    version: row.version,
    savedAt: row.created_at,
    workflow,
    label: `v${row.version}`,
  };
}

export function webhookRowToView(row: AutomationWebhook): AutomationWebhookView {
  return {
    id: row.id,
    name: row.name,
    endpoint: row.endpoint,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export function buildAutomationStore(
  workflows: WorkflowDefinition[],
  executions: WorkflowExecutionRecord[],
  versions: Record<string, WorkflowVersionSnapshot[]>,
): AutomationStore {
  return { automations: workflows, executions, versions };
}
