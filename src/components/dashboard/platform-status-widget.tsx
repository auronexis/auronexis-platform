import Link from "next/link";
import { Activity, ExternalLink } from "lucide-react";
import type { PlatformReadinessColor } from "@/lib/diagnostics/platform-readiness";
import type { PlatformStatusSnapshot } from "@/lib/diagnostics/platform-status";
import { cn } from "@/lib/utils/cn";

type PlatformStatusWidgetProps = {
  snapshot: PlatformStatusSnapshot;
};

const readinessStyles: Record<PlatformReadinessColor, string> = {
  green: "text-success border-success/30 bg-success/5",
  blue: "text-primary border-primary/30 bg-primary/5",
  amber: "text-warning border-warning/30 bg-warning/5",
  orange: "text-warning border-warning/40 bg-warning/10",
  red: "text-danger border-danger/30 bg-danger/5",
};

function itemToneClass(status: PlatformStatusSnapshot["items"][number]["status"]) {
  return {
    healthy: "text-success",
    degraded: "text-primary",
    warning: "text-warning",
    unavailable: "text-danger",
    unknown: "text-muted",
  }[status];
}

function itemStatusLabel(status: PlatformStatusSnapshot["items"][number]["status"]) {
  return {
    healthy: "healthy",
    degraded: "optional",
    warning: "warning",
    unavailable: "unavailable",
    unknown: "unknown",
  }[status];
}

export function PlatformStatusWidget({ snapshot }: PlatformStatusWidgetProps) {
  const { readiness } = snapshot;

  return (
    <div className="space-y-4">
      <div className={cn("rounded-2xl border p-4", readinessStyles[readiness.color])}>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
          <Activity className="h-4 w-4" aria-hidden />
          Platform status
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{readiness.label}</p>
        <p className="mt-1 text-sm font-medium opacity-90">
          {readiness.score}% · {readiness.tierLabel}
        </p>
        <p className="mt-1 text-sm opacity-80">
          {snapshot.environment} · v{snapshot.version}
        </p>
      </div>

      <div className="space-y-2">
        {snapshot.items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/5 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="truncate text-xs text-muted">{item.detail}</p>
            </div>
            <span className={cn("text-xs font-semibold uppercase", itemToneClass(item.status))}>
              {itemStatusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/settings/diagnostics"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        Full diagnostics
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}
