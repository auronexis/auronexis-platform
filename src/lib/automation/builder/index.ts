export type {
  AutomationDashboardStats,
  AutomationStore,
  AutomationSuggestion,
  WorkflowAction,
  WorkflowActionType,
  WorkflowCondition,
  WorkflowConditionGroup,
  WorkflowDefinition,
  WorkflowExecutionRecord,
  WorkflowSimulationResult,
  WorkflowStatus,
  WorkflowTriggerType,
  WorkflowValidationIssue,
  WorkflowValidationResult,
  WorkflowVersionSnapshot,
} from "@/lib/automation/builder/types";
export {
  DESTRUCTIVE_ACTION_TYPES,
  STORAGE_KEY_PREFIX,
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_TRIGGER_LABELS,
} from "@/lib/automation/builder/types";
export { parseWorkflowDefinition, workflowDefinitionSchema } from "@/lib/automation/builder/schema";
export { validateWorkflow, evaluateWorkflowConditions } from "@/lib/automation/builder/validation";
export { simulateWorkflow } from "@/lib/automation/builder/simulation";
export {
  appendVersionSnapshot,
  buildAutomationSuggestions,
  buildSimulatedExecutionRecord,
  computeDashboardStats,
  createEmptyStore,
  filterAutomations,
} from "@/lib/automation/builder/suggestions";
export {
  assertAutomationLimit,
  formatAutomationLimit,
  formatAutomationUsage,
  getAutomationLimitForPlan,
  isAtAutomationLimit,
} from "@/lib/automation/builder/limits";
