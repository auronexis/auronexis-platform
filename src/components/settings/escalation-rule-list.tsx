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
import { ESCALATION_TRIGGER_LABELS } from "@/lib/escalation/types";
import { linkText } from "@/lib/ui/tokens";
import type { EscalationRule } from "@/types/database";
import { cn } from "@/lib/utils/cn";

type EscalationRuleListProps = {
  rules: EscalationRule[];
  canManage: boolean;
};

export function EscalationRuleList({ rules, canManage }: EscalationRuleListProps) {
  if (rules.length === 0) {
    return (
      <AuroraTableEmpty
        title="No escalation rules configured"
        description="Configure automated reactions to SLA breaches and critical operational events."
        action={
          canManage ? (
            <Link
              href="/settings/escalation/new"
              className={cn(linkText, "text-sm font-medium")}
            >
              Create escalation rule
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
            <AuroraTableHeaderCell>Rule</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Trigger</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Delay</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {rules.map((rule) => (
            <ClickableRow
              key={rule.id}
              href={`/settings/escalation/${rule.id}`}
              ariaLabel={`Open escalation rule ${rule.name}`}
            >
              <AuroraTableCell>
                <span className="font-semibold text-foreground">{rule.name}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {ESCALATION_TRIGGER_LABELS[
                  rule.trigger_type as keyof typeof ESCALATION_TRIGGER_LABELS
                ] ?? rule.trigger_type}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {rule.delay_minutes > 0 ? `${rule.delay_minutes}m` : "Immediate"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                {rule.enabled ? (
                  <span className="inline-flex rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-border bg-muted/10 px-2.5 py-0.5 text-xs font-semibold text-muted">
                    Disabled
                  </span>
                )}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
