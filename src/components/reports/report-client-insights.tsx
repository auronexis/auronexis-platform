import Link from "next/link";
import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import type {
  ClientReportMetrics,
  RelatedOpenIncident,
  RelatedOpenRisk,
} from "@/lib/reports/types";
import { formatReportDate } from "@/lib/reports/types";
import { linkText } from "@/lib/ui/tokens";
import type { IncidentSeverity, IncidentStatus, RiskSeverity, RiskStatus } from "@/types/database";

type ReportClientInsightsProps = {
  metrics: ClientReportMetrics;
  relatedRisks: RelatedOpenRisk[];
  relatedIncidents: RelatedOpenIncident[];
};

export function ReportClientInsights({
  metrics,
  relatedRisks,
  relatedIncidents,
}: ReportClientInsightsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Client risk & incident metrics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Open risks", metrics.openRisksCount],
            ["Critical risks", metrics.criticalRisksCount],
            ["Open incidents", metrics.openIncidentsCount],
            ["Critical incidents", metrics.criticalIncidentsCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-muted/5 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                {label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground">Related open risks</h2>
        {relatedRisks.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No open risks for this client.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {relatedRisks.map((risk) => (
              <li
                key={risk.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-4 py-3"
              >
                <Link href={`/risks/${risk.id}`} className={linkText}>
                  {risk.title}
                </Link>
                <RiskSeverityBadge severity={risk.severity as RiskSeverity} />
                <RiskStatusBadge status={risk.status as RiskStatus} />
                {risk.due_date ? (
                  <span className="text-sm text-muted">
                    Due {formatReportDate(risk.due_date)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground">Related open incidents</h2>
        {relatedIncidents.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No open incidents for this client.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {relatedIncidents.map((incident) => (
              <li
                key={incident.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-4 py-3"
              >
                <Link href={`/incidents/${incident.id}`} className={linkText}>
                  {incident.title}
                </Link>
                <RiskSeverityBadge severity={incident.severity as IncidentSeverity} />
                <IncidentStatusBadge status={incident.status as IncidentStatus} />
                {incident.due_at ? (
                  <span className="text-sm text-muted">
                    Due {formatReportDate(incident.due_at)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
