import { IncidentBadge } from "@/components/incidents/incident-badge";
import { SlaStatusBadge } from "@/components/sla/sla-status-badge";
import { ClickableRow } from "@/components/ui/clickable-row";
import { RowInteractiveLink } from "@/components/ui/interactive-surface";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { linkText } from "@/lib/ui/tokens";
import type { IncidentWithRelations } from "@/lib/incidents/types";
import { formatIncidentDate } from "@/lib/incidents/types";
import { formatSlaDueDate } from "@/lib/sla/calculations";
import type { EntitySlaInfo } from "@/lib/sla/types";
import { ShieldAlert } from "lucide-react";

type IncidentListItem = IncidentWithRelations & { sla: EntitySlaInfo };

type IncidentListProps = {
  incidents: IncidentListItem[];
};

export function IncidentList({ incidents }: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No open incidents"
        description="Operational failures will surface here for triage. Everything looks healthy until something needs response."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Incident</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Severity</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Assigned</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>SLA status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>SLA due</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Updated</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {incidents.map((incident) => (
            <ClickableRow
              key={incident.id}
              href={`/incidents/${incident.id}`}
              ariaLabel={`Open incident ${incident.title}`}
            >
              <AuroraTableCell>
                <span className="font-semibold text-foreground">{incident.title}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {incident.clients?.name ? (
                  <RowInteractiveLink href={`/clients/${incident.client_id}`} className={linkText}>
                    {incident.clients.name}
                  </RowInteractiveLink>
                ) : (
                  "—"
                )}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <IncidentBadge kind="severity" value={incident.severity} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <IncidentBadge kind="status" value={incident.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {incident.users?.full_name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <SlaStatusBadge status={incident.sla.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatSlaDueDate(incident.sla.slaDueAt)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatIncidentDate(incident.updated_at)}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
