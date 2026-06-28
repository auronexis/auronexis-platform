import Link from "next/link";
import { cn } from "@/lib/utils/cn";
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
    <section id={id} className={cn("mx-auto max-w-6xl px-6 py-16 sm:py-20", className)}>
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

type MarketingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  withBanner?: boolean;
};

export function MarketingHero({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  withBanner = false,
}: MarketingHeroProps) {
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
            href={primaryHref}
            className={cn(
              "rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm",
              focusRing,
            )}
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className={cn(
                "rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm",
                focusRing,
              )}
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function MarketingCardGrid({
  items,
}: {
  items: ReadonlyArray<{ title: string; description: string; featured?: boolean }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-sm",
            item.featured && "border-primary/30 ring-1 ring-primary/20",
          )}
        >
          <h3 className="text-lg font-semibold text-white">{item.title}</h3>
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

export function MarketingCta({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <section className="border-t border-white/10 bg-white/[0.02]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            {description}
          </p>
        </div>
        <Link
          href={href}
          className={cn(
            "shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
            focusRing,
          )}
        >
          {label}
        </Link>
      </div>
    </section>
  );
}
