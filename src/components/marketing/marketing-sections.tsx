import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { marketingCardHover, marketingSectionFade } from "@/lib/ui/marketing-motion";
import { focusRing } from "@/lib/ui/tokens";

type MarketingSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  id?: string;
};

export function MarketingSection({
  eyebrow,
  title,
  description,
  children,
  className,
  id,
}: MarketingSectionProps) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-6 py-16 sm:py-20", marketingSectionFade, className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-primary-foreground/80">{description}</p>
      ) : null}
      {children ? <div className="mt-10">{children}</div> : null}
    </section>
  );
}

export function MarketingCardGrid({
  items,
}: {
  items: ReadonlyArray<{ title: string; description: string; featured?: boolean; href?: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm",
            marketingCardHover,
            item.featured && "border-primary/30 ring-1 ring-primary/20",
          )}
        >
          <h3 className="text-lg font-semibold text-white">
            {item.href ? (
              <Link href={item.href} className={cn("hover:underline", focusRing, "rounded")}>
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function MarketingFaq({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm"
        >
          <summary className="cursor-pointer list-none text-base font-semibold text-white marker:content-none">
            {item.question}
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
