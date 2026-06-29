import { ClientHealthScore } from "@/components/clients/client-health-score";
import { ClientRowActions } from "@/components/clients/client-row-actions";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ClickableRow } from "@/components/ui/clickable-row";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import type { ClientWithRelations } from "@/lib/clients/types";
import { formatClientDate } from "@/lib/clients/types";

type ClientListProps = {
  clients: ClientWithRelations[];
  canManage: boolean;
};

export function ClientList({ clients, canManage }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <AuroraTableEmpty
        title="No clients yet"
        description="Add a client to start monitoring operational health across your portfolio."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Name</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Health</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Owner</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Created</AuroraTableHeaderCell>
            {canManage ? <AuroraTableHeaderCell>Actions</AuroraTableHeaderCell> : null}
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {clients.map((client) => (
            <ClickableRow
              key={client.id}
              href={`/clients/${client.id}`}
              ariaLabel={`Open client ${client.name}`}
            >
              <AuroraTableCell className="whitespace-nowrap">
                <span className="font-semibold text-foreground">{client.name}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <ClientStatusBadge status={client.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <ClientHealthScore score={client.health_score} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {client.owner?.full_name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatClientDate(client.created_at)}
              </AuroraTableCell>
              {canManage ? (
                <AuroraTableCell className="whitespace-nowrap">
                  <ClientRowActions
                    clientId={client.id}
                    clientName={client.name}
                    canManage={canManage}
                    isArchived={client.status === "archived"}
                  />
                </AuroraTableCell>
              ) : null}
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
