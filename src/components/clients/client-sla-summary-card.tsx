import Link from "next/link";
import { SLATimerList } from "@/components/sla/sla-timer";
import { DetailSection } from "@/components/layout/detail-page";
import type { ClientSlaSummary } from "@/lib/sla/types";
import { formatSlaMinutes } from "@/lib/sla/summary";
import { linkText } from "@/lib/ui/tokens";

type ClientSlaSummaryCardProps = {
  summary: ClientSlaSummary;
};

export function ClientSlaSummaryCard({ summary }: ClientSlaSummaryCardProps) {
  return (
    <DetailSection
      title="SLA summary"
      description="Response commitments, compliance, and active timers for this client."
      action={
        <Link href="/settings/sla" className={linkText}>
          Manage policies
        </Link>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Policy</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.policyName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Compliance</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.compliancePercent}%</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Breaches</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.breachCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Avg response</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {formatSlaMinutes(summary.avgResponseMinutes)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Avg resolution</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {formatSlaMinutes(summary.avgResolutionMinutes)}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Active timers</h4>
        <div className="mt-3">
          <SLATimerList timers={summary.activeTimers} />
        </div>
      </div>
    </DetailSection>
  );
}
