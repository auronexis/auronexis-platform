import Link from "next/link";
import type { RiskSummary } from "@/lib/risks/types";
import { linkText } from "@/lib/ui/tokens";

type DashboardRisksOverviewProps = {
  summary: RiskSummary;
};

export function DashboardRisksOverview({ summary }: DashboardRisksOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Open risks</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.openCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Critical</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.criticalCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">High severity</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.highCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Due within 7 days</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.dueSoonCount}</p>
        </div>
      </div>
      <Link href="/risks" className={linkText}>
        View risk center →
      </Link>
    </div>
  );
}
