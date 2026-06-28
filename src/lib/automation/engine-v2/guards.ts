import "server-only";

import { validateWorkflowForPersistence } from "@/lib/automation/storage/validation";
import type { WorkflowDefinition } from "@/lib/automation/builder/types";
import { WorkflowEngineError } from "@/lib/automation/engine-v2/errors";

export function assertExecutableWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
  const validated = validateWorkflowForPersistence(workflow);
  if (!validated.ok) {
    throw new WorkflowEngineError("INVALID_WORKFLOW", validated.error.message);
  }

  if (workflow.status !== "active") {
    throw new WorkflowEngineError(
      "INACTIVE_WORKFLOW",
      "Only active workflows can execute.",
    );
  }

  return validated.workflow;
}

export function isPlaceholderAction(actionType: string): boolean {
  return (
    actionType.endsWith("_placeholder") ||
    actionType === "webhook_placeholder" ||
    actionType === "email_placeholder" ||
    actionType === "slack_placeholder" ||
    actionType === "teams_placeholder"
  );
}

export function requiresConfirmation(actionType: string): boolean {
  return actionType === "archive_entity";
}
