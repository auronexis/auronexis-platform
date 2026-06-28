import type {
  WorkflowCondition,
  WorkflowConditionGroup,
  WorkflowDefinition,
} from "@/lib/automation/builder/types";
import { resolveContextField } from "@/lib/automation/engine-v2/context";
import type { WorkflowExecutionContext } from "@/lib/automation/engine-v2/types";

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function compareValues(
  operator: WorkflowCondition["operator"] | string,
  actual: unknown,
  expected: WorkflowCondition["value"],
): { matched: boolean; reason?: string } {
  if (actual === undefined) {
    return { matched: false, reason: "Field unavailable in execution context" };
  }

  switch (operator) {
    case "equals":
      return { matched: String(actual) === String(expected) };
    case "not_equals":
      return { matched: String(actual) !== String(expected) };
    case "greater_than":
      return { matched: Number(actual) > Number(expected) };
    case "less_than":
      return { matched: Number(actual) < Number(expected) };
    case "greater_or_equal":
      return { matched: Number(actual) >= Number(expected) };
    case "less_or_equal":
      return { matched: Number(actual) <= Number(expected) };
    case "contains":
      return {
        matched: String(actual).toLowerCase().includes(String(expected).toLowerCase()),
      };
    case "is_empty":
      return { matched: isEmpty(actual) };
    case "is_not_empty":
      return { matched: !isEmpty(actual) };
    case "in":
      return {
        matched: Array.isArray(expected)
          ? expected.map(String).includes(String(actual))
          : false,
      };
    case "not_in":
      return {
        matched: Array.isArray(expected)
          ? !expected.map(String).includes(String(actual))
          : true,
      };
    default:
      return { matched: false, reason: `Unsupported operator: ${operator}` };
  }
}

function evaluateCondition(
  condition: WorkflowCondition,
  context: WorkflowExecutionContext,
): { matched: boolean; reason?: string } {
  const actual = resolveContextField(String(condition.field), context);
  return compareValues(condition.operator, actual, condition.value);
}

function evaluateConditionGroup(
  group: WorkflowConditionGroup,
  context: WorkflowExecutionContext,
): { matched: boolean; details: string[] } {
  const conditionResults = group.conditions.map((condition) => {
    const result = evaluateCondition(condition, context);
    return {
      matched: result.matched,
      detail: `${condition.field} ${condition.operator}: ${result.matched ? "pass" : result.reason ?? "fail"}`,
    };
  });

  const nestedResults = (group.groups ?? []).map((nested) => evaluateConditionGroup(nested, context));
  const allResults = [
    ...conditionResults.map((item) => item.matched),
    ...nestedResults.map((item) => item.matched),
  ];
  const allDetails = [
    ...conditionResults.map((item) => item.detail),
    ...nestedResults.flatMap((item) => item.details),
  ];

  if (allResults.length === 0) {
    return { matched: true, details: ["No conditions configured"] };
  }

  const matched =
    group.logic === "and" ? allResults.every(Boolean) : allResults.some(Boolean);

  return { matched, details: allDetails };
}

export function evaluateWorkflowConditionsDetailed(
  workflow: WorkflowDefinition,
  context: WorkflowExecutionContext,
): { matched: boolean; details: string[] } {
  if (!workflow.conditions) {
    return { matched: true, details: ["No conditions configured"] };
  }

  return evaluateConditionGroup(workflow.conditions, context);
}

export function evaluateWorkflowConditions(
  workflow: WorkflowDefinition,
  context: WorkflowExecutionContext,
): boolean {
  return evaluateWorkflowConditionsDetailed(workflow, context).matched;
}
