import { MarketingButton } from "@/components/marketing/marketing-button";
import { resolveMarketingHeroActions } from "@/lib/marketing/auth-context";
import { getPublicNavState } from "@/lib/marketing/public-nav";
import { cn } from "@/lib/utils/cn";
import { marketingMotionEnter } from "@/lib/ui/marketing-motion";

export type MarketingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  withBanner?: boolean;
};

/** Server-rendered marketing hero with auth-aware CTAs. */
export async function MarketingHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  withBanner = false,
}: MarketingHeroProps) {
  const auth = await getPublicNavState();
  const actions = resolveMarketingHeroActions(auth, {
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
  });

  return (
    <section className={cn("relative overflow-hidden border-b border-white/10", marketingMotionEnter)}>
      {withBanner ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url(/branding/hero-banner.png)" }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-secondary via-navy-900 to-navy-950"
          aria-hidden
        />
      )}

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/80">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-primary-foreground/85">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <MarketingButton
            href={actions.primaryHref}
            variant="primary"
            size="lg"
            ctaId="hero_primary"
            analyticsEvent="cta_clicked"
            analyticsProps={{ placement: "hero", label: actions.primaryLabel }}
          >
            {actions.primaryLabel}
          </MarketingButton>
          {actions.secondaryHref && actions.secondaryLabel ? (
            <MarketingButton
              href={actions.secondaryHref}
              variant="secondary"
              size="lg"
              ctaId="hero_secondary"
              analyticsEvent="cta_clicked"
              analyticsProps={{ placement: "hero", label: actions.secondaryLabel }}
            >
              {actions.secondaryLabel}
            </MarketingButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}
