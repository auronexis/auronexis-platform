import Link from "next/link";
import type { CustomerSuccessPortfolio } from "@/lib/customer-success/types";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ClientHealthBadge } from "@/components/customer-success/client-health-badge";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import { ClipboardCheck } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type CustomerSuccessSummaryPanelProps = {
  portfolio: CustomerSuccessPortfolio;
  mode: "critical" | "summary";
};

export function CustomerSuccessSummaryPanel({
  portfolio,
  mode,
}: CustomerSuccessSummaryPanelProps) {
  const top = portfolio.priorityQueue[0] ?? null;

  return (
    <DashboardPanel
      title={mode === "critical" ? "Customer success alerts" : "Customer success"}
      description={
        mode === "critical"
          ? "Clients or tasks need immediate success intervention."
          : "Active playbooks and portfolio health summary."
      }
      action={
        <Link href="/customer-success" className={cn(linkText, "text-xs")}>
          View operations
        </Link>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Icon icon={ClipboardCheck} size="sm" className="text-primary" aria-hidden />
          <span className="text-sm text-muted">
            {portfolio.atRiskCount + portfolio.criticalCount} at-risk · {portfolio.overdueTaskCount}{" "}
            overdue · {portfolio.activePlaybookCount} active playbooks
          </span>
        </div>
        {top ? (
          <div className="rounded-lg border border-border/70 px-3 py-3">
            <Link href={`/clients/${top.clientId}/success`} className={cn(linkText, "text-sm font-semibold")}>
              {top.clientName}
            </Link>
            <div className="mt-1">
              <ClientHealthBadge status={top.healthStatus} score={top.healthScore} />
            </div>
            {top.primaryRiskReason ? (
              <p className="mt-2 text-xs text-muted">{top.primaryRiskReason}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted">No priority clients in the success queue.</p>
        )}
      </div>
    </DashboardPanel>
  );
}
