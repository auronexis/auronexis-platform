"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperationalTaskItem } from "@/lib/ai/operational/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

const priorityStyles: Record<OperationalTaskItem["priority"], string> = {
  critical: "border-danger/30 bg-danger/5 text-danger",
  high: "border-warning/30 bg-warning/5 text-warning",
  medium: "border-primary/20 bg-primary/5 text-primary",
};

type OperationalTasksCardProps = {
  tasks: OperationalTaskItem[];
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function OperationalTasksCard({
  tasks,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: OperationalTasksCardProps) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">AI Operational Tasks</p>
            <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
            {requiredPlanLabel ? (
              <p className="mt-1 text-xs font-medium text-foreground">
                {requiredPlanLabel} plan required
              </p>
            ) : null}
            <Link href="/settings/plans">
              <Button type="button" variant="primary" size="sm" className="mt-4">
                View plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/5 px-4 py-6 text-sm text-muted">
        No outstanding operational tasks detected.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="rounded-xl border border-border bg-surface/80 px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Link href={task.href} className={cn(linkText, "text-sm font-medium")}>
              {task.message}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                priorityStyles[task.priority],
              )}
            >
              {task.priority}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
