import Link from "next/link";
import type { AdoptionSnapshot, DashboardGuidanceMode } from "@/lib/adoption/types";
import { AdoptionStageBadge } from "@/components/adoption/adoption-stage-badge";
import { AdoptionTrendBadge } from "@/components/adoption/adoption-trend-badge";
import { AdoptionRiskBadge } from "@/components/adoption/adoption-risk-badge";
import { AdoptionRecommendations } from "@/components/adoption/adoption-recommendations";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import { AlertTriangle, HeartPulse } from "lucide-react";
import { Icon } from "@/components/ui/icon";

type AdoptionSummaryPanelProps = {
  adoption: AdoptionSnapshot;
  mode: DashboardGuidanceMode;
};

export function AdoptionSummaryPanel({ adoption, mode }: AdoptionSummaryPanelProps) {
  if (mode === "activation_primary") {
    return null;
  }

  const topRecommendation = adoption.recommendations[0] ?? null;
  const isRisk = mode === "adoption_risk";
  const isMature = mode === "adoption_mature";

  return (
    <DashboardPanel
      title={isRisk ? "Retention guidance" : isMature ? "Workspace maturity" : "Adoption summary"}
      description={
        isRisk
          ? "Usage signals suggest re-engagement may be needed."
          : isMature
            ? "Broad adoption with consistent recurring value."
            : "Recurring usage and feature adoption across your workspace."
      }
      action={
        <Link href="/adoption" className={cn(linkText, "text-xs")}>
          View adoption
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {isRisk ? (
            <Icon icon={AlertTriangle} size="sm" className="text-danger" aria-hidden />
          ) : (
            <Icon icon={HeartPulse} size="sm" className="text-primary" aria-hidden />
          )}
          <AdoptionStageBadge stage={adoption.stage} />
          <AdoptionTrendBadge trend={adoption.trend} />
          <AdoptionRiskBadge level={adoption.riskLevel} />
          <span
            className="text-sm font-semibold text-foreground"
            aria-label={`Adoption score ${adoption.score}`}
          >
            {adoption.score}/100
          </span>
        </div>

        {isRisk && adoption.riskReasons[0] ? (
          <p className="text-sm text-muted">{adoption.riskReasons[0].description}</p>
        ) : null}

        {topRecommendation ? (
          <AdoptionRecommendations
            recommendations={[topRecommendation]}
            snapshot={adoption}
            compact
          />
        ) : (
          <p className="text-sm text-muted">No immediate adoption actions recommended.</p>
        )}
      </div>
    </DashboardPanel>
  );
}
