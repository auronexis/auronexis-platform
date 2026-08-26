import { cn } from "@/lib/utils/cn";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

export type MarketingTestimonial = {
  quote: string;
  role: string;
  organizationType: string;
};

type MarketingTestimonialsProps = {
  /** When omitted or empty, heading is suppressed (parent section owns the H2). */
  title?: string;
  items: readonly MarketingTestimonial[];
  className?: string;
};

/** Representative buyer priorities — not customer testimonials. */
export function MarketingTestimonials({
  title,
  items,
  className,
}: MarketingTestimonialsProps) {
  const heading = title?.trim() ?? "";
  return (
    <section
      aria-label={heading || "Operations leader priorities"}
      className={cn("space-y-8", className)}
    >
      {heading ? (
        <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{heading}</h3>
      ) : null}
      <p className="max-w-3xl text-sm text-primary-foreground/70">
        Representative buyer priorities — not customer testimonials or reviews.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.quote.slice(0, 48)}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/[0.03] p-6",
              marketingCardHover,
            )}
          >
            <p className="text-sm leading-relaxed text-primary-foreground/85">{item.quote}</p>
            <footer className="mt-4 text-xs text-primary-foreground/65">
              <span className="font-medium text-white">{item.role}</span>
              <span> · {item.organizationType}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
