import type { ClientHealthCounts } from "@/lib/profitability/types";
import { cn } from "@/lib/utils/cn";
import { transitionInteractive } from "@/lib/ui/tokens";

type ClientHealthOverviewProps = {
  counts: ClientHealthCounts;
};

type HealthBarProps = {
  label: string;
  count: number;
  total: number;
  tone: "success" | "warning" | "danger";
};

const toneStyles = {
  success: {
    bar: "bg-success",
    text: "text-success",
    track: "bg-success/10",
  },
  warning: {
    bar: "bg-warning",
    text: "text-warning",
    track: "bg-warning/10",
  },
  danger: {
    bar: "bg-danger",
    text: "text-danger",
    track: "bg-danger/10",
  },
} as const;

function HealthBar({ label, count, total, tone }: HealthBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className={cn("text-sm font-medium", toneStyles[tone].text)}>{label}</span>
        <span className="text-sm font-semibold text-foreground">
          {count}
          <span className="ml-1 text-xs font-medium text-muted">({percentage}%)</span>
        </span>
      </div>
      <div className={cn("h-2.5 overflow-hidden rounded-full", toneStyles[tone].track)}>
        <div
          className={cn("h-full rounded-full", toneStyles[tone].bar, transitionInteractive)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} clients`}
        />
      </div>
    </div>
  );
}

export function ClientHealthOverview({ counts }: ClientHealthOverviewProps) {
  const total = counts.totalClients;

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No clients yet</p>
        <p className="mt-1 text-sm text-muted">
          Add your first client to start tracking operational health across your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{total}</p>
          <p className="mt-1 text-sm text-muted">Clients under management</p>
        </div>
      </div>

      <HealthBar label="Healthy" count={counts.healthyClients} total={total} tone="success" />
      <HealthBar label="Watch" count={counts.watchClients} total={total} tone="warning" />
      <HealthBar label="Critical" count={counts.criticalClients} total={total} tone="danger" />
    </div>
  );
}
