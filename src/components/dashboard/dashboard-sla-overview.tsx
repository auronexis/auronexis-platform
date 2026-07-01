import Link from "next/link";
import { SlaStatusBadge } from "@/components/sla/sla-status-badge";
import { SLAMetrics } from "@/components/sla/sla-metrics";
import { SLAComplianceChart } from "@/components/sla/sla-compliance-chart";
import { formatSlaDueDate } from "@/lib/sla/calculations";
import type { SlaDashboardMetrics } from "@/lib/sla/types";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DashboardSlaOverviewProps = {
  metrics: SlaDashboardMetrics;
};

function SlaCountCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "green" | "amber" | "red" | "slate";
}) {
  const toneStyles = {
    green: "border-success/20 bg-success/10 text-success",
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

function SlaAlertList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: SlaDashboardMetrics["upcomingBreaches"];
  emptyMessage: string;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h4>
      {items.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-5 text-center">
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {items.map((item) => (
            <li
              key={`${item.entityType}-${item.id}`}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <Link
                  href={item.href}
                  className={cn(linkText, "font-semibold no-underline hover:underline")}
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {item.clientName ?? "Unassigned client"} · Due {formatSlaDueDate(item.dueAt)}
                </p>
              </div>
              <SlaStatusBadge status={item.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DashboardSlaOverview({ metrics }: DashboardSlaOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">SLA command center KPIs</p>
        <Link href="/settings/sla" className={linkText}>
          Manage SLA policies
        </Link>
      </div>

      <SLAMetrics metrics={metrics} />

      <SLAComplianceChart points={metrics.monthlyTrend} />

      <div className="grid gap-3 sm:grid-cols-3">
        <SlaCountCard label="On track" count={metrics.onTrackCount} tone="green" />
        <SlaCountCard label="Warning" count={metrics.warningCount} tone="amber" />
        <SlaCountCard label="Currently breached" count={metrics.breachedCount} tone="red" />
      </div>

      <SlaAlertList
        title="Upcoming SLA breaches"
        items={metrics.upcomingBreaches}
        emptyMessage="No upcoming SLA breaches — response targets look healthy."
      />
      <SlaAlertList
        title="Currently breached"
        items={metrics.breachedItems}
        emptyMessage="No active SLA breaches — your team is meeting response targets."
      />
    </div>
  );
}
