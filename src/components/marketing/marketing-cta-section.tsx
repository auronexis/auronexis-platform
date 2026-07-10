import { MarketingButton } from "@/components/marketing/marketing-button";
import { MARKETING_CTA_PRESETS } from "@/lib/marketing/cta";
import { cn } from "@/lib/utils/cn";
import { marketingSectionFade } from "@/lib/ui/marketing-motion";

type MarketingCtaSectionProps = {
  title: string;
  description: string;
  primaryPreset?: keyof typeof MARKETING_CTA_PRESETS;
  secondaryPreset?: keyof typeof MARKETING_CTA_PRESETS;
  className?: string;
};

/** Full-width CTA band with centralized preset buttons. */
export function MarketingCtaSection({
  title,
  description,
  primaryPreset = "startFreeTrial",
  secondaryPreset = "seePricing",
  className,
}: MarketingCtaSectionProps) {
  const primary = MARKETING_CTA_PRESETS[primaryPreset];
  const secondary = MARKETING_CTA_PRESETS[secondaryPreset];

  return (
    <section
      className={cn(
        "border-t border-white/10 bg-white/[0.02]",
        marketingSectionFade,
        className,
      )}
      aria-label="Call to action"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <MarketingButton
            href={primary.href}
            variant={primary.variant}
            ctaId={primary.id}
            analyticsEvent={primary.analyticsEvent}
            analyticsProps={primary.analyticsProps}
          >
            {primary.label}
          </MarketingButton>
          <MarketingButton
            href={secondary.href}
            variant={secondary.variant}
            ctaId={secondary.id}
            analyticsEvent={secondary.analyticsEvent}
            analyticsProps={secondary.analyticsProps}
          >
            {secondary.label}
          </MarketingButton>
        </div>
      </div>
    </section>
  );
}
