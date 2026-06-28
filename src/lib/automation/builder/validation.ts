import type {
  WorkflowAction,
  WorkflowCondition,
  WorkflowConditionGroup,
  WorkflowDefinition,
  WorkflowValidationIssue,
  WorkflowValidationResult,
} from "@/lib/automation/builder/types";
import { DESTRUCTIVE_ACTION_TYPES } from "@/lib/automation/builder/types";

function hasDuplicateIds(items: Array<{ id: string }>): string | null {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) return item.id;
    seen.add(item.id);
  }
  return null;
}

function evaluateConditionGroup(
  group: WorkflowConditionGroup,
  context: Record<string, unknown>,
): boolean {
  const conditionResults = group.conditions.map((condition) =>
    evaluateCondition(condition, context),
  );
  const nestedResults = (group.groups ?? []).map((nested) =>
    evaluateConditionGroup(nested, context),
  );
  const allResults = [...conditionResults, ...nestedResults];

  if (allResults.length === 0) return true;
  return group.logic === "and"
    ? allResults.every(Boolean)
    : allResults.some(Boolean);
}

function evaluateCondition(
  condition: WorkflowCondition,
  context: Record<string, unknown>,
): boolean {
  const actual = context[condition.field];
  const expected = condition.value;

  switch (condition.operator) {
    case "equals":
      return String(actual) === String(expected);
    case "not_equals":
      return String(actual) !== String(expected);
    case "greater_than":
      return Number(actual) > Number(expected);
    case "less_than":
      return Number(actual) < Number(expected);
    case "contains":
      return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    case "in":
      return Array.isArray(expected)
        ? expected.map(String).includes(String(actual))
        : false;
    default:
      return false;
  }
}

/** Validate workflow structure before save or activation. */
export function validateWorkflow(workflow: WorkflowDefinition): WorkflowValidationResult {
  const issues: WorkflowValidationIssue[] = [];

  if (!workflow.trigger?.type) {
    issues.push({
      id: "missing-trigger",
      severity: "error",
      message: "Workflow must have a trigger.",
    });
  }

  if (!workflow.actions || workflow.actions.length === 0) {
    issues.push({
      id: "missing-action",
      severity: "error",
      message: "Workflow must have at least one action.",
    });
  }

  const duplicateActionId = workflow.actions ? hasDuplicateIds(workflow.actions) : null;
  if (duplicateActionId) {
    issues.push({
      id: "duplicate-action",
      severity: "error",
      message: `Duplicate action id: ${duplicateActionId}`,
      nodeId: duplicateActionId,
    });
  }

  const actionTypes = workflow.actions?.map((action) => action.type) ?? [];
  const duplicateActionTypes = actionTypes.filter(
    (type, index) => actionTypes.indexOf(type) !== index,
  );
  if (duplicateActionTypes.length > 0) {
    issues.push({
      id: "duplicate-action-type",
      severity: "warning",
      message: `Duplicate action type detected: ${duplicateActionTypes[0]}. Consider consolidating.`,
    });
  }

  if (workflow.conditions) {
    const impossible = findImpossibleCondition(workflow.conditions);
    if (impossible) {
      issues.push({
        id: "impossible-condition",
        severity: "warning",
        message: impossible,
        nodeId: workflow.conditions.id,
      });
    }
  }

  if (detectCircularConditions(workflow.conditions)) {
    issues.push({
      id: "circular-workflow",
      severity: "error",
      message: "Condition groups contain circular nesting beyond allowed depth.",
    });
  }

  const destructive = workflow.actions?.filter((action) =>
    DESTRUCTIVE_ACTION_TYPES.includes(action.type),
  );
  if (destructive && destructive.length > 0 && !workflow.confirmationRequired) {
    issues.push({
      id: "destructive-no-confirm",
      severity: "warning",
      message: "Destructive actions should require confirmation before execution.",
    });
  }

  if (!workflow.name.trim()) {
    issues.push({
      id: "missing-name",
      severity: "error",
      message: "Automation name is required.",
    });
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

function findImpossibleCondition(group: WorkflowConditionGroup): string | null {
  for (const condition of group.conditions) {
    if (
      condition.field === "profitability" &&
      condition.operator === "greater_than" &&
      Number(condition.value) > 100
    ) {
      return "Profitability cannot exceed 100%.";
    }
  }

  for (const nested of group.groups ?? []) {
    const nestedIssue = findImpossibleCondition(nested);
    if (nestedIssue) return nestedIssue;
  }

  return null;
}

function detectCircularConditions(
  group: WorkflowConditionGroup | undefined,
  depth = 0,
  visited = new Set<string>(),
): boolean {
  if (!group) return false;
  if (depth > 8) return true;
  if (visited.has(group.id)) return true;

  visited.add(group.id);
  for (const nested of group.groups ?? []) {
    if (detectCircularConditions(nested, depth + 1, new Set(visited))) {
      return true;
    }
  }
  return false;
}

export function evaluateWorkflowConditions(
  workflow: WorkflowDefinition,
  context: Record<string, unknown>,
): boolean {
  if (!workflow.conditions) return true;
  return evaluateConditionGroup(workflow.conditions, context);
}

export function describeAction(action: WorkflowAction): string {
  return action.label ?? action.type.replace(/_/g, " ");
}
