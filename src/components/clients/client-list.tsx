import { Users } from "lucide-react";
import { ClientHealthBadge } from "@/components/health/client-health-badge";
import { ClientRowActions } from "@/components/clients/client-row-actions";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { ClickableRow } from "@/components/ui/clickable-row";
import { LinkButton } from "@/components/ui/link-button";
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
import { ACTIVATION_EMPTY_STATE_COPY, ACTIVATION_EMPTY_STATE_LINKS } from "@/lib/activation/empty-states";

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
        title={ACTIVATION_EMPTY_STATE_COPY.clients.title}
        description={ACTIVATION_EMPTY_STATE_COPY.clients.description}
        action={canManage ? <LinkButton href={ACTIVATION_EMPTY_STATE_LINKS.clients.href} size="sm">{ACTIVATION_EMPTY_STATE_LINKS.clients.label}</LinkButton> : undefined}
        secondaryAction={
          <LinkButton href={ACTIVATION_EMPTY_STATE_LINKS.onboarding.href} size="sm" variant="outline">
            {ACTIVATION_EMPTY_STATE_LINKS.onboarding.label}
          </LinkButton>
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
