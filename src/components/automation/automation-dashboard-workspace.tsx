"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Workflow } from "lucide-react";
import { useAutomationStore } from "@/components/automation/automation-store-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { InteractiveSurface, LinkOverlay, rowInteractiveClass } from "@/components/ui/interactive-surface";
import { filterAutomations } from "@/lib/automation/builder";
import type { AutomationSuggestion } from "@/lib/automation/builder/types";
import { WORKFLOW_TRIGGER_LABELS } from "@/lib/automation/builder/types";
import { cn } from "@/lib/utils/cn";
import { auroraSurface } from "@/lib/ui/aurora";
import { linkText } from "@/lib/ui/tokens";

type AutomationDashboardWorkspaceProps = {
  suggestions: AutomationSuggestion[];
  canManage: boolean;
};

const statusStyles = {
  active: "bg-emerald-500/10 text-emerald-700",
  draft: "bg-amber-500/10 text-amber-700",
  disabled: "bg-muted/20 text-muted",
};

export function AutomationDashboardWorkspace({
  suggestions,
  canManage,
}: AutomationDashboardWorkspaceProps) {
  const { store, stats, usageLabel, setWorkflowStatus, deleteWorkflow } = useAutomationStore();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "disabled">("all");

  const filtered = useMemo(
    () => filterAutomations(store.automations, query, statusFilter),
    [query, statusFilter, store.automations],
  );

  const metrics = [
    { label: "Active", value: stats.activeCount },
    { label: "Draft", value: stats.draftCount },
    { label: "Disabled", value: stats.disabledCount },
    { label: "Successful runs", value: stats.successfulExecutions },
    { label: "Failed runs", value: stats.failedExecutions },
    { label: "Today", value: stats.todayExecutions },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Usage: {usageLabel}</p>
        {canManage ? (
          <Link href="/automation/new">
            <Button>Create automation</Button>
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={cn(auroraSurface, "px-4 py-4")}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
          </div>
        ))}
        <div className={cn(auroraSurface, "px-4 py-4 sm:col-span-2 xl:col-span-3")}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Last execution</p>
          <p className="mt-2 text-sm text-foreground">
            {stats.lastExecutionAt
              ? new Date(stats.lastExecutionAt).toLocaleString()
              : "No executions yet"}
          </p>
        </div>
      </div>

      <section aria-label="Automation filters" className="grid gap-4 md:grid-cols-[1fr_220px]">
        <Input
          label="Search automations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, trigger, or description"
        />
        <Select
          id="automation-status-filter"
          label="Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as typeof statusFilter)
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "draft", label: "Draft" },
            { value: "disabled", label: "Disabled" },
          ]}
        />
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No automations yet"
          description="Create your first workflow with the visual builder or AI-assisted automation."
          action={
            canManage ? (
              <Link href="/automation/new">
                <Button>Create automation</Button>
              </Link>
            ) : undefined
          }
          secondaryAction={
            <Link href="/automation/integrations">
              <Button size="sm" variant="outline">
                View integrations
              </Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4">
          {filtered.map((automation) => (
            <li key={automation.id}>
              <InteractiveSurface className={cn(auroraSurface, "p-5")}>
                <LinkOverlay
                  href={`/automation/${automation.id}`}
                  ariaLabel={`Open automation ${automation.name}`}
                />
                <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-foreground">{automation.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          statusStyles[automation.status],
                        )}
                      >
                        {automation.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {WORKFLOW_TRIGGER_LABELS[automation.trigger.type]} · {automation.actions.length} action
                      {automation.actions.length === 1 ? "" : "s"}
                    </p>
                    {automation.description ? (
                      <p className="mt-2 text-sm text-foreground">{automation.description}</p>
                    ) : null}
                  </div>
                  {canManage ? (
                    <div className={cn(rowInteractiveClass, "flex flex-wrap gap-2")} data-row-interactive>
                      {automation.status !== "active" ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            void setWorkflowStatus(automation.id, "active");
                          }}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void setWorkflowStatus(automation.id, "disabled");
                          }}
                        >
                          Disable
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void deleteWorkflow(automation.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              </InteractiveSurface>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 ? (
        <section aria-label="Suggested automations" className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">AI suggestions</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className={cn(auroraSurface, "p-4")}>
                <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                <p className="mt-1 text-xs text-muted">{suggestion.description}</p>
                {canManage ? (
                  <Link
                    href={`/automation/new?suggestion=${encodeURIComponent(suggestion.suggestedPrompt)}`}
                    className={cn(linkText, "mt-3 inline-block text-xs")}
                  >
                    Build with AI
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
