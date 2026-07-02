import Link from "next/link";
import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { PortalIncidentView } from "@/lib/client-portal/types";
import { formatReportDate } from "@/lib/reports/types";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

type PortalIncidentCardProps = {
  incident: PortalIncidentView;
};

export function PortalIncidentCard({ incident }: PortalIncidentCardProps) {
  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/client-portal/incidents/${incident.id}`}
            className="text-base font-semibold text-primary hover:underline"
          >
            {incident.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RiskSeverityBadge severity={incident.severity as IncidentSeverity} />
            <IncidentStatusBadge status={incident.status as IncidentStatus} />
          </div>
        </div>
        <p className="text-xs text-muted">Detected {formatReportDate(incident.detectedAt)}</p>
      </div>
      {incident.clientSummary ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{incident.clientSummary}</p>
      ) : null}
    </PortalCard>
  );
}
