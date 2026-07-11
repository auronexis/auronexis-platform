import Link from "next/link";
import type { ExecutiveIntelligenceSnapshot } from "@/lib/executive-intelligence/types";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import { Brain } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type ExecutiveIntelligenceSummaryPanelProps = {
  snapshot: ExecutiveIntelligenceSnapshot;
  mode: "critical" | "summary";
};

export function ExecutiveIntelligenceSummaryPanel({
  snapshot,
  mode,
}: ExecutiveIntelligenceSummaryPanelProps) {
  const topFinding = snapshot.topFindings[0] ?? null;

  return (
    <DashboardPanel
      title={mode === "critical" ? "Executive intelligence alerts" : "Executive intelligence"}
      description={
        mode === "critical"
          ? "Critical operational changes require leadership review."
          : "Period comparison and priority findings."
      }
      action={
        <Link href="/intelligence" className={cn(linkText, "text-xs")}>
          View intelligence
        </Link>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Icon icon={Brain} size="sm" className="text-primary" aria-hidden />
          <span className="text-sm text-muted">
            {snapshot.priorityClients.length} priority clients · {snapshot.criticalChanges.length} critical changes
          </span>
        </div>
        {topFinding ? (
          <div className="rounded-lg border border-border/70 px-3 py-3">
            <p className="text-xs font-semibold uppercase text-danger">{topFinding.severity}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{topFinding.title}</p>
            <p className="mt-1 text-xs text-muted">{topFinding.summary}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">No priority findings in the current period.</p>
        )}
      </div>
    </DashboardPanel>
  );
}
