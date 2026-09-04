import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import type { CustomerSuccessCategory } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type CustomerSuccessCenterPanelProps = {
  categories: CustomerSuccessCategory[];
};

const toneStyles: Record<CustomerSuccessCategory["tone"], string> = {
  default: "border-border/70 bg-surface/60 hover:border-border-strong",
  success: "border-success/20 bg-success/5 hover:border-success/30",
  warning: "border-warning/20 bg-warning/5 hover:border-warning/30",
  danger: "border-danger/20 bg-danger/5 hover:border-danger/30",
  info: "border-primary/20 bg-primary/5 hover:border-primary/30",
};

const valueTone: Record<CustomerSuccessCategory["tone"], string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-primary",
};

/**
 * Compact Customer Success KPI grid — label + count in 1–2 rows.
 * Descriptions stay available via tooltip; links preserve workflows.
 */
export function CustomerSuccessCenterPanel({ categories }: CustomerSuccessCenterPanelProps) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6"
      data-customer-success-center
    >
      {categories.map((category) => (
        <Tooltip key={category.id} content={category.description} side="bottom">
          <Link
            href={category.href}
            title={category.description}
            aria-label={`${category.label}: ${category.count}. ${category.description}`}
            className={cn(
              "flex min-h-14 flex-col justify-center rounded-lg border px-3 py-2.5",
              toneStyles[category.tone],
              transitionInteractive,
              "hover:shadow-sm",
              focusRing,
            )}
          >
            <span className="truncate text-[11px] font-medium text-muted">{category.label}</span>
            <span
              className={cn(
                "mt-0.5 text-xl font-semibold tabular-nums tracking-tight",
                valueTone[category.tone],
              )}
            >
              {category.count}
            </span>
          </Link>
        </Tooltip>
      ))}
    </div>
  );
}

export function CustomerSuccessCenterEmptyState() {
  return (
    <div
      className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center"
      role="status"
    >
      <HeartHandshake className="mx-auto h-6 w-6 text-primary" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">
        Customer success signals will populate here
      </p>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted">
        Track reports, risks, and client activity to unlock categorized success workflows.
      </p>
    </div>
  );
}
