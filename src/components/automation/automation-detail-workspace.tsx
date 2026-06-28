"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useAutomationStore } from "@/components/automation/automation-store-provider";
import { WorkflowGraph } from "@/components/automation/workflow-graph";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Select } from "@/components/ui/select";
import type { WorkflowDefinition, WorkflowExecutionRecord } from "@/lib/automation/builder/types";
import { exportExecutionLog } from "@/lib/automation/builder/storage";
import { runWorkflowManuallyAction } from "@/lib/automation/engine-v2/actions-server";
import { cn } from "@/lib/utils/cn";
import { auroraSurface } from "@/lib/ui/aurora";
import { linkText } from "@/lib/ui/tokens";

type AutomationDetailWorkspaceProps = {
  workflow: WorkflowDefinition;
  canManage: boolean;
  canRunManual: boolean;
};

function matchesStatusFilter(
  record: WorkflowExecutionRecord,
  filter: "all" | WorkflowExecutionRecord["status"],
): boolean {
  if (filter === "all") return true;
  return record.status === filter;
}

export function AutomationDetailWorkspace({
  workflow,
  canManage,
  canRunManual,
}: AutomationDetailWorkspaceProps) {
  const { store, setWorkflowStatus, getVersions, refresh } = useAutomationStore();
  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowExecutionRecord["status"]>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const executions = useMemo(
    () =>
      store.executions
        .filter((record) => record.workflowId === workflow.id)
        .filter((record) => matchesStatusFilter(record, statusFilter)),
    [statusFilter, store.executions, workflow.id],
  );

  const versions = getVersions(workflow.id);

  const handleManualRun = () => {
    setError(null);
    startTransition(async () => {
      const result = await runWorkflowManuallyAction(workflow.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted capitalize">Status: {workflow.status}</p>
          <p className="mt-1 text-sm text-muted">Version v{workflow.version}</p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Link href={`/automation/new?edit=${workflow.id}`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
            {canRunManual && workflow.status === "active" ? (
              <Button size="sm" variant="outline" loading={isPending} onClick={handleManualRun}>
                Run manually
              </Button>
            ) : null}
            {workflow.status !== "active" ? (
              <Button size="sm" onClick={() => void setWorkflowStatus(workflow.id, "active")}>
                Activate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void setWorkflowStatus(workflow.id, "disabled")}
              >
                Disable
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <WorkflowGraph workflow={workflow} />

      {workflow.confirmationRequired ? (
        <FormAlert variant="warning">
          Confirmation is required before destructive actions execute.
        </FormAlert>
      ) : null}

      <section aria-label="Execution history" className={cn(auroraSurface, "p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">Execution history</h2>
          <div className="w-full max-w-[220px]">
            <Select
              label="Filter status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | WorkflowExecutionRecord["status"])
              }
              options={[
                { value: "all", label: "All statuses" },
                { value: "success", label: "Success" },
                { value: "partial", label: "Partial" },
                { value: "failed", label: "Failed" },
                { value: "skipped", label: "Skipped" },
                { value: "simulated", label: "Simulated" },
                { value: "running", label: "Running" },
              ]}
            />
          </div>
        </div>

        {executions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No executions recorded yet. Run a simulation from the builder or trigger a live event.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {executions.map((record) => (
              <li key={record.id} className="rounded-lg border border-border bg-muted/5 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground capitalize">{record.status}</p>
                    <p className="mt-1 text-muted">
                      Trigger: {record.trigger ?? "—"} · Initiated by: {record.triggeredBy}
                    </p>
                    <p className="mt-1 text-muted">
                      {new Date(record.startedAt).toLocaleString()} →{" "}
                      {new Date(record.finishedAt).toLocaleString()} · {record.durationMs}ms
                    </p>
                    {record.conditionsMatched === false ? (
                      <p className="mt-1 text-muted">Conditions did not match — execution skipped.</p>
                    ) : null}
                    <p className="mt-1 text-muted">
                      Actions: {record.executedActions.join(", ") || "none"}
                    </p>
                    {record.errors.length > 0 ? (
                      <p className="mt-1 text-danger">{record.errors.join("; ")}</p>
                    ) : null}
                    {expandedId === record.id && record.steps && record.steps.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                        {record.steps.map((step) => (
                          <li key={`${record.id}-${step.orderIndex}-${step.action}`}>
                            <span className="font-medium text-foreground">{step.action}</span> ·{" "}
                            <span className="capitalize">{step.status}</span>
                            {step.message ? ` — ${step.message}` : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    >
                      {expandedId === record.id ? "Hide details" : "View details"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void navigator.clipboard.writeText(exportExecutionLog(record))}
                    >
                      Copy log
                    </Button>
                    {record.status === "failed" ? (
                      <span className={cn(linkText, "self-center")}>Retry (future)</span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {versions.length > 0 ? (
        <section aria-label="Version history" className={cn(auroraSurface, "p-5")}>
          <h2 className="text-sm font-semibold text-foreground">Versions</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {versions.map((version) => (
              <li key={`${version.version}-${version.savedAt}`}>
                {version.label} · {new Date(version.savedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
