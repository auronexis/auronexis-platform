import Link from "next/link";
import type { MarketingFeature } from "@/lib/marketing/content";
import { cn } from "@/lib/utils/cn";
import { focusRing, linkText } from "@/lib/ui/tokens";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

type MarketingFeatureDetailsProps = {
  features: readonly MarketingFeature[];
};

export function MarketingFeatureDetails({ features }: MarketingFeatureDetailsProps) {
  return (
    <div className="space-y-6">
      {features.map((feature) => (
        <article
          key={feature.title}
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm sm:p-8",
            marketingCardHover,
          )}
        >
          <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">{feature.description}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">
                Business problem
              </dt>
              <dd className="mt-1 text-sm text-primary-foreground/85">{feature.problem}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">Workflow</dt>
              <dd className="mt-1 text-sm text-primary-foreground/85">{feature.workflow}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">
                Business outcome
              </dt>
              <dd className="mt-1 text-sm text-primary-foreground/85">{feature.outcome}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/60">
                Enterprise value
              </dt>
              <dd className="mt-1 text-sm text-primary-foreground/85">{feature.enterpriseValue}</dd>
            </div>
          </dl>

          {feature.planNote ? (
            <p className="mt-4 text-xs text-primary-foreground/65">{feature.planNote}</p>
          ) : null}

          <Link href={feature.ctaHref} className={cn(linkText, "mt-5 inline-flex text-sm font-semibold", focusRing)}>
            {feature.ctaLabel} →
          </Link>
        </article>
      ))}
    </div>
  );
}
