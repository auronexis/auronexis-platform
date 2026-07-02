import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { PortalIncidentDetailView } from "@/lib/client-portal/types";
import { formatReportDate } from "@/lib/reports/types";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

type PortalIncidentDetailProps = {
  incident: PortalIncidentDetailView;
};

export function PortalIncidentDetail({ incident }: PortalIncidentDetailProps) {
  return (
    <div className="space-y-6">
      <PortalCard>
        <div className="flex flex-wrap items-center gap-3">
          <RiskSeverityBadge severity={incident.severity as IncidentSeverity} />
          <IncidentStatusBadge status={incident.status as IncidentStatus} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">{incident.title}</h1>
        <p className="mt-2 text-sm text-muted">
          Detected {formatReportDate(incident.detectedAt)}
          {incident.resolvedAt ? ` · Resolved ${formatReportDate(incident.resolvedAt)}` : ""}
        </p>
      </PortalCard>

      <PortalCard>
        <h2 className="text-lg font-semibold text-foreground">Client summary</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {incident.clientSummary ?? "No client-facing summary has been shared for this incident yet."}
        </p>
      </PortalCard>

      {incident.resolutionSummary ? (
        <PortalCard>
          <h2 className="text-lg font-semibold text-foreground">Resolution summary</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {incident.resolutionSummary}
          </p>
        </PortalCard>
      ) : null}
    </div>
  );
}
