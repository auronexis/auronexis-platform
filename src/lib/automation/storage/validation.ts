import "server-only";

import { parseWorkflowDefinition } from "@/lib/automation/builder/schema";
import type { WorkflowDefinition } from "@/lib/automation/builder/types";
import type { AutomationStore } from "@/lib/automation/builder/types";

export type ValidationError = {
  code: "INVALID_WORKFLOW" | "INVALID_STORE";
  message: string;
};

export function validateWorkflowForPersistence(
  workflow: unknown,
): { ok: true; workflow: WorkflowDefinition } | { ok: false; error: ValidationError } {
  const parsed = parseWorkflowDefinition(workflow);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "INVALID_WORKFLOW",
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      },
    };
  }

  return { ok: true, workflow: parsed.data };
}

export function validateAutomationStoreForMigration(
  store: unknown,
): { ok: true; store: AutomationStore } | { ok: false; error: ValidationError } {
  if (!store || typeof store !== "object") {
    return { ok: false, error: { code: "INVALID_STORE", message: "Invalid store payload." } };
  }

  const candidate = store as AutomationStore;
  if (!Array.isArray(candidate.automations)) {
    return { ok: false, error: { code: "INVALID_STORE", message: "Missing automations array." } };
  }

  for (const workflow of candidate.automations) {
    const validated = validateWorkflowForPersistence(workflow);
    if (!validated.ok) {
      return validated;
    }
  }

  return {
    ok: true,
    store: {
      automations: candidate.automations,
      executions: Array.isArray(candidate.executions) ? candidate.executions : [],
      versions: candidate.versions && typeof candidate.versions === "object" ? candidate.versions : {},
    },
  };
}
