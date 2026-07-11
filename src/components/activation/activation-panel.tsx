import type { ActivationSnapshot, NextBestAction } from "@/lib/activation/types";
import { ACTIVATION_CTA_PRESETS } from "@/lib/activation/cta";
import { ActivationCtaLink } from "@/components/activation/activation-cta-link";
import { ActivationStageBadge } from "@/components/activation/activation-stage-badge";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";
import Link from "next/link";

type ActivationPanelProps = {
  activation: ActivationSnapshot;
  compact?: boolean;
};

export function ActivationPanel({ activation, compact = false }: ActivationPanelProps) {
  const { stage, completionPercent, nextBestAction, showBeginnerSurfaces } = activation;

  if (!showBeginnerSurfaces && stage === "mature") {
    return <WorkspaceMaturityCard activation={activation} />;
  }

  if (!showBeginnerSurfaces && !compact) {
    return null;
  }

  return (
    <DashboardPanel
      title={compact ? "Next step" : "Workspace activation"}
      description={
        compact
          ? "Your highest-priority setup action."
          : "Complete core setup to unlock operational intelligence."
      }
      action={
        <Link href="/onboarding" className={cn(linkText, "text-xs")}>
          View setup hub
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ActivationStageBadge stage={stage} />
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">{completionPercent}%</span> complete
            <span className="sr-only"> workspace setup progress</span>
          </p>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-muted/15"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Workspace activation progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {nextBestAction ? (
          <NextBestActionBlock action={nextBestAction} />
        ) : (
          <p className="text-sm text-muted">
            Core setup is on track. Continue refining operations from the dashboard.
          </p>
        )}

        {!compact ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <ActivationCtaLink
              href={ACTIVATION_CTA_PRESETS.openActivationHub.href}
              variant="outline"
              size="sm"
              analyticsEvent={ACTIVATION_CTA_PRESETS.openActivationHub.analyticsEvent}
              analyticsProps={ACTIVATION_CTA_PRESETS.openActivationHub.analyticsProps}
            >
              {ACTIVATION_CTA_PRESETS.openActivationHub.label}
            </ActivationCtaLink>
          </div>
        ) : null}
      </div>
    </DashboardPanel>
  );
}

function NextBestActionBlock({ action }: { action: NextBestAction }) {
  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-surface to-surface-2 p-4">
      <p className="text-sm font-semibold text-foreground">{action.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{action.description}</p>
      <div className="mt-4">
        <ActivationCtaLink
          href={action.href}
          size="sm"
          analyticsEvent={action.analyticsContext.event}
          analyticsProps={action.analyticsContext.props}
        >
          Continue
        </ActivationCtaLink>
      </div>
    </div>
  );
}

function WorkspaceMaturityCard({ activation }: { activation: ActivationSnapshot }) {
  return (
    <DashboardPanel
      title="Workspace maturity"
      description="Your workspace has reached a stable operational posture."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActivationStageBadge stage={activation.stage} />
        <p className="text-sm text-muted">
          {activation.completedStepCount} of {activation.applicableStepCount} setup steps complete
        </p>
      </div>
    </DashboardPanel>
  );
}
