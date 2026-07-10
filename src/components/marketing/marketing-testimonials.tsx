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

/** Social proof quotes — role-based, no unverifiable client claims. */
export function MarketingTestimonials({
  title = "What operations leaders value",
  items,
  className,
}: MarketingTestimonialsProps) {
  return (
    <section aria-label={title} className={cn("space-y-8", className)}>
      <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <blockquote
            key={item.quote.slice(0, 48)}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/[0.03] p-6",
              marketingCardHover,
            )}
          >
            <p className="text-sm leading-relaxed text-primary-foreground/85">&ldquo;{item.quote}&rdquo;</p>
            <footer className="mt-4 text-xs text-primary-foreground/65">
              <cite className="not-italic font-medium text-white">{item.role}</cite>
              <span> · {item.organizationType}</span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
