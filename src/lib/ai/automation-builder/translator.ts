import type { WorkflowAction, WorkflowDefinition } from "@/lib/automation/builder/types";
import {
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_TRIGGER_LABELS,
} from "@/lib/automation/builder/types";

export function buildWorkflowTranslationPrompt(naturalLanguage: string): string {
  return [
    "You are an automation workflow translator for Auroranexis — an MSP platform.",
    "Convert the user's natural language request into a structured workflow JSON object.",
    "",
    "=== Rules ===",
    "- Output ONLY valid JSON matching the schema below.",
    "- Never invent triggers or actions not listed.",
    "- Use confirmationRequired: true for destructive actions (archive_entity).",
    "- Default status to draft.",
    "- Generate UUIDs for id fields.",
    "- Never include executable code or JavaScript.",
    "",
    "=== Allowed triggers ===",
    Object.entries(WORKFLOW_TRIGGER_LABELS)
      .map(([key, label]) => `- ${key}: ${label}`)
      .join("\n"),
    "",
    "=== Allowed actions ===",
    Object.entries(WORKFLOW_ACTION_LABELS)
      .map(([key, label]) => `- ${key}: ${label}`)
      .join("\n"),
    "",
    "=== JSON schema ===",
    `{ "name": string, "description": string, "status": "draft", "confirmationRequired": boolean, "trigger": { "type": trigger_type }, "conditions": { "id": string, "logic": "and"|"or", "conditions": [{ "id": string, "field": string, "operator": string, "value": string|number }] }, "actions": [{ "id": string, "type": action_type, "label": string }] }`,
    "",
    "=== User request ===",
    naturalLanguage.trim(),
  ].join("\n");
}

export function parseWorkflowFromAIResponse(content: string): WorkflowDefinition | null {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<WorkflowDefinition>;
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const actions: WorkflowAction[] = (parsed.actions ?? []).map((action) => ({
      id: action.id ?? crypto.randomUUID(),
      type: action.type ?? "create_activity",
      label: action.label,
      config: action.config,
      requiresConfirmation: action.requiresConfirmation,
    }));

    if (actions.length === 0) {
      actions.push({
        id: crypto.randomUUID(),
        type: "send_notification",
        label: "Notify team",
      });
    }

    return {
      id,
      name: parsed.name?.trim() || "Untitled automation",
      description: parsed.description,
      status: "draft",
      trigger: parsed.trigger ?? { type: "manual_trigger" },
      conditions: parsed.conditions,
      actions,
      confirmationRequired: parsed.confirmationRequired ?? false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastExecutedAt: null,
    };
  } catch {
    return null;
  }
}

/** Rule-based fallback when AI provider unavailable. */
export function translateWorkflowFallback(naturalLanguage: string): WorkflowDefinition {
  const text = naturalLanguage.toLowerCase();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  let triggerType: WorkflowDefinition["trigger"]["type"] = "manual_trigger";
  if (text.includes("critical incident")) triggerType = "incident_created";
  else if (text.includes("critical risk")) triggerType = "risk_created";
  else if (text.includes("overdue") && text.includes("report")) triggerType = "report_drafted";
  else if (text.includes("sla")) triggerType = "sla_breached";
  else if (text.includes("profitability")) triggerType = "profitability_changed";
  else if (text.includes("customer health")) triggerType = "customer_health_changed";
  else if (text.includes("30 days") || text.includes("no report")) triggerType = "schedule_due";

  const actions: WorkflowDefinition["actions"] = [];

  if (text.includes("notify") || text.includes("remind")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "send_notification",
      label: "Send notification",
    });
  }
  if (text.includes("customer update") || text.includes("customer email")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "generate_customer_update",
      label: "Prepare customer update",
    });
  }
  if (text.includes("create an incident") || text.includes("create incident")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "create_incident",
      label: "Create incident",
    });
  }
  if (text.includes("activity")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "create_activity",
      label: "Create activity",
    });
  }
  if (text.includes("mitigation")) {
    actions.push({
      id: crypto.randomUUID(),
      type: "generate_mitigation_plan",
      label: "Generate mitigation plan",
    });
  }
  if (actions.length === 0) {
    actions.push({
      id: crypto.randomUUID(),
      type: "create_activity",
      label: "Create follow-up activity",
    });
  }

  const conditions =
    text.includes("critical") || text.includes("below")
      ? {
          id: crypto.randomUUID(),
          logic: "and" as const,
          conditions: [
            {
              id: crypto.randomUUID(),
              field: text.includes("profitability") ? "profitability" : "severity",
              operator: text.includes("below") ? ("less_than" as const) : ("equals" as const),
              value: text.includes("profitability") ? 20 : "critical",
            },
          ],
        }
      : undefined;

  return {
    id,
    name: naturalLanguage.slice(0, 80) || "New automation",
    description: naturalLanguage,
    status: "draft",
    trigger: { type: triggerType },
    conditions,
    actions,
    confirmationRequired: text.includes("archive") || text.includes("delete"),
    version: 1,
    createdAt: now,
    updatedAt: now,
    lastExecutedAt: null,
  };
}
