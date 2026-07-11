import Link from "next/link";
import type { AdoptionSnapshot } from "@/lib/adoption/types";
import { getAdoptionStageGuidance } from "@/lib/adoption/stages";
import { AdoptionStageBadge } from "@/components/adoption/adoption-stage-badge";
import { AdoptionTrendBadge } from "@/components/adoption/adoption-trend-badge";
import { AdoptionRiskBadge } from "@/components/adoption/adoption-risk-badge";
import { AdoptionScoreBreakdownPanel } from "@/components/adoption/adoption-score-breakdown";
import { AdoptionRecommendations } from "@/components/adoption/adoption-recommendations";
import { AdoptionFeatureList } from "@/components/adoption/adoption-feature-list";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type AdoptionHubProps = {
  adoption: AdoptionSnapshot;
};

function formatRelativeDays(days: number | null): string {
  if (days === null) {
    return "No meaningful activity recorded";
  }
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "1 day ago";
  }
  return `${days} days ago`;
}

export function AdoptionHub({ adoption }: AdoptionHubProps) {
  const guidance = getAdoptionStageGuidance(adoption.stage);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div>
          <SectionTitle>Adoption &amp; Retention</SectionTitle>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Understand whether your workspace is creating recurring value, which features are adopted,
            and where retention risk may exist — from real product activity, not page views.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdoptionStageBadge stage={adoption.stage} />
          <AdoptionTrendBadge trend={adoption.trend} />
          <AdoptionRiskBadge level={adoption.riskLevel} />
          <span
            className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-foreground"
            aria-label={`Adoption score ${adoption.score} out of 100`}
          >
            Score {adoption.score}/100
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card padding="lg" className="lg:col-span-7 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Score breakdown</h2>
          <AdoptionScoreBreakdownPanel breakdown={adoption.scoreBreakdown} />
        </Card>

        <Card padding="lg" className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Lifecycle guidance</h2>
          <p className="text-sm text-muted">{guidance.meaning}</p>
          <p className="text-sm text-foreground">
            <span className="font-medium">Next: </span>
            {guidance.nextStep}
          </p>
          {!adoption.isActivated ? (
            <p className="text-sm text-muted">
              Complete{" "}
              <Link href="/onboarding" className={cn(linkText, "text-sm")}>
                workspace activation
              </Link>{" "}
              first to unlock full adoption scoring.
            </p>
          ) : null}
        </Card>
      </div>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Recommended actions</h2>
        <AdoptionRecommendations recommendations={adoption.recommendations} snapshot={adoption} />
      </Card>

      <Card padding="lg" className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Feature adoption</h2>
        <AdoptionFeatureList signals={adoption.featureSignals} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Recurring value</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <MetricItem label="Value events (30d)" value={adoption.valueEvents30d} />
            <MetricItem label="Value events (prev 30d)" value={adoption.valueEventsPrevious30d} />
            <MetricItem
              label="Last meaningful activity"
              value={formatRelativeDays(adoption.daysSinceMeaningfulActivity)}
              text
            />
            <MetricItem label="Active users (30d)" value={adoption.activeUsers30d} />
            <MetricItem label="Adopted features" value={adoption.adoptedFeatureCount} />
            <MetricItem label="Available features" value={adoption.availableFeatureCount} />
          </dl>
        </Card>

        <Card padding="lg" className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Retention risk</h2>
          {adoption.riskReasons.length === 0 ? (
            <p className="text-sm text-success">Healthy — no retention risk signals detected.</p>
          ) : (
            <ul className="space-y-3">
              {adoption.riskReasons.map((reason) => (
                <li
                  key={reason.code}
                  className="rounded-lg border border-border/70 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{reason.label}</p>
                    <span className="text-xs capitalize text-muted">{reason.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{reason.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    <span className="font-medium text-foreground">Evidence: </span>
                    {reason.evidence}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  text = false,
}: {
  label: string;
  value: number | string;
  text?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("mt-1 font-semibold text-foreground", text ? "text-sm" : "text-xl")}>
        {value}
      </dd>
    </div>
  );
}
