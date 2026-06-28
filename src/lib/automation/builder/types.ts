/** User-defined automation workflow types — AI Automation Builder v1. */

export type WorkflowStatus = "draft" | "active" | "disabled";

export type WorkflowTriggerType =
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
  | "workspace_health_below_threshold"
  | "profitability_changed"
  | "schedule_due"
  | "activity_created"
  | "manual_trigger"
  | "webhook_trigger";

export type WorkflowConditionField =
  | "severity"
  | "priority"
  | "status"
  | "client"
  | "owner"
  | "organization"
  | "risk_score"
  | "incident_count"
  | "sla_status"
  | "profitability"
  | "customer_health"
  | "workspace_health"
  | "report_age"
  | "tags";

export type WorkflowConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "contains"
  | "in";

export type WorkflowActionType =
  | "create_activity"
  | "create_report_draft"
  | "create_incident"
  | "create_risk"
  | "assign_owner"
  | "send_notification"
  | "generate_ai_summary"
  | "generate_customer_update"
  | "generate_executive_summary"
  | "generate_mitigation_plan"
  | "schedule_review"
  | "archive_entity"
  | "webhook_placeholder"
  | "email_placeholder"
  | "teams_placeholder"
  | "slack_placeholder"
  | "send_slack_message"
  | "send_teams_message"
  | "post_webhook"
  | "rest_api_call"
  | "send_email"
  | "create_jira_issue"
  | "create_github_issue"
  | "create_notion_page"
  | "create_linear_ticket"
  | "create_azure_devops_work_item"
  | "send_discord_notification"
  | "send_google_chat_message";

export type WorkflowTrigger = {
  type: WorkflowTriggerType;
  config?: Record<string, unknown>;
};

export type WorkflowCondition = {
  id: string;
  field: WorkflowConditionField | string;
  operator: WorkflowConditionOperator;
  value: string | number | boolean | string[];
};

export type WorkflowConditionGroup = {
  id: string;
  logic: "and" | "or";
  conditions: WorkflowCondition[];
  groups?: WorkflowConditionGroup[];
};

export type WorkflowAction = {
  id: string;
  type: WorkflowActionType;
  label?: string;
  config?: Record<string, unknown>;
  requiresConfirmation?: boolean;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  conditions?: WorkflowConditionGroup;
  actions: WorkflowAction[];
  confirmationRequired: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string | null;
};

export type WorkflowValidationIssue = {
  id: string;
  severity: "error" | "warning";
  message: string;
  nodeId?: string;
};

export type WorkflowValidationResult = {
  valid: boolean;
  issues: WorkflowValidationIssue[];
};

export type SimulationActionResult = {
  actionId: string;
  actionType: WorkflowActionType;
  status: "executed" | "skipped";
  message: string;
};

export type WorkflowSimulationResult = {
  triggerMatched: boolean;
  triggerLabel: string;
  conditionsMatched: boolean;
  conditionDetails: string[];
  actions: SimulationActionResult[];
  skippedActions: SimulationActionResult[];
  durationMs: number;
  sampleContext: Record<string, unknown>;
};

export type WorkflowExecutionStatus =
  | "success"
  | "failed"
  | "partial"
  | "simulated"
  | "skipped"
  | "running";

export type WorkflowExecutionStep = {
  orderIndex: number;
  action: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  message?: string;
  durationMs?: number;
};

export type WorkflowExecutionRecord = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: WorkflowExecutionStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  triggeredBy: string;
  trigger?: string;
  executedActions: string[];
  errors: string[];
  simulated: boolean;
  conditionsMatched?: boolean;
  steps?: WorkflowExecutionStep[];
};

export type WorkflowVersionSnapshot = {
  version: number;
  savedAt: string;
  workflow: WorkflowDefinition;
  label: string;
};

export type AutomationSuggestion = {
  id: string;
  title: string;
  description: string;
  suggestedPrompt: string;
  priority: "high" | "medium" | "low";
};

export type AutomationDashboardStats = {
  activeCount: number;
  draftCount: number;
  disabledCount: number;
  successfulExecutions: number;
  failedExecutions: number;
  todayExecutions: number;
  lastExecutionAt: string | null;
};

export type AutomationStore = {
  automations: WorkflowDefinition[];
  executions: WorkflowExecutionRecord[];
  versions: Record<string, WorkflowVersionSnapshot[]>;
};

export const WORKFLOW_TRIGGER_LABELS: Record<WorkflowTriggerType, string> = {
  client_created: "Client created",
  client_archived: "Client archived",
  risk_created: "Risk created",
  risk_updated: "Risk updated",
  incident_created: "Incident created",
  incident_updated: "Incident updated",
  report_drafted: "Report drafted",
  report_published: "Report published",
  report_sent: "Report sent",
  sla_warning: "SLA warning",
  sla_breached: "SLA breached",
  customer_health_changed: "Customer health changed",
  workspace_health_below_threshold: "Workspace health below threshold",
  profitability_changed: "Profitability changed",
  schedule_due: "Schedule due",
  activity_created: "Activity created",
  manual_trigger: "Manual trigger",
  webhook_trigger: "Webhook trigger (future)",
};

export const WORKFLOW_ACTION_LABELS: Record<WorkflowActionType, string> = {
  create_activity: "Create activity",
  create_report_draft: "Create report draft",
  create_incident: "Create incident",
  create_risk: "Create risk",
  assign_owner: "Assign owner",
  send_notification: "Send notification",
  generate_ai_summary: "Generate AI summary",
  generate_customer_update: "Generate customer update",
  generate_executive_summary: "Generate executive summary",
  generate_mitigation_plan: "Generate mitigation plan",
  schedule_review: "Schedule review",
  archive_entity: "Archive entity",
  webhook_placeholder: "Webhook (placeholder)",
  email_placeholder: "Email (placeholder)",
  teams_placeholder: "Microsoft Teams (placeholder)",
  slack_placeholder: "Slack (placeholder)",
  send_slack_message: "Send Slack message",
  send_teams_message: "Create Teams message",
  post_webhook: "POST webhook",
  rest_api_call: "REST API call",
  send_email: "Send email",
  create_jira_issue: "Create Jira issue",
  create_github_issue: "Create GitHub issue",
  create_notion_page: "Create Notion page",
  create_linear_ticket: "Create Linear ticket",
  create_azure_devops_work_item: "Create Azure DevOps work item",
  send_discord_notification: "Discord notification",
  send_google_chat_message: "Google Chat message",
};

export const DESTRUCTIVE_ACTION_TYPES: WorkflowActionType[] = [
  "archive_entity",
];

export const STORAGE_KEY_PREFIX = "auroranexis:automation-builder:";
