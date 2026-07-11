import type { ActivationSnapshot } from "@/lib/activation/types";
import { ACTIVATION_CTA_PRESETS } from "@/lib/activation/cta";
import { ActivationCtaLink } from "@/components/activation/activation-cta-link";
import { ActivationDismissButton } from "@/components/activation/activation-dismiss-button";
import { Card } from "@/components/ui/card";
import { CardHeading, MutedText } from "@/components/ui/typography";
import Link from "next/link";
import { linkText } from "@/lib/ui/tokens";

type ActivationWelcomeProps = {
  userName: string;
  activation: ActivationSnapshot;
  canDismiss: boolean;
};

export function ActivationWelcome({ userName, activation, canDismiss }: ActivationWelcomeProps) {
  if (!activation.showWelcome) {
    return null;
  }

  const firstName = userName.split(" ")[0] || "there";

  const primaryActions = [
    activation.nextBestAction
      ? {
          label: activation.nextBestAction.title,
          href: activation.nextBestAction.href,
          variant: "primary" as const,
          analyticsEvent: activation.nextBestAction.analyticsContext.event,
          analyticsProps: activation.nextBestAction.analyticsContext.props,
        }
      : {
          label: ACTIVATION_CTA_PRESETS.addFirstClient.label,
          href: ACTIVATION_CTA_PRESETS.addFirstClient.href,
          variant: "primary" as const,
          analyticsEvent: ACTIVATION_CTA_PRESETS.addFirstClient.analyticsEvent,
          analyticsProps: ACTIVATION_CTA_PRESETS.addFirstClient.analyticsProps,
        },
    {
      label: ACTIVATION_CTA_PRESETS.configureWorkspace.label,
      href: ACTIVATION_CTA_PRESETS.configureWorkspace.href,
      variant: "outline" as const,
      analyticsEvent: ACTIVATION_CTA_PRESETS.configureWorkspace.analyticsEvent,
      analyticsProps: ACTIVATION_CTA_PRESETS.configureWorkspace.analyticsProps,
    },
    {
      label: ACTIVATION_CTA_PRESETS.continueSetup.label,
      href: ACTIVATION_CTA_PRESETS.continueSetup.href,
      variant: "secondary" as const,
      analyticsEvent: ACTIVATION_CTA_PRESETS.continueSetup.analyticsEvent,
      analyticsProps: ACTIVATION_CTA_PRESETS.continueSetup.analyticsProps,
    },
  ].slice(0, 3);

  return (
    <Card
      padding="lg"
      className="relative border-primary/15 bg-gradient-to-br from-primary/[0.04] to-surface"
      role="region"
      aria-label="Welcome to Auroranexis"
    >
      {canDismiss ? (
        <div className="absolute right-3 top-3">
          <ActivationDismissButton surface="welcome" label="Dismiss welcome" />
        </div>
      ) : null}

      <CardHeading className="pr-10 text-xl">Welcome, {firstName}</CardHeading>
      <MutedText className="mt-2 max-w-2xl text-sm leading-relaxed">
        Auroranexis helps your team monitor clients, detect risks, and prove delivery value. Start
        with the shortest path to your first operational insight.
      </MutedText>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {primaryActions.map((action) => (
          <ActivationCtaLink
            key={action.href}
            href={action.href}
            variant={action.variant}
            size="md"
            analyticsEvent={action.analyticsEvent}
            analyticsProps={action.analyticsProps}
          >
            {action.label}
          </ActivationCtaLink>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        Prefer to explore first?{" "}
        <Link href="/dashboard" className={linkText}>
          Continue to dashboard
        </Link>
      </p>
    </Card>
  );
}
