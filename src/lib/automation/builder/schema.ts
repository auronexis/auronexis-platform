import { z } from "zod";

const conditionSchema: z.ZodType<import("@/lib/automation/builder/types").WorkflowCondition> = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "in"]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});

const conditionGroupSchema: z.ZodType<import("@/lib/automation/builder/types").WorkflowConditionGroup> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    logic: z.enum(["and", "or"]),
    conditions: z.array(conditionSchema).max(50),
    groups: z.array(conditionGroupSchema).max(10).optional(),
  }),
);

export const workflowTriggerSchema = z.object({
  type: z.enum([
    "client_created",
    "client_archived",
    "risk_created",
    "risk_updated",
    "incident_created",
    "incident_updated",
    "report_drafted",
    "report_published",
    "report_sent",
    "sla_warning",
    "sla_breached",
    "customer_health_changed",
    "workspace_health_below_threshold",
    "profitability_changed",
    "schedule_due",
    "activity_created",
    "manual_trigger",
    "webhook_trigger",
  ]),
  config: z.record(z.unknown()).optional(),
});

export const workflowActionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "create_activity",
    "create_report_draft",
    "create_incident",
    "create_risk",
    "assign_owner",
    "send_notification",
    "generate_ai_summary",
    "generate_customer_update",
    "generate_executive_summary",
    "generate_mitigation_plan",
    "schedule_review",
    "archive_entity",
    "webhook_placeholder",
    "email_placeholder",
    "teams_placeholder",
    "slack_placeholder",
    "send_slack_message",
    "send_teams_message",
    "post_webhook",
    "rest_api_call",
    "send_email",
    "create_jira_issue",
    "create_github_issue",
    "create_notion_page",
    "create_linear_ticket",
    "create_azure_devops_work_item",
    "send_discord_notification",
    "send_google_chat_message",
  ]),
  label: z.string().max(200).optional(),
  config: z.record(z.unknown()).optional(),
  requiresConfirmation: z.boolean().optional(),
});

export const workflowDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["draft", "active", "disabled"]),
  trigger: workflowTriggerSchema,
  conditions: conditionGroupSchema.optional(),
  actions: z.array(workflowActionSchema).min(1).max(20),
  confirmationRequired: z.boolean(),
  version: z.number().int().min(1).max(999),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastExecutedAt: z.string().nullable().optional(),
});

export const workflowDraftSchema = workflowDefinitionSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true,
  version: true,
});

export type ParsedWorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;

export function parseWorkflowDefinition(input: unknown) {
  return workflowDefinitionSchema.safeParse(input);
}

export function parseWorkflowDraft(input: unknown) {
  return workflowDraftSchema.safeParse(input);
}
