import type { PlanKey } from "@/lib/billing/plans";
import { getPlanLimit } from "@/lib/plans/features";
import type { WorkflowDefinition } from "@/lib/automation/builder/types";

export function getAutomationLimitForPlan(planKey: PlanKey): number | null {
  return getPlanLimit(planKey, "max_automations");
}

export function formatAutomationLimit(limit: number | null): string {
  if (limit === null) return "Unlimited automations";
  return `Up to ${limit} automation${limit === 1 ? "" : "s"}`;
}

export function formatAutomationUsage(used: number, limit: number | null): string {
  if (limit === null) return `${used} / Unlimited`;
  return `${used} / ${limit}`;
}

export function isAtAutomationLimit(
  automations: WorkflowDefinition[],
  planKey: PlanKey,
): boolean {
  const limit = getAutomationLimitForPlan(planKey);
  if (limit === null) return false;
  const activeLike = automations.filter((a) => a.status !== "disabled").length;
  return activeLike >= limit;
}

export function assertAutomationLimit(
  automations: WorkflowDefinition[],
  planKey: PlanKey,
): { allowed: true } | { allowed: false; message: string } {
  const limit = getAutomationLimitForPlan(planKey);
  if (limit === null) return { allowed: true };

  const used = automations.filter((a) => a.status !== "disabled").length;
  if (used >= limit) {
    return {
      allowed: false,
      message: `Your plan allows ${limit} automation${limit === 1 ? "" : "s"}. Disable or delete one to create another.`,
    };
  }

  return { allowed: true };
}
