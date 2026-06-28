export type {
  AutomationDiagnosticsSnapshot,
  AutomationRepositoryContext,
  AutomationWebhookView,
  CreateExecutionInput,
  CreateWebhookInput,
  StorageBackend,
} from "@/lib/automation/storage/types";

export {
  archiveWorkflow,
  createExecution,
  createWebhook,
  createWorkflow,
  deleteWorkflow,
  getAutomationRepositoryDiagnostics,
  getWorkflow,
  getWorkflowVersion,
  listExecutions,
  listVersions,
  listWebhooks,
  listWorkflows,
  loadAutomationStore,
  migrateLocalStorageStore,
  recordSimulationExecution,
  restoreWorkflow,
  restoreWorkflowFromVersion,
  setWorkflowStatus,
  updateWorkflow,
} from "@/lib/automation/storage/repository";

export { validateWorkflowForPersistence } from "@/lib/automation/storage/validation";
