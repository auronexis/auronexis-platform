import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import type { IntegrationRuntimeDashboardSummary } from "@/lib/integrations/types";

type IntegrationRuntimeHubCardProps = {
  summary: IntegrationRuntimeDashboardSummary;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function IntegrationRuntimeHubCard({
  summary,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: IntegrationRuntimeHubCardProps) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <p className="text-sm font-semibold text-foreground">Integration Runtime</p>
        <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
        {requiredPlanLabel ? (
          <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
        ) : null}
      </div>
    );
  }

  const items = [
    { label: "Running", value: summary.running },
    { label: "Failed", value: summary.failed },
    { label: "Retrying", value: summary.retrying },
    { label: "Delivered today", value: summary.deliveredToday },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Activity className="h-4 w-4" aria-hidden="true" />
        <span>
          Avg latency:{" "}
          <span className="font-medium text-foreground">
            {summary.averageLatencyMs != null ? `${summary.averageLatencyMs}ms` : "—"}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      <Link
        href="/automation/integrations/logs"
        className={cn(linkText, "inline-flex text-sm")}
      >
        View runtime logs
      </Link>
    </div>
  );
}
