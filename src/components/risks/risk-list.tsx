import { RiskScoreBadge } from "@/components/risks/risk-score-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
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
import type { ClientRiskView } from "@/lib/risks/types";
import { formatRiskDate, RISK_SOURCE_LABELS } from "@/lib/risks/types";
import { linkText } from "@/lib/ui/tokens";

type RiskListProps = {
  risks: ClientRiskView[];
};

export function RiskList({ risks }: RiskListProps) {
  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Risk</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Score</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Severity</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Category</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Owner</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Due</AuroraTableHeaderCell>
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
                <p className="mt-0.5 text-xs text-muted">{RISK_SOURCE_LABELS[risk.source]}</p>
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
                <RiskScoreBadge score={risk.risk_score} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <RiskSeverityBadge severity={risk.severity} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <RiskStatusBadge status={risk.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {risk.category ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {risk.users?.full_name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {risk.due_at ? formatRiskDate(risk.due_at) : "—"}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
