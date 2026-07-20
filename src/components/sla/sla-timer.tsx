"use client";

import { cn } from "@/lib/utils/cn";
import type { SlaTimerView } from "@/lib/sla/types";
import { SLABreachBadge } from "@/components/sla/sla-breach-badge";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";

type SLATimerProps = {
  timer: SlaTimerView;
  className?: string;
};

export function SLATimer({ timer, className }: SLATimerProps) {
  const { formatDateTime } = useWorkspaceMoney();
  const isComplete = Boolean(timer.completedAt);

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-surface/40 px-4 py-3",
        timer.breached && !isComplete && "border-danger/30 bg-danger/5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{timer.label}</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {isComplete ? "Completed" : timer.remainingLabel ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted">Due {formatDateTime(timer.dueAt)}</p>
        </div>
        {timer.breached ? <SLABreachBadge /> : null}
      </div>
    </div>
  );
}

type SLATimerListProps = {
  timers: SlaTimerView[];
  emptyMessage?: string;
};

export function SLATimerList({ timers, emptyMessage = "No active SLA timers." }: SLATimerListProps) {
  if (timers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-5 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {timers.map((timer) => (
        <SLATimer key={timer.kind} timer={timer} />
      ))}
    </div>
  );
}
