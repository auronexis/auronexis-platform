import type {
  AutomationDashboardStats,
  AutomationStore,
  AutomationSuggestion,
  WorkflowDefinition,
  WorkflowExecutionRecord,
  WorkflowVersionSnapshot,
} from "@/lib/automation/builder/types";

type SuggestionInput = {
  openCriticalRisks: number;
  openIncidents: number;
  overdueReports: number;
  criticalHealthClients: number;
  delayedReports: number;
};

/** Data-driven automation suggestions — no fabricated patterns. */
export function buildAutomationSuggestions(input: SuggestionInput): AutomationSuggestion[] {
  const suggestions: AutomationSuggestion[] = [];

  if (input.openCriticalRisks > 0 && input.openIncidents > 0) {
    suggestions.push({
      id: "risk-to-incident",
      title: "Risk-to-incident follow-up",
      description: "You frequently manage critical risks alongside active incidents.",
      suggestedPrompt:
        "If a critical risk exists for more than 7 days, create an incident and notify the owner.",
      priority: "high",
    });
  }

  if (input.overdueReports > 0 || input.delayedReports > 0) {
    suggestions.push({
      id: "report-reminders",
      title: "Report reminder automation",
      description: "Reports are often delayed in your workspace.",
      suggestedPrompt:
        "When a report becomes overdue, notify the account owner and create an activity.",
      priority: "high",
    });
  }

  if (input.criticalHealthClients > 0) {
    suggestions.push({
      id: "health-follow-up",
      title: "Customer health follow-up",
      description: "Customers with poor health always receive manual follow-up.",
      suggestedPrompt:
        "When customer health becomes Critical, create a follow-up task and notify management.",
      priority: "medium",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "report-reminder-default",
      title: "Automate report reminders",
      description: "Consider automating report reminders for consistent delivery.",
      suggestedPrompt:
        "When no report was published for 30 days, remind the assigned engineer.",
      priority: "low",
    });
  }

  return suggestions.slice(0, 4);
}

export function computeDashboardStats(
  store: AutomationStore,
): AutomationDashboardStats {
  const today = new Date().toISOString().slice(0, 10);
  const activeCount = store.automations.filter((a) => a.status === "active").length;
  const draftCount = store.automations.filter((a) => a.status === "draft").length;
  const disabledCount = store.automations.filter((a) => a.status === "disabled").length;
  const successfulExecutions = store.executions.filter(
    (e) => e.status === "success" || e.status === "simulated",
  ).length;
  const failedExecutions = store.executions.filter((e) => e.status === "failed").length;
  const todayExecutions = store.executions.filter((e) =>
    e.startedAt.startsWith(today),
  ).length;
  const lastExecutionAt =
    store.executions.length > 0
      ? store.executions.sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        )[0]?.startedAt ?? null
      : null;

  return {
    activeCount,
    draftCount,
    disabledCount,
    successfulExecutions,
    failedExecutions,
    todayExecutions,
    lastExecutionAt,
  };
}

export function createEmptyStore(): AutomationStore {
  return { automations: [], executions: [], versions: {} };
}

export function appendVersionSnapshot(
  store: AutomationStore,
  workflow: WorkflowDefinition,
): WorkflowVersionSnapshot[] {
  const existing = store.versions[workflow.id] ?? [];
  const snapshot: WorkflowVersionSnapshot = {
    version: workflow.version,
    savedAt: new Date().toISOString(),
    workflow: structuredClone(workflow),
    label: `v${workflow.version}`,
  };
  return [snapshot, ...existing].slice(0, 10);
}

export function buildSimulatedExecutionRecord(
  workflow: WorkflowDefinition,
  triggeredBy: string,
): WorkflowExecutionRecord {
  const started = new Date();
  const finished = new Date(started.getTime() + 42);
  return {
    id: crypto.randomUUID(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: "simulated",
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - started.getTime(),
    triggeredBy,
    executedActions: workflow.actions.map((action) => action.type),
    errors: [],
    simulated: true,
  };
}

export function filterAutomations(
  automations: WorkflowDefinition[],
  query: string,
  statusFilter: "all" | "active" | "draft" | "disabled",
): WorkflowDefinition[] {
  const normalized = query.trim().toLowerCase();
  return automations.filter((automation) => {
    if (statusFilter !== "all" && automation.status !== statusFilter) {
      return false;
    }
    if (!normalized) return true;
    return (
      automation.name.toLowerCase().includes(normalized) ||
      automation.description?.toLowerCase().includes(normalized) ||
      automation.trigger.type.toLowerCase().includes(normalized)
    );
  });
}
