"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { ActivationSnapshot, NextBestAction } from "@/lib/activation/types";
import { ACTIVATION_CTA_PRESETS } from "@/lib/activation/cta";
import { dismissActivationPanelAction } from "@/lib/activation/actions";
import { ActivationCtaLink } from "@/components/activation/activation-cta-link";
import { ActivationStageBadge } from "@/components/activation/activation-stage-badge";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ActivationPanelProps = {
  activation: ActivationSnapshot;
  canDismiss: boolean;
  compact?: boolean;
};

export function ActivationPanel({ activation, canDismiss, compact = false }: ActivationPanelProps) {
  const { stage, completionPercent, nextBestAction } = activation;
  const serverDismissed = !activation.showActivationPanel;
  const [optimisticDismissed, setOptimisticDismissed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDismissed = optimisticDismissed || serverDismissed;

  const handleDismiss = useCallback(async () => {
    if (!canDismiss || pending || optimisticDismissed || serverDismissed) {
      return;
    }

    setOptimisticDismissed(true);
    setPending(true);
    setError(null);

    trackAnalyticsEvent("activation_panel_dismissed", {
      activation_stage: stage,
      completion_percentage: completionPercent,
      source_route: "/dashboard",
    });

    try {
      const result = await dismissActivationPanelAction();
      if (result.error) {
        setOptimisticDismissed(false);
        setError(result.error);
      }
    } catch {
      setOptimisticDismissed(false);
      setError("Unable to dismiss the activation panel. Please try again.");
    } finally {
      setPending(false);
    }
  }, [canDismiss, pending, optimisticDismissed, serverDismissed, stage, completionPercent]);

  if (stage === "mature") {
    return <WorkspaceMaturityCard activation={activation} />;
  }

  if (isDismissed) {
    return null;
  }

  if (!activation.showBeginnerSurfaces && !compact) {
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
        <div className="flex items-center gap-1">
          <Link href="/onboarding" className={cn(linkText, "text-xs")}>
            View setup hub
          </Link>
          {canDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              aria-label="Dismiss activation panel"
              aria-busy={pending || undefined}
              onClick={handleDismiss}
              className="text-muted hover:text-foreground"
            >
              {pending ? <Spinner size="sm" /> : <X className="h-4 w-4" aria-hidden />}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {error ? (
          <p className="text-sm text-danger" role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}

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
