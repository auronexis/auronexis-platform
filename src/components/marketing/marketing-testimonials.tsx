import { cn } from "@/lib/utils/cn";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

export type MarketingTestimonial = {
  quote: string;
  role: string;
  organizationType: string;
};

type MarketingTestimonialsProps = {
  title?: string;
  items: readonly MarketingTestimonial[];
  className?: string;
};

/** Representative buyer priorities — not customer testimonials. */
export function MarketingTestimonials({
  title = "What operations leaders look for",
  items,
  className,
}: MarketingTestimonialsProps) {
  return (
    <section aria-label={title} className={cn("space-y-8", className)}>
      <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h3>
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
