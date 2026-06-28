import Link from "next/link";
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
import { linkText } from "@/lib/ui/tokens";
import type { SlaPolicy } from "@/types/database";
import { cn } from "@/lib/utils/cn";

type SlaPolicyListProps = {
  policies: SlaPolicy[];
  canManage: boolean;
};

function formatHours(hours: number | null): string {
  if (!hours) {
    return "—";
  }

  return `${hours}h`;
}

export function SlaPolicyList({ policies, canManage }: SlaPolicyListProps) {
  if (policies.length === 0) {
    return (
      <AuroraTableEmpty
        title="No SLA policies defined"
        description="Define response-time targets for incidents and risks across your clients."
        action={
          canManage ? (
            <Link href="/settings/sla/new" className={cn(linkText, "text-sm font-medium")}>
              Create SLA policy
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Policy</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Incidents</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Risks</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Default</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {policies.map((policy) => (
            <ClickableRow
              key={policy.id}
              href={`/settings/sla/${policy.id}`}
              ariaLabel={`Open SLA policy ${policy.name}`}
            >
              <AuroraTableCell>
                <span className="font-semibold text-foreground">{policy.name}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatHours(policy.incident_hours)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatHours(policy.risk_hours)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                {policy.is_default ? (
                  <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                    Default
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
