import Link from "next/link";
import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import type { CriticalAlertItem } from "@/lib/dashboard/types";
import type { IncidentStatus, RiskStatus } from "@/types/database";

type DashboardCriticalAlertsProps = {
  alerts: CriticalAlertItem[];
};

const entityTypeStyles = {
  risk: "bg-amber-50 text-warning ring-amber-600/20",
  incident: "bg-red-50 text-critical ring-red-600/20",
} as const;

export function DashboardCriticalAlerts({ alerts }: DashboardCriticalAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-success/5 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No alerts detected</p>
        <p className="mt-1 text-sm text-muted">
          Your organization is operating normally. Critical risks and incidents will surface here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li
          key={`${alert.type}-${alert.id}`}
          className="rounded-xl border border-border/70 bg-muted/5 px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${entityTypeStyles[alert.type]}`}
            >
              {alert.type === "risk" ? "Risk" : "Incident"}
            </span>
            <Link href={alert.href} className="font-medium text-foreground hover:text-primary">
              {alert.title}
            </Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            {alert.clientName ?? "Unassigned client"}
            {alert.dueLabel ? ` · Due ${alert.dueLabel}` : null}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RiskSeverityBadge severity="critical" />
            {alert.type === "risk" ? (
              <RiskStatusBadge status={alert.status as RiskStatus} />
            ) : (
              <IncidentStatusBadge status={alert.status as IncidentStatus} />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
