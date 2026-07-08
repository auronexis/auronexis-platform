import Link from "next/link";
import { Users } from "lucide-react";
import { ClientHealthBadge } from "@/components/health/client-health-badge";
import { ClientRowActions } from "@/components/clients/client-row-actions";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ClickableRow } from "@/components/ui/clickable-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import type { ClientWithRelations } from "@/lib/clients/types";
import type { ClientHealthSummary } from "@/lib/health/types";
import { formatClientDate } from "@/lib/clients/types";

type ClientListProps = {
  clients: ClientWithRelations[];
  canManage: boolean;
  healthSummaries?: Map<string, ClientHealthSummary>;
};

export function ClientList({ clients, canManage, healthSummaries }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Add a client to start monitoring operational health across your portfolio."
        action={
          canManage ? (
            <Link href="/clients/new">
              <Button size="sm">Add client</Button>
            </Link>
          ) : undefined
        }
        secondaryAction={
          <Link href="/dashboard">
            <Button size="sm" variant="outline">
              Back to dashboard
            </Button>
          </Link>
        }
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
                <ClientHealthBadge summary={healthSummaries?.get(client.id)} />
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
