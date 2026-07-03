import { PageDescription, PageTitle } from "@/components/ui/typography";
import { getAuroraModule } from "@/lib/ui/aurora";
import { cn } from "@/lib/utils/cn";
import { transitionInteractive } from "@/lib/ui/tokens";

type PricingHeroProps = {
  title?: string;
  subtitle?: string;
};

const pricingIdentity = getAuroraModule("pricing");

export function PricingHero({
  title = "Choose Professional, Business, or Enterprise",
  subtitle = "Compare Professional, Business, and Enterprise. Pilot and Founding programs are invite-only.",
}: PricingHeroProps) {
  return (
    <section
      className={cn(
        "relative mx-auto max-w-3xl overflow-hidden rounded-2xl border px-6 py-8 text-center shadow-sm sm:px-10 sm:py-10",
        pricingIdentity.accentBorder,
        "bg-gradient-to-br from-surface via-surface to-muted/10",
        transitionInteractive,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b opacity-60",
          pricingIdentity.accentGlow,
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-6 bottom-6 w-[3px] rounded-full",
          pricingIdentity.statusBar,
        )}
        aria-hidden
      />

      <div className="relative pl-3">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            pricingIdentity.accentEyebrow,
          )}
        >
          {pricingIdentity.eyebrow}
        </p>
        <PageTitle className="mt-3 text-3xl sm:text-4xl">{title}</PageTitle>
        <PageDescription className="mx-auto mt-4 max-w-2xl text-base sm:text-lg">
          {subtitle}
        </PageDescription>
      </div>
    </section>
  );
}
