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
import type { ClientView } from "@/lib/clients/types";
import { formatClientDate, formatClientRevenue } from "@/lib/clients/types";

type ClientListProps = {
  clients: ClientView[];
  showRevenue: boolean;
};

export function ClientList({ clients, showRevenue }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <AuroraTableEmpty
        title="Waiting for your first client"
        description="Add an agency customer to start monitoring operational health across your portfolio."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Contact</AuroraTableHeaderCell>
            {showRevenue ? <AuroraTableHeaderCell>Monthly revenue</AuroraTableHeaderCell> : null}
            <AuroraTableHeaderCell>Updated</AuroraTableHeaderCell>
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
              <AuroraTableCell>
                {client.contact_name ? (
                  <div>
                    <p>{client.contact_name}</p>
                    {client.contact_email ? (
                      <p className="text-xs text-muted">{client.contact_email}</p>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </AuroraTableCell>
              {showRevenue ? (
                <AuroraTableCell className="whitespace-nowrap text-muted">
                  {formatClientRevenue(client.monthly_revenue)}
                </AuroraTableCell>
              ) : null}
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatClientDate(client.updated_at)}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
