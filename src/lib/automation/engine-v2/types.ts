import type { WorkflowDefinition, WorkflowExecutionStep, WorkflowTriggerType } from "@/lib/automation/builder/types";
import type { AutomationExecutionStatus } from "@/types/database";

export const WORKFLOW_ENGINE_VERSION = "v1";

export type WorkflowEngineTrigger = Extract<
  WorkflowTriggerType,
  | "client_created"
  | "client_archived"
  | "risk_created"
  | "risk_updated"
  | "incident_created"
  | "incident_updated"
  | "report_drafted"
  | "report_published"
  | "report_sent"
  | "sla_warning"
  | "sla_breached"
  | "customer_health_changed"
  | "manual_trigger"
>;

export type WorkflowEngineEvent = {
  trigger: WorkflowEngineTrigger;
  organizationId: string;
  entityType: string;
  entityId: string;
  clientId?: string | null;
  actorUserId?: string | null;
  eventId?: string;
  payload?: Record<string, unknown>;
};

export type WorkflowExecutionContext = Record<string, unknown>;

export type WorkflowActionOutcome = {
  actionId: string;
  actionType: string;
  status: "success" | "failed" | "skipped";
  message: string;
  durationMs: number;
};

export type WorkflowRunResult = {
  executionId: string;
  workflowId: string;
  status: AutomationExecutionStatus;
  conditionsMatched: boolean;
  steps: WorkflowExecutionStep[];
  executedActions: string[];
  errors: string[];
  durationMs: number;
  skippedDuplicate?: boolean;
};

export type ExecuteWorkflowOptions = {
  manual?: boolean;
  simulated?: boolean;
  initiatedBy?: string;
};

export type ActiveWorkflowCandidate = {
  workflow: WorkflowDefinition;
  rowId: string;
};
