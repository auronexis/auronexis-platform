import { cn } from "@/lib/utils/cn";
import { marketingCardHover } from "@/lib/ui/marketing-motion";

export type MarketingStat = {
  value: string;
  label: string;
  detail?: string;
};

type MarketingStatsProps = {
  stats: readonly MarketingStat[];
  className?: string;
};

/** Executive statistics band — scannable proof metrics. */
export function MarketingStats({ stats, className }: MarketingStatsProps) {
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
      role="list"
      aria-label="Platform statistics"
    >
      {stats.map((stat) => (
        <article
          key={stat.label}
          role="listitem"
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6",
            marketingCardHover,
          )}
        >
          <p className="text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
          <p className="mt-1 text-sm font-medium text-primary-foreground/90">{stat.label}</p>
          {stat.detail ? (
            <p className="mt-2 text-xs leading-relaxed text-primary-foreground/65">{stat.detail}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
