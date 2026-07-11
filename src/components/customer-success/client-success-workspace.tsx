"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { ClientSuccessSnapshot } from "@/lib/customer-success/types";
import { ClientHealthBadge } from "@/components/customer-success/client-health-badge";
import { startPlaybookAction, completeTaskAction } from "@/lib/customer-success/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ClientSuccessWorkspaceProps = {
  snapshot: ClientSuccessSnapshot;
  canManage: boolean;
  canComplete: boolean;
};

export function ClientSuccessWorkspace({
  snapshot,
  canManage,
  canComplete,
}: ClientSuccessWorkspaceProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStartPlaybook(playbookKey: string) {
    setError(null);
    startTransition(async () => {
      const result = await startPlaybookAction({
        clientId: snapshot.clientId,
        playbookKey,
      });
      if (!result.success) setError(result.error);
    });
  }

  function handleCompleteTask(taskId: string) {
    setError(null);
    startTransition(async () => {
      const result = await completeTaskAction(taskId);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <ClientHealthBadge status={snapshot.healthStatus} score={snapshot.healthScore} />
        <span className="text-sm text-muted capitalize">Trend: {snapshot.trend.replace("_", " ")}</span>
        <span className="text-sm text-muted capitalize">Recovery: {snapshot.recoveryStatus.replace("_", " ")}</span>
      </div>

      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Health breakdown</h2>
        <dl className="grid gap-2 sm:grid-cols-2">
          {(
            Object.entries(snapshot.healthBreakdown) as [string, number][]
          )
            .filter(([k]) => k !== "total")
            .map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs capitalize text-muted">{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd className="text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
        </dl>
      </Card>

      {snapshot.suggestedPlaybooks.length > 0 ? (
        <Card padding="lg" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Suggested playbooks</h2>
          <ul className="space-y-2">
            {snapshot.suggestedPlaybooks.map((pb) => (
              <li key={pb.key} className="rounded-lg border border-border/70 px-3 py-3">
                <p className="text-sm font-medium text-foreground">{pb.name}</p>
                <p className="mt-1 text-xs text-muted">{pb.reason}</p>
                {canManage && pb.available && pb.permitted ? (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    disabled={pending}
                    onClick={() => handleStartPlaybook(pb.key)}
                  >
                    Start playbook
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {snapshot.activePlaybooks.length > 0 ? (
        <Card padding="lg" className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Active playbooks</h2>
          <ul className="space-y-2">
            {snapshot.activePlaybooks.map((pb) => (
              <li key={pb.id} className="text-sm text-foreground">
                {pb.name} — {pb.completedTaskCount}/{pb.taskCount} tasks
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card padding="lg" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
        {snapshot.tasks.length === 0 ? (
          <p className="text-sm text-muted">No success tasks yet.</p>
        ) : (
          <ul className="space-y-2">
            {snapshot.tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted capitalize">
                    {task.status}
                    {task.isOverdue ? " · overdue" : ""}
                  </p>
                </div>
                {canComplete && task.status !== "completed" && task.status !== "skipped" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => handleCompleteTask(task.id)}
                  >
                    Complete
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {snapshot.riskSignals.length > 0 ? (
        <Card padding="lg" className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Risk signals</h2>
          <ul className="space-y-2">
            {snapshot.riskSignals.map((s) => (
              <li key={s.code} className="text-sm text-muted">
                <span className="font-medium text-foreground">{s.label}: </span>
                {s.evidence}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Link href={`/clients/${snapshot.clientId}`} className={cn(linkText, "text-sm")}>
        ← Back to client profile
      </Link>
    </div>
  );
}
