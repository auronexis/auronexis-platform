import "server-only";

import { createHash } from "crypto";
import { recordActivityEvent } from "@/lib/activity/record";
import { getDefaultAIProvider } from "@/lib/ai/providers";
import { createNotificationForOwnersAdminsAndAssignee } from "@/lib/notifications/create";
import type { NotificationEntityType } from "@/lib/notifications/types";
import { checkPlanFeature } from "@/lib/plans/guards";
import { createClient } from "@/lib/supabase/server";
import type { WorkflowAction, WorkflowDefinition } from "@/lib/automation/builder/types";
import { DESTRUCTIVE_ACTION_TYPES } from "@/lib/automation/builder/types";
import { buildExecutionContext } from "@/lib/automation/engine-v2/context";
import { isPlaceholderAction, requiresConfirmation } from "@/lib/automation/engine-v2/guards";
import type {
  WorkflowActionOutcome,
  WorkflowEngineEvent,
  WorkflowExecutionContext,
} from "@/lib/automation/engine-v2/types";
import type { AutomationRepositoryContext } from "@/lib/automation/storage/types";
import {
  dispatchWorkflowIntegrationAction,
  formatExecutionSummary,
} from "@/lib/integrations/execution/dispatcher";
import { isIntegrationActionType } from "@/lib/integrations/simulation";

type ActionExecutionInput = {
  ctx: AutomationRepositoryContext;
  event: WorkflowEngineEvent;
  workflow: WorkflowDefinition;
  action: WorkflowAction;
  context: WorkflowExecutionContext;
  executionId?: string;
  forceSimulation?: boolean;
};

const PLACEHOLDER_ACTIONS = new Set([
  "webhook_placeholder",
  "email_placeholder",
  "slack_placeholder",
  "teams_placeholder",
  "generate_customer_update",
  "generate_executive_summary",
  "generate_mitigation_plan",
  "schedule_review",
]);

export async function executeWorkflowAction(
  input: ActionExecutionInput,
): Promise<WorkflowActionOutcome> {
  const started = Date.now();
  const { action, workflow } = input;

  if (isIntegrationActionType(action.type)) {
    const result = await dispatchWorkflowIntegrationAction({
      action,
      organizationId: input.ctx.organizationId,
      templateContext: input.context,
      workflowId: workflow.id,
      workflowExecutionId: input.executionId,
      forceSimulation: input.forceSimulation,
    });

    const status =
      result.deliveryStatus === "delivered"
        ? "success"
        : result.deliveryStatus === "retrying"
          ? "success"
          : result.deliveryStatus === "rate_limited" ||
              result.validationErrors.length > 0
            ? "skipped"
            : result.success
              ? "success"
              : "failed";

    return {
      actionId: action.id,
      actionType: action.type,
      status,
      message: formatExecutionSummary(result),
      durationMs: Date.now() - started,
    };
  }

  if (PLACEHOLDER_ACTIONS.has(action.type) || isPlaceholderAction(action.type)) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "skipped",
      message: "Placeholder action — external delivery not enabled in v1",
      durationMs: Date.now() - started,
    };
  }

  if (
    DESTRUCTIVE_ACTION_TYPES.includes(action.type) ||
    requiresConfirmation(action.type)
  ) {
    if (!workflow.confirmationRequired && !action.requiresConfirmation) {
      return {
        actionId: action.id,
        actionType: action.type,
        status: "skipped",
        message: "Destructive action skipped — confirmation required",
        durationMs: Date.now() - started,
      };
    }
  }

  try {
    switch (action.type) {
      case "create_activity":
        return await executeCreateActivity(input, started);
      case "send_notification":
        return await executeSendNotification(input, started);
      case "create_report_draft":
        return await executeCreateReportDraft(input, started);
      case "create_risk":
        return await executeCreateRisk(input, started);
      case "create_incident":
        return await executeCreateIncident(input, started);
      case "assign_owner":
        return {
          actionId: action.id,
          actionType: action.type,
          status: "skipped",
          message: "Assign owner requires explicit target configuration in v1",
          durationMs: Date.now() - started,
        };
      case "generate_ai_summary":
        return await executeGenerateAiSummary(input, started);
      case "archive_entity":
        return {
          actionId: action.id,
          actionType: action.type,
          status: "skipped",
          message: "Archive entity skipped in automated v1 execution",
          durationMs: Date.now() - started,
        };
      default:
        return {
          actionId: action.id,
          actionType: action.type,
          status: "skipped",
          message: `Unsupported action type: ${action.type}`,
          durationMs: Date.now() - started,
        };
    }
  } catch (error) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "failed",
      message: error instanceof Error ? error.message : "Action failed",
      durationMs: Date.now() - started,
    };
  }
}

async function executeCreateActivity(
  input: ActionExecutionInput,
  started: number,
): Promise<WorkflowActionOutcome> {
  const { action, event, ctx, workflow, context } = input;
  const title =
    (action.config?.title as string | undefined) ??
    `Workflow "${workflow.name}" executed`;
  const description =
    (action.config?.description as string | undefined) ??
    `Triggered by ${event.trigger} for ${event.entityType}`;

  await recordActivityEvent({
    organizationId: ctx.organizationId,
    actorUserId: event.actorUserId ?? null,
    entityType: mapEntityType(event.entityType),
    entityId: event.entityId,
    action: "workflow_executed",
    title,
    description,
    metadata: {
      automated: true,
      workflowId: workflow.id,
      workflowName: workflow.name,
      trigger: event.trigger,
      actionType: action.type,
      context,
    },
  });

  return {
    actionId: action.id,
    actionType: action.type,
    status: "success",
    message: "Activity recorded",
    durationMs: Date.now() - started,
  };
}

async function executeSendNotification(
  input: ActionExecutionInput,
  started: number,
): Promise<WorkflowActionOutcome> {
  const { action, event, ctx, workflow, context } = input;
  const assigneeId =
    (action.config?.userId as string | undefined) ??
    (context.assignee_id as string | undefined) ??
    (context.owner_id as string | undefined) ??
    null;

  await createNotificationForOwnersAdminsAndAssignee(
    ctx.organizationId,
    assigneeId,
    {
      type: "critical_risk",
      title: (action.config?.title as string | undefined) ?? `Workflow: ${workflow.name}`,
      message:
        (action.config?.message as string | undefined) ??
        `Automation "${workflow.name}" ran for ${event.entityType}.`,
      entityType: mapNotificationEntityType(event.entityType),
      entityId: event.entityId,
    },
  );

  return {
    actionId: action.id,
    actionType: action.type,
    status: "success",
    message: "Notification created",
    durationMs: Date.now() - started,
  };
}

async function executeCreateReportDraft(
  input: ActionExecutionInput,
  started: number,
): Promise<WorkflowActionOutcome> {
  const { action, event, ctx, context } = input;
  const clientId = (context.client_id as string | undefined) ?? event.clientId;
  if (!clientId) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "skipped",
      message: "No client available for report draft",
      durationMs: Date.now() - started,
    };
  }

  const supabase = await createClient();
  const title =
    (action.config?.title as string | undefined) ??
    `Automated report draft — ${new Date().toISOString().slice(0, 10)}`;

  const { error } = await supabase.from("reports").insert({
    organization_id: ctx.organizationId,
    client_id: clientId,
    title,
    status: "draft",
    reporting_period_start: new Date().toISOString().slice(0, 10),
    reporting_period_end: new Date().toISOString().slice(0, 10),
    created_by: ctx.userId,
  } as never);

  if (error) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "failed",
      message: "Failed to create report draft",
      durationMs: Date.now() - started,
    };
  }

  return {
    actionId: action.id,
    actionType: action.type,
    status: "success",
    message: "Report draft created",
    durationMs: Date.now() - started,
  };
}

async function executeCreateRisk(
  input: ActionExecutionInput,
  started: number,
): Promise<WorkflowActionOutcome> {
  return executeCreateEntityStub(input, started, "risk", "Automated risk");
}

async function executeCreateIncident(
  input: ActionExecutionInput,
  started: number,
): Promise<WorkflowActionOutcome> {
  return executeCreateEntityStub(input, started, "incident", "Automated incident");
}

async function executeCreateEntityStub(
  input: ActionExecutionInput,
  started: number,
  entity: "risk" | "incident",
  defaultTitle: string,
): Promise<WorkflowActionOutcome> {
  const { action, event, ctx, context } = input;
  const clientId = (context.client_id as string | undefined) ?? event.clientId;
  if (!clientId) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "skipped",
      message: `No client available to create ${entity}`,
      durationMs: Date.now() - started,
    };
  }

  const supabase = await createClient();
  const title = (action.config?.title as string | undefined) ?? defaultTitle;
  const table = entity === "risk" ? "risks" : "incidents";

  const { error } = await supabase.from(table).insert({
    organization_id: ctx.organizationId,
    client_id: clientId,
    title,
    severity: (action.config?.severity as string | undefined) ?? "medium",
    status: "open",
    owner_user_id: ctx.userId,
  } as never);

  if (error) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "failed",
      message: `Failed to create ${entity}`,
      durationMs: Date.now() - started,
    };
  }

  return {
    actionId: action.id,
    actionType: action.type,
    status: "success",
    message: `${entity} created`,
    durationMs: Date.now() - started,
  };
}

async function executeGenerateAiSummary(
  input: ActionExecutionInput,
  started: number,
): Promise<WorkflowActionOutcome> {
  const { action, event, ctx, workflow } = input;
  const access = await checkPlanFeature(ctx.organizationId, "ai_report_assistant");

  if (!access.allowed) {
    return {
      actionId: action.id,
      actionType: action.type,
      status: "skipped",
      message: access.message ?? "AI summary unavailable on current plan",
      durationMs: Date.now() - started,
    };
  }

  const provider = getDefaultAIProvider();
  const executionContext = buildExecutionContext(event);
  const clientId = String(executionContext.client_id ?? event.clientId ?? "unknown");
  const response = await provider.generate({
    prompt: `Summarize this workflow event in 2-3 sentences:\n${JSON.stringify(executionContext)}`,
    action: "generate_summary",
    context: {
      clientName: String(executionContext.title ?? event.entityType),
      clientId,
      periodLabel: new Date().toISOString().slice(0, 10),
      organizationName: "Organization",
      reportTitle: workflow.name,
      reportingPeriodStart: new Date().toISOString().slice(0, 10),
      reportingPeriodEnd: new Date().toISOString().slice(0, 10),
      executiveSummary: "",
      businessSummary: "",
      keyWins: "",
      keyRisks: "",
      nextActions: "",
      recommendations: "",
      customerHighlights: "",
      operationalHealthSummary: "",
      managementSummary: "",
      openRisks: [],
      openIncidents: [],
    },
    maxTokens: 200,
  });

  await recordActivityEvent({
    organizationId: ctx.organizationId,
    actorUserId: event.actorUserId ?? null,
    entityType: "organization",
    entityId: workflow.id,
    action: "workflow_executed",
    title: `AI summary — ${workflow.name}`,
    description: response.content.slice(0, 2000),
    metadata: {
      automated: true,
      workflowId: workflow.id,
      actionType: action.type,
      aiGenerated: true,
    },
  });

  return {
    actionId: action.id,
    actionType: action.type,
    status: "success",
    message: "AI summary generated and logged",
    durationMs: Date.now() - started,
  };
}

function mapNotificationEntityType(entityType: string): NotificationEntityType {
  switch (entityType) {
    case "client":
      return "client";
    case "risk":
      return "risk";
    case "incident":
      return "incident";
    case "report":
      return "report";
    case "team":
      return "team";
    default:
      return "organization";
  }
}

function mapEntityType(entityType: string) {
  switch (entityType) {
    case "client":
      return "client" as const;
    case "risk":
      return "risk" as const;
    case "incident":
      return "incident" as const;
    case "report":
      return "report" as const;
    default:
      return "organization" as const;
  }
}

export function buildEventId(event: WorkflowEngineEvent): string {
  return (
    event.eventId ??
    createHash("sha256")
      .update(`${event.organizationId}:${event.trigger}:${event.entityType}:${event.entityId}:${Date.now()}`)
      .digest("hex")
      .slice(0, 24)
  );
}
