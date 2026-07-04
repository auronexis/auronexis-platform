import Link from "next/link";
import { resolveMarketingHeroActions } from "@/lib/marketing/auth-context";
import { getPublicNavState } from "@/lib/marketing/public-nav";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

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
    <section className="relative overflow-hidden border-b border-white/10">
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
          <Link
            href={actions.primaryHref}
            className={cn(
              "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm",
              focusRing,
            )}
          >
            {actions.primaryLabel}
          </Link>
          {actions.secondaryHref && actions.secondaryLabel ? (
            <Link
              href={actions.secondaryHref}
              className={cn(
                "rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm",
                focusRing,
              )}
            >
              {actions.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
