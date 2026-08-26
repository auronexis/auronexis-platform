import { cn } from "@/lib/utils/cn";

export type MarketingLogoItem = {
  name: string;
  category: string;
};

type MarketingLogoCloudProps = {
  /** When omitted or empty, heading is suppressed (parent section owns the H2). */
  title?: string;
  description?: string;
  items: readonly MarketingLogoItem[];
  className?: string;
};

/** Industry trust band — category labels, not fabricated client logos. */
export function MarketingLogoCloud({
  title,
  description = "MSPs, IT consultancies, and automation agencies running multi-client operations.",
  items,
  className,
}: MarketingLogoCloudProps) {
  const heading = title?.trim() ?? "";
  return (
    <section
      aria-label={heading || "Service-led organization categories"}
      className={cn("space-y-6", className)}
    >
      {heading || description ? (
        <div className="max-w-2xl">
          {heading ? <h3 className="text-lg font-semibold text-white">{heading}</h3> : null}
          {description ? (
            <p
              className={cn(
                "text-sm leading-relaxed text-primary-foreground/75",
                heading ? "mt-2" : undefined,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <ul className="flex flex-wrap gap-3" role="list">
        {items.map((item) => (
          <li
            key={item.name}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-primary-foreground/85"
          >
            <span className="font-medium text-white">{item.name}</span>
            <span className="text-primary-foreground/60"> · {item.category}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
