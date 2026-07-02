import Link from "next/link";
import { MonitoringEventList } from "@/components/monitoring/monitoring-event-list";
import { DetailSection } from "@/components/layout/detail-page";
import type { ClientMonitoringSummary } from "@/lib/monitoring/types";
import { linkText } from "@/lib/ui/tokens";

type ClientMonitoringSummaryCardProps = {
  summary: ClientMonitoringSummary;
};

export function ClientMonitoringSummaryCard({ summary }: ClientMonitoringSummaryCardProps) {
  return (
    <DetailSection
      title="Monitoring"
      description="Connected monitoring signals, recent events, and downstream impact."
      action={
        <Link href="/monitoring" className={linkText}>
          View connectors
        </Link>
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Connected</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.connectedCount}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Health impact</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.healthImpactEvents}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Open incidents</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.openIncidents}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Open risks</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">{summary.openRisks}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Recent events</h4>
        <div className="mt-3">
          <MonitoringEventList events={summary.recentEvents} />
        </div>
      </div>
    </DetailSection>
  );
}
