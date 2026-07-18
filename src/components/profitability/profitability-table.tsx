"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { ClientFinancialForm } from "@/components/profitability/client-financial-form";
import { ClientHealthBadge } from "@/components/profitability/client-health-badge";
import { ClickableRow } from "@/components/ui/clickable-row";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/empty-state";
import { rowInteractiveClass } from "@/components/ui/interactive-surface";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableHead,
  AuroraTableHeaderCell,
  AuroraTableRow,
} from "@/components/ui/table";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { linkText } from "@/lib/ui/tokens";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import { formatMargin } from "@/lib/profitability/types";
import { cn } from "@/lib/utils/cn";

type ProfitabilityTableProps = {
  rows: ClientProfitabilityRow[];
  canEdit: boolean;
};

export function ProfitabilityTable({ rows, canEdit }: ProfitabilityTableProps) {
  const { formatMoney } = useWorkspaceMoney();
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No profitability data yet"
        description="Add clients and enter revenue and cost figures to track margins and portfolio health."
        action={<LinkButton href="/clients/new" size="sm">Add client</LinkButton>}
        secondaryAction={
          <LinkButton href="/profitability" size="sm" variant="outline">
            View profitability
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
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Revenue</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Cost</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Profit</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Margin</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Health</AuroraTableHeaderCell>
            {canEdit ? <AuroraTableHeaderCell>Actions</AuroraTableHeaderCell> : null}
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {rows.flatMap((row) => {
            const tableRows = [
              <ClickableRow
                key={row.clientId}
                href={`/clients/${row.clientId}`}
                ariaLabel={`Open client ${row.clientName}`}
                selected={editingClientId === row.clientId}
              >
                <AuroraTableCell className="whitespace-nowrap">
                  <span className="font-semibold text-foreground">{row.clientName}</span>
                </AuroraTableCell>
                <AuroraTableCell className="whitespace-nowrap text-muted">
                  {formatMoney(row.monthlyRevenue)}
                </AuroraTableCell>
                <AuroraTableCell className="whitespace-nowrap text-muted">
                  {formatMoney(row.monthlyCost)}
                </AuroraTableCell>
                <AuroraTableCell className="whitespace-nowrap text-muted">
                  {formatMoney(row.profit)}
                </AuroraTableCell>
                <AuroraTableCell className="whitespace-nowrap text-muted">
                  {formatMargin(row.margin)}
                </AuroraTableCell>
                <AuroraTableCell className="whitespace-nowrap">
                  <ClientHealthBadge health={row.health} />
                </AuroraTableCell>
                {canEdit ? (
                  <AuroraTableCell className="whitespace-nowrap">
                    <button
                      type="button"
                      data-row-interactive
                      className={cn(rowInteractiveClass, linkText, "font-medium no-underline hover:underline")}
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingClientId((current) =>
                          current === row.clientId ? null : row.clientId,
                        );
                      }}
                    >
                      {editingClientId === row.clientId ? "Close" : "Edit"}
                    </button>
                  </AuroraTableCell>
                ) : null}
              </ClickableRow>,
            ];

            if (canEdit && editingClientId === row.clientId) {
              tableRows.push(
                <AuroraTableRow key={`${row.clientId}-edit`} interactive={false}>
                  <AuroraTableCell colSpan={7} className="bg-muted/5">
                    <ClientFinancialForm row={row} />
                  </AuroraTableCell>
                </AuroraTableRow>,
              );
            }

            return tableRows;
          })}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
