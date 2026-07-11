import Link from "next/link";
import type { CustomerSuccessPortfolio } from "@/lib/customer-success/types";
import { ClientHealthBadge } from "@/components/customer-success/client-health-badge";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type CustomerSuccessHubProps = {
  portfolio: CustomerSuccessPortfolio;
};

export function CustomerSuccessHub({ portfolio }: CustomerSuccessHubProps) {
  return (
    <div className="space-y-8">
      <header>
        <SectionTitle>Customer Success Operations</SectionTitle>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Identify accounts needing attention, run repeatable playbooks, and track whether clients recover.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Active clients" value={portfolio.totalActiveClients} />
        <MetricCard label="Healthy" value={portfolio.healthyCount} tone="success" />
        <MetricCard label="At risk / critical" value={portfolio.atRiskCount + portfolio.criticalCount} tone="danger" />
        <MetricCard label="Overdue tasks" value={portfolio.overdueTaskCount} tone="warning" />
      </div>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Portfolio priority queue</h2>
        {portfolio.priorityQueue.length === 0 ? (
          <p className="text-sm text-muted">No active clients require immediate success intervention.</p>
        ) : (
          <ul className="space-y-3">
            {portfolio.priorityQueue.slice(0, 20).map((entry) => (
              <li
                key={entry.clientId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/clients/${entry.clientId}/success`}
                    className={cn(linkText, "text-sm font-semibold")}
                  >
                    {entry.clientName}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <ClientHealthBadge status={entry.healthStatus} score={entry.healthScore} />
                    {entry.overdueTaskCount > 0 ? (
                      <span className="text-xs text-danger">{entry.overdueTaskCount} overdue</span>
                    ) : null}
                  </div>
                  {entry.primaryRiskReason ? (
                    <p className="mt-1 text-xs text-muted">{entry.primaryRiskReason}</p>
                  ) : null}
                </div>
                <Link
                  href={`/clients/${entry.clientId}/success`}
                  className="text-xs font-semibold text-primary"
                >
                  Open workspace →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Playbook workload</h2>
        {portfolio.activePlaybooks.length === 0 ? (
          <p className="text-sm text-muted">No active playbooks.</p>
        ) : (
          <ul className="space-y-2">
            {portfolio.activePlaybooks.map((pb) => (
              <li key={pb.instanceId} className="rounded-lg border border-border/70 px-3 py-2.5 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium text-foreground">{pb.playbookName}</span>
                  <span className="text-xs text-muted">{pb.clientName}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {pb.completedTaskCount}/{pb.taskCount} tasks
                  {pb.isOverdue ? " · Overdue" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Success metrics</h2>
        {portfolio.metrics.hasEnoughData ? (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricItem label="Playbooks started" value={portfolio.metrics.playbooksStarted} />
            <MetricItem label="Playbooks completed" value={portfolio.metrics.playbooksCompleted} />
            <MetricItem
              label="Recovery rate"
              value={
                portfolio.metrics.recoveryRatePercent !== null
                  ? `${portfolio.metrics.recoveryRatePercent}%`
                  : "Insufficient data"
              }
            />
            <MetricItem label="Clients recovered" value={portfolio.metrics.clientsRecovered} />
            <MetricItem
              label="Avg completion (days)"
              value={
                portfolio.metrics.averageCompletionDays !== null
                  ? String(portfolio.metrics.averageCompletionDays)
                  : "Insufficient data"
              }
            />
          </dl>
        ) : (
          <p className="text-sm text-muted">Insufficient data — start a playbook to begin tracking metrics.</p>
        )}
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "warning";
}) {
  return (
    <Card padding="md">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
          !tone && "text-foreground",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function MetricItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
    </div>
  );
}
