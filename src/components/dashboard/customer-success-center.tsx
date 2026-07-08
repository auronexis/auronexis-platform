import Link from "next/link";
import { HeartHandshake } from "lucide-react";
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

export function CustomerSuccessCenterPanel({ categories }: CustomerSuccessCenterPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          className={cn(
            "rounded-xl border p-4",
            toneStyles[category.tone],
            transitionInteractive,
            "hover:-translate-y-0.5 hover:shadow-interactive",
            focusRing,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{category.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{category.description}</p>
            </div>
            <span className="shrink-0 text-2xl font-semibold tracking-tight text-foreground">
              {category.count}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function CustomerSuccessCenterEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-6 py-10 text-center">
      <HeartHandshake className="mx-auto h-8 w-8 text-primary" aria-hidden />
      <p className="mt-4 text-sm font-medium text-foreground">Customer success signals will populate here</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Track reports, risks, and client activity to unlock categorized success workflows.
      </p>
    </div>
  );
}
