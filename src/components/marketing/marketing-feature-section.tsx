import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { marketingSectionFade } from "@/lib/ui/marketing-motion";

type MarketingFeatureSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  visual?: ReactNode;
  children?: ReactNode;
  reverse?: boolean;
  id?: string;
  className?: string;
};

/**
 * Alternating feature section — headline, copy, visual rhythm.
 * Use reverse on alternate rows for premium pacing.
 */
export function MarketingFeatureSection({
  eyebrow,
  title,
  description,
  visual,
  children,
  reverse = false,
  id,
  className,
}: MarketingFeatureSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto max-w-6xl px-6 py-16 sm:py-20",
        marketingSectionFade,
        className,
      )}
    >
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">{description}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </div>
        {visual ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm">{visual}</div>
        ) : null}
      </div>
    </section>
  );
}
