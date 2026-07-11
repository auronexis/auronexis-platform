"use client";

import type { ActivationSnapshot } from "@/lib/activation/types";
import { ActivationCtaLink } from "@/components/activation/activation-cta-link";
import { ActivationOverviewDismissButton } from "@/components/activation/activation-overview-dismiss-button";
import { ActivationStageBadge } from "@/components/activation/activation-stage-badge";
import { ActivationStepList } from "@/components/activation/activation-step-list";
import { useActivationOverviewDismiss } from "@/components/activation/use-activation-overview-dismiss";
import { ACTIVATION_CTA_PRESETS } from "@/lib/activation/cta";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/typography";

type ActivationHubProps = {
  activation: ActivationSnapshot;
  canDismiss: boolean;
};

export function ActivationHub({ activation, canDismiss }: ActivationHubProps) {
  const { stage, completionPercent, categories, nextBestAction, milestoneDescription } = activation;

  const { isDismissed, pending, error, handleDismiss, handleRestore } = useActivationOverviewDismiss({
    canDismiss,
    serverDismissed: !activation.showActivationPanel,
    stage,
    completionPercent,
    sourceRoute: "/onboarding",
  });

  return (
    <div className="space-y-8">
      {error ? (
        <p className="text-sm text-danger" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}

      {isDismissed ? (
        canDismiss ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              aria-busy={pending || undefined}
              onClick={handleRestore}
            >
              Show activation overview
            </Button>
          </div>
        ) : null
      ) : (
        <section aria-label="Activation overview" className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <SectionTitle>Workspace activation</SectionTitle>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Track setup progress, resume where you left off, and reach your first operational
                insight.
              </p>
            </div>
            {canDismiss ? (
              <ActivationOverviewDismissButton onDismiss={handleDismiss} pending={pending} />
            ) : null}
          </div>

          <Card padding="lg" className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ActivationStageBadge stage={stage} />
              <p className="text-sm font-medium text-foreground">
                {completionPercent}% complete
                <span className="sr-only"> of applicable setup steps</span>
              </p>
            </div>

            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted/15"
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
              <div className="rounded-xl border border-border bg-muted/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Next best action
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{nextBestAction.title}</p>
                <p className="mt-1 text-sm text-muted">{nextBestAction.description}</p>
                <div className="mt-4">
                  <ActivationCtaLink
                    href={nextBestAction.href}
                    analyticsEvent={nextBestAction.analyticsContext.event}
                    analyticsProps={nextBestAction.analyticsContext.props}
                  >
                    Continue
                  </ActivationCtaLink>
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      )}

      <section aria-label="First value milestone" className="space-y-3">
        <SectionTitle className="text-lg">First value milestone</SectionTitle>
        <Card padding="md" className="border-dashed">
          <p className="text-sm leading-relaxed text-muted">{milestoneDescription}</p>
          <p className="mt-3 text-sm font-medium text-foreground">
            Status:{" "}
            <span className={activation.firstValueReached ? "text-success" : "text-warning"}>
              {activation.firstValueReached ? "Reached" : "In progress"}
            </span>
          </p>
        </Card>
      </section>

      <section aria-label="Workspace readiness" className="space-y-3">
        <SectionTitle className="text-lg">Workspace readiness</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.key} padding="md">
              <p className="text-sm font-semibold text-foreground">{category.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {category.completeCount}
                <span className="text-base font-normal text-muted"> / {category.applicableCount}</span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Recommended setup path" className="space-y-3">
        <SectionTitle className="text-lg">Recommended setup path</SectionTitle>
        <Card padding="lg">
          <ActivationStepList steps={activation.steps} showCategories />
        </Card>
      </section>

      <section aria-label="Continue setup" className="flex flex-wrap gap-3">
        <ActivationCtaLink
          href="/dashboard"
          variant="outline"
          analyticsEvent="onboarding_viewed"
          analyticsProps={{ source_route: "onboarding_hub", activation_stage: stage }}
        >
          Return to dashboard
        </ActivationCtaLink>
        {!activation.steps.find((step) => step.id === "billing_reviewed")?.complete ? (
          <ActivationCtaLink
            href={ACTIVATION_CTA_PRESETS.reviewPlans.href}
            variant="ghost"
            size="sm"
            analyticsEvent={ACTIVATION_CTA_PRESETS.reviewPlans.analyticsEvent}
            analyticsProps={ACTIVATION_CTA_PRESETS.reviewPlans.analyticsProps}
          >
            {ACTIVATION_CTA_PRESETS.reviewPlans.label}
          </ActivationCtaLink>
        ) : null}
      </section>
    </div>
  );
}
