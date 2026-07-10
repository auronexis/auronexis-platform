import { MarketingButton } from "@/components/marketing/marketing-button";
import { resolveMarketingCtaActions } from "@/lib/marketing/auth-context";
import { getPublicNavState } from "@/lib/marketing/public-nav";
import { marketingSectionFade } from "@/lib/ui/marketing-motion";
import { cn } from "@/lib/utils/cn";

type MarketingCtaProps = {
  title: string;
  description: string;
  href: string;
  label: string;
};

/** Server-rendered marketing CTA band with auth-aware button target. */
export async function MarketingCta({ title, description, href, label }: MarketingCtaProps) {
  const auth = await getPublicNavState();
  const action = resolveMarketingCtaActions(auth, { href, label });

  return (
    <section className={cn("border-t border-white/10 bg-white/[0.02]", marketingSectionFade)}>
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            {description}
          </p>
        </div>
        <MarketingButton
          href={action.href}
          variant="primary"
          ctaId="cta_band"
          analyticsEvent="cta_clicked"
          analyticsProps={{ placement: "cta_band", label: action.label }}
        >
          {action.label}
        </MarketingButton>
      </div>
    </section>
  );
}
