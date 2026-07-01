import Link from "next/link";
import { RiskScoreBadge } from "@/components/risks/risk-score-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import type { ClientRiskView } from "@/lib/risks/types";
import { RISK_SOURCE_LABELS, formatRiskDate } from "@/lib/risks/types";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type RiskCardProps = {
  risk: ClientRiskView;
  className?: string;
};

export function RiskCard({ risk, className }: RiskCardProps) {
  return (
    <Link
      href={`/risks/${risk.id}`}
      className={cn(
        "block rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{risk.title}</p>
          <p className="mt-1 text-sm text-muted">
            {risk.clients?.name ? (
              <span>{risk.clients.name}</span>
            ) : (
              "Unknown client"
            )}
          </p>
        </div>
        <RiskSeverityBadge severity={risk.severity} />
      </div>
      {risk.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted">{risk.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RiskScoreBadge score={risk.risk_score} />
        <RiskStatusBadge status={risk.status} />
        <span className="text-xs text-muted">{RISK_SOURCE_LABELS[risk.source]}</span>
        {risk.due_at ? (
          <span className="text-xs text-muted">Due {formatRiskDate(risk.due_at)}</span>
        ) : null}
      </div>
      {risk.recommendation ? (
        <p className={cn("mt-3 text-xs text-muted", linkText)}>View recommendation →</p>
      ) : null}
    </Link>
  );
}
