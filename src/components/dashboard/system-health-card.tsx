import type { DashboardData } from "@/lib/dashboard/types";
import { computeHealthScore } from "@/lib/dashboard/display";
import { cn } from "@/lib/utils/cn";

type SystemHealthCardProps = {
  data: DashboardData;
};

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClass = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-foreground",
  }[tone];

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/5 px-3 py-2.5">
      <span className="text-sm text-muted">{label}</span>
      <span className={cn("text-sm font-semibold", toneClass)}>{value}</span>
    </div>
  );
}

export function SystemHealthCard({ data }: SystemHealthCardProps) {
  const healthScore = computeHealthScore(data.clientHealth);
  const scoreTone =
    healthScore >= 85 ? "success" : healthScore >= 65 ? "warning" : "danger";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/[0.05] to-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Portfolio health
        </p>
        <p className={cn("mt-2 text-4xl font-semibold tracking-tight", {
          "text-success": scoreTone === "success",
          "text-warning": scoreTone === "warning",
          "text-danger": scoreTone === "danger",
        })}>
          {healthScore}%
        </p>
        <p className="mt-1 text-sm text-muted">Composite score across active clients</p>
      </div>

      <div className="space-y-2">
        <StatusRow
          label="Critical clients"
          value={data.clientHealth.criticalClients}
          tone={data.clientHealth.criticalClients > 0 ? "danger" : "success"}
        />
        {data.features.sla ? (
          <>
            <StatusRow
              label="SLA breaches"
              value={data.slaMetrics.breachedCount}
              tone={data.slaMetrics.breachedCount > 0 ? "danger" : "success"}
            />
            <StatusRow
              label="SLA warnings"
              value={data.slaMetrics.warningCount}
              tone={data.slaMetrics.warningCount > 0 ? "warning" : "neutral"}
            />
          </>
        ) : null}
        {data.features.escalation ? (
          <StatusRow
            label="Outstanding escalations"
            value={data.escalationMetrics.outstandingCount}
            tone={data.escalationMetrics.outstandingCount > 0 ? "warning" : "success"}
          />
        ) : null}
      </div>
    </div>
  );
}
