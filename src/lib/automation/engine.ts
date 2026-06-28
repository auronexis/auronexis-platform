import { executeAutomationAction } from "@/lib/automation/actions";
import { resolveAutomationActions } from "@/lib/automation/triggers";
import type { AutomationEvent, AutomationRunResult } from "@/lib/automation/types";
import { canUseFeature } from "@/lib/plans/guards";
import { processEscalationForAutomationEvent } from "@/lib/escalation/engine";

/** Run all automation actions configured for an operational trigger. */
export async function runAutomation(event: AutomationEvent): Promise<AutomationRunResult> {
  const actionTypes = resolveAutomationActions(event);

  if (actionTypes.length === 0) {
    return { trigger: event.trigger, actions: [] };
  }

  const actions = [];

  for (const actionType of actionTypes) {
    const result = await executeAutomationAction(actionType, event);
    actions.push(result);
  }

  return {
    trigger: event.trigger,
    actions,
  };
}

/**
 * Fire automation without blocking the caller on unexpected failures.
 * Individual action errors are captured in the run result and logged.
 */
export async function dispatchAutomation(event: AutomationEvent): Promise<void> {
  const automationEnabled = await canUseFeature(event.organizationId, "automation_engine");

  if (!automationEnabled) {
    return;
  }

  try {
    const result = await runAutomation(event);

    for (const action of result.actions) {
      if (!action.success) {
        console.error(
          `[automation] ${result.trigger} → ${action.action} failed:`,
          action.error ?? "unknown error",
        );
      }
    }

    await processEscalationForAutomationEvent(event).catch((escalationError) => {
      const message =
        escalationError instanceof Error ? escalationError.message : "Escalation processing failed.";
      console.error(`[escalation] dispatch failed for ${event.trigger}:`, message);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation dispatch failed.";
    console.error(`[automation] dispatch failed for ${event.trigger}:`, message);
  }

  try {
    const { fireWorkflowEngineFromAutomationEvent } = await import(
      "@/lib/automation/engine-v2/dispatch-hook"
    );
    await fireWorkflowEngineFromAutomationEvent(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow engine dispatch failed.";
    console.error(`[workflow-engine] dispatch failed for ${event.trigger}:`, message);
  }
}
