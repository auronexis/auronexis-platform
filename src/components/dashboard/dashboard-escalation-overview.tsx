"use client";

import Link from "next/link";
import { EscalationStatusBadge } from "@/components/escalation/escalation-status-badge";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { ESCALATION_TRIGGER_LABELS } from "@/lib/escalation/types";
import type { EscalationDashboardMetrics } from "@/lib/escalation/types";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DashboardEscalationOverviewProps = {
  metrics: EscalationDashboardMetrics;
};

function EscalationCountCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "violet" | "amber" | "red" | "slate";
}) {
  const toneStyles = {
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-600",
    amber: "border-warning/20 bg-warning/10 text-warning",
    red: "border-danger/20 bg-danger/10 text-danger",
    slate: "border-border bg-muted/10 text-muted",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneStyles[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{count}</p>
    </div>
  );
}

export function DashboardEscalationOverview({ metrics }: DashboardEscalationOverviewProps) {
  const { formatDateTime } = useWorkspaceMoney();

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <EscalationCountCard
          label="Active rules"
          count={metrics.activeRulesCount}
          tone="violet"
        />
        <EscalationCountCard
          label="Escalations today"
          count={metrics.escalationsTodayCount}
          tone="amber"
        />
        <EscalationCountCard
          label="Outstanding"
          count={metrics.outstandingCount}
          tone="red"
        />
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Recent escalations
        </h4>
        {metrics.recentEscalations.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-5 text-center">
            <p className="text-sm text-muted">No recent escalations — automation is quiet.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border/70">
            {metrics.recentEscalations.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className={cn(linkText, "font-semibold no-underline hover:underline")}
                  >
                    {item.entityTitle}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {ESCALATION_TRIGGER_LABELS[item.triggerType]} ·{" "}
                    {item.clientName ?? "Unassigned client"} · {formatDateTime(item.executedAt)}
                  </p>
                </div>
                <EscalationStatusBadge
                  status={item.status === "acknowledged" ? "acknowledged" : "escalated"}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
