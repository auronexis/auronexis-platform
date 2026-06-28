"use client";



import type { AutomationStore } from "@/lib/automation/builder/types";

import { STORAGE_KEY_PREFIX } from "@/lib/automation/builder/types";

import { createEmptyStore } from "@/lib/automation/builder/suggestions";



export function getStorageKey(organizationId: string): string {

  return `${STORAGE_KEY_PREFIX}${organizationId}`;

}



/** Read legacy localStorage store — used only for one-time migration. */

export function loadAutomationStore(organizationId: string): AutomationStore {

  if (typeof window === "undefined") {

    return createEmptyStore();

  }



  try {

    const raw = window.localStorage.getItem(getStorageKey(organizationId));

    if (!raw) return createEmptyStore();

    const parsed = JSON.parse(raw) as AutomationStore;

    return {

      automations: parsed.automations ?? [],

      executions: parsed.executions ?? [],

      versions: parsed.versions ?? {},

    };

  } catch {

    return createEmptyStore();

  }

}



export function hasLocalAutomationDrafts(organizationId: string): boolean {

  const store = loadAutomationStore(organizationId);

  return store.automations.length > 0;

}



export function clearAutomationStore(organizationId: string): void {

  if (typeof window === "undefined") return;

  window.localStorage.removeItem(getStorageKey(organizationId));

}



export function exportExecutionLog(record: import("@/lib/automation/builder/types").WorkflowExecutionRecord): string {
  const lines = [
    `Workflow: ${record.workflowName}`,
    `Status: ${record.status}`,
    `Trigger: ${record.trigger ?? "—"}`,
    `Started: ${record.startedAt}`,
    `Finished: ${record.finishedAt}`,
    `Duration: ${record.durationMs}ms`,
    `Triggered by: ${record.triggeredBy}`,
    `Conditions matched: ${record.conditionsMatched ?? "unknown"}`,
    `Actions: ${record.executedActions.join(", ") || "none"}`,
    record.errors.length > 0 ? `Errors: ${record.errors.join("; ")}` : "Errors: none",
    record.simulated ? "Mode: simulation" : "Mode: live",
  ];

  if (record.steps && record.steps.length > 0) {
    lines.push("", "Steps:");
    for (const step of record.steps) {
      lines.push(`- [${step.status}] ${step.action}${step.message ? `: ${step.message}` : ""}`);
    }
  }

  return lines.join("\n");
}


