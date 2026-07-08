import Link from "next/link";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { PortfolioHealthDistribution } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type PortfolioHealthDistributionPanelProps = {
  distribution: PortfolioHealthDistribution;
};

const bands = [
  { key: "healthy" as const, label: "Healthy", tone: "bg-success" },
  { key: "watch" as const, label: "Watch", tone: "bg-warning" },
  { key: "risk" as const, label: "Risk", tone: "bg-orange-500" },
  { key: "critical" as const, label: "Critical", tone: "bg-danger" },
];

export function PortfolioHealthDistributionPanel({
  distribution,
}: PortfolioHealthDistributionPanelProps) {
  if (distribution.total === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No portfolio health data yet"
        description="Health distribution appears once clients are tracked in your workspace."
        action={
          <Link
            href="/clients/new"
            className={cn(
              "inline-flex h-8 items-center rounded-md border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs",
              transitionInteractive,
              focusRing,
            )}
          >
            Add client
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {bands.map((band) => {
          const value = distribution[band.key];
          const percent = Math.round((value / Math.max(1, distribution.total)) * 100);

          return (
            <div key={band.key} className="rounded-xl border border-border/70 bg-surface/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", band.tone)} aria-hidden />
                  <span className="text-sm font-medium text-foreground">{band.label}</span>
                </div>
                <span className="text-lg font-semibold text-foreground">{value}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/20">
                <div
                  className={cn("h-full rounded-full transition-all", band.tone)}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">{percent}% of portfolio</p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        Tracking {distribution.total} client{distribution.total === 1 ? "" : "s"} across portfolio health bands.
      </p>
    </div>
  );
}
