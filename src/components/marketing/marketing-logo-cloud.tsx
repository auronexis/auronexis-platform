import { cn } from "@/lib/utils/cn";

export type MarketingLogoItem = {
  name: string;
  category: string;
};

type MarketingLogoCloudProps = {
  title?: string;
  description?: string;
  items: readonly MarketingLogoItem[];
  className?: string;
};

/** Industry trust band — category labels, not fabricated client logos. */
export function MarketingLogoCloud({
  title = "Built for service-led organizations",
  description = "MSPs, IT consultancies, and automation agencies running multi-client operations.",
  items,
  className,
}: MarketingLogoCloudProps) {
  return (
    <section aria-label={title} className={cn("space-y-6", className)}>
      <div className="max-w-2xl">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{description}</p>
      </div>
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
