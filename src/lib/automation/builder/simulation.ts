import type {
  WorkflowDefinition,
  WorkflowSimulationResult,
} from "@/lib/automation/builder/types";
import { WORKFLOW_TRIGGER_LABELS } from "@/lib/automation/builder/types";
import {
  describeAction,
  evaluateWorkflowConditions,
} from "@/lib/automation/builder/validation";

const SAMPLE_CONTEXTS: Record<string, Record<string, unknown>> = {
  risk_created: {
    severity: "critical",
    status: "open",
    client: "Acme Corp",
    owner: "Engineer",
    risk_score: 85,
    incident_count: 2,
    sla_status: "at_risk",
    customer_health: "watch",
    workspace_health: 72,
    profitability: 18,
    report_age: 14,
    tags: "security",
  },
  incident_created: {
    severity: "critical",
    status: "open",
    client: "Acme Corp",
    owner: null,
    incident_count: 3,
    sla_status: "breached",
    customer_health: "critical",
    workspace_health: 55,
    profitability: 12,
  },
  report_drafted: {
    severity: "medium",
    status: "draft",
    client: "Northwind",
    report_age: 35,
    owner: "Account Manager",
    workspace_health: 68,
  },
  sla_breached: {
    sla_status: "breached",
    severity: "high",
    client: "Contoso",
    customer_health: "watch",
    workspace_health: 60,
  },
  customer_health_changed: {
    customer_health: "critical",
    client: "Fabrikam",
    workspace_health: 48,
    incident_count: 4,
  },
  profitability_changed: {
    profitability: 15,
    client: "Tailwind Traders",
    customer_health: "watch",
  },
  default: {
    severity: "medium",
    status: "open",
    client: "Sample Client",
    owner: "Team Lead",
    workspace_health: 75,
    customer_health: "active",
    profitability: 32,
    report_age: 7,
    sla_status: "on_track",
  },
};

function resolveSampleContext(triggerType: string): Record<string, unknown> {
  return SAMPLE_CONTEXTS[triggerType] ?? SAMPLE_CONTEXTS.default;
}

/** Simulate workflow against sample data — no real execution. */
export function simulateWorkflow(workflow: WorkflowDefinition): WorkflowSimulationResult {
  const started = Date.now();
  const sampleContext = resolveSampleContext(workflow.trigger.type);
  const triggerMatched = Boolean(workflow.trigger.type);
  const conditionsMatched = evaluateWorkflowConditions(workflow, sampleContext);

  const actions = workflow.actions.map((action) => {
    const executed = triggerMatched && conditionsMatched;
    return {
      actionId: action.id,
      actionType: action.type,
      status: executed ? ("executed" as const) : ("skipped" as const),
      message: executed
        ? `[Simulated] ${describeAction(action)} would run.`
        : `[Skipped] ${describeAction(action)} — conditions not met.`,
    };
  });

  const executed = actions.filter((action) => action.status === "executed");
  const skipped = actions.filter((action) => action.status === "skipped");

  const conditionDetails: string[] = [];
  if (workflow.conditions) {
    conditionDetails.push(
      conditionsMatched
        ? "All condition groups matched sample context."
        : "One or more conditions did not match sample context.",
    );
  } else {
    conditionDetails.push("No conditions — all actions eligible when trigger fires.");
  }

  return {
    triggerMatched,
    triggerLabel: WORKFLOW_TRIGGER_LABELS[workflow.trigger.type],
    conditionsMatched,
    conditionDetails,
    actions: executed,
    skippedActions: skipped,
    durationMs: Date.now() - started,
    sampleContext,
  };
}
