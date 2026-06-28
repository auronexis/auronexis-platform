import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
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
import type { RiskWithRelations } from "@/lib/risks/types";
import { formatRiskDate } from "@/lib/risks/types";
import { formatSlaDueDate } from "@/lib/sla/calculations";
import type { EntitySlaInfo } from "@/lib/sla/types";
import { AlertTriangle } from "lucide-react";

type RiskListItem = RiskWithRelations & { sla: EntitySlaInfo };

type RiskListProps = {
  risks: RiskListItem[];
};

export function RiskList({ risks }: RiskListProps) {
  if (risks.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Everything looks clear"
        description="No operational threats are being tracked. Add a risk when you identify something that needs attention."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Risk</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Severity</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Owner</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>SLA status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>SLA due</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Updated</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {risks.map((risk) => (
            <ClickableRow
              key={risk.id}
              href={`/risks/${risk.id}`}
              ariaLabel={`Open risk ${risk.title}`}
            >
              <AuroraTableCell>
                <span className="font-semibold text-foreground">{risk.title}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {risk.clients?.name ? (
                  <RowInteractiveLink href={`/clients/${risk.client_id}`} className={linkText}>
                    {risk.clients.name}
                  </RowInteractiveLink>
                ) : (
                  "—"
                )}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <RiskSeverityBadge severity={risk.severity} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <RiskStatusBadge status={risk.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {risk.users?.full_name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <SlaStatusBadge status={risk.sla.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatSlaDueDate(risk.sla.slaDueAt)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatRiskDate(risk.updated_at)}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
