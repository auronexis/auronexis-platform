"use client";

import type { WorkflowAction, WorkflowDefinition } from "@/lib/automation/builder/types";
import {
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_TRIGGER_LABELS,
} from "@/lib/automation/builder/types";
import { cn } from "@/lib/utils/cn";
import { auroraSurface } from "@/lib/ui/aurora";

type WorkflowGraphProps = {
  workflow: WorkflowDefinition;
  className?: string;
};

function GraphNode({
  title,
  subtitle,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  tone?: "default" | "trigger" | "condition" | "action";
}) {
  const toneClass =
    tone === "trigger"
      ? "border-cyan-500/30 bg-cyan-500/5"
      : tone === "condition"
        ? "border-amber-500/30 bg-amber-500/5"
        : tone === "action"
          ? "border-violet-500/30 bg-violet-500/5"
          : "border-border bg-surface";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-left shadow-sm",
        toneClass,
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-muted">{subtitle}</p> : null}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-1" aria-hidden="true">
      <span className="text-muted">↓</span>
    </div>
  );
}

function renderActions(actions: WorkflowAction[]) {
  return actions.map((action) => (
    <div key={action.id}>
      <Connector />
      <GraphNode
        tone="action"
        title={action.label ?? WORKFLOW_ACTION_LABELS[action.type]}
        subtitle={action.requiresConfirmation ? "Requires confirmation" : undefined}
      />
    </div>
  ));
}

export function WorkflowGraph({ workflow, className }: WorkflowGraphProps) {
  return (
    <div
      className={cn(auroraSurface, "p-5", className)}
      aria-label="Workflow visual graph"
    >
      <GraphNode
        tone="trigger"
        title="Trigger"
        subtitle={WORKFLOW_TRIGGER_LABELS[workflow.trigger.type]}
      />

      {workflow.conditions ? (
        <>
          <Connector />
          <GraphNode
            tone="condition"
            title={`Conditions (${workflow.conditions.logic.toUpperCase()})`}
            subtitle={`${workflow.conditions.conditions.length} rule${workflow.conditions.conditions.length === 1 ? "" : "s"}`}
          />
        </>
      ) : null}

      {renderActions(workflow.actions)}
    </div>
  );
}
