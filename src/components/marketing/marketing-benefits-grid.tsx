import { cn } from "@/lib/utils/cn";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

export type MarketingBenefit = {
  title: string;
  description: string;
  icon?: string;
};

type MarketingBenefitsGridProps = {
  benefits: readonly MarketingBenefit[];
  columns?: 2 | 3;
  className?: string;
};

export function MarketingBenefitsGrid({
  benefits,
  columns = 3,
  className,
}: MarketingBenefitsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {benefits.map((benefit) => (
        <article
          key={benefit.title}
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.03] p-6",
            marketingCardHover,
          )}
        >
          {benefit.icon ? (
            <span className="text-lg" aria-hidden>
              {benefit.icon}
            </span>
          ) : null}
          <h3 className="text-lg font-semibold text-white">{benefit.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">{benefit.description}</p>
        </article>
      ))}
    </div>
  );
}
