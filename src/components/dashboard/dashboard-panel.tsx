import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { auroraSurface, auroraSurfaceElevated } from "@/lib/ui/aurora";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type DashboardPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "default" | "glass";
  /** Stretch panel to fill grid row height — off by default to avoid empty-state/footer overlap. */
  stretch?: boolean;
};

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  variant = "default",
  stretch = false,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        stretch ? "flex h-full min-h-0 flex-col" : "min-w-0 overflow-hidden",
        variant === "glass"
          ? "rounded-2xl border border-border/80 bg-surface/90 shadow-md backdrop-blur-sm"
          : auroraSurface,
        transitionInteractive,
        "hover:shadow-interactive",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(stretch ? "min-h-0 flex-1 p-5" : "p-5", contentClassName)}>{children}</div>
    </section>
  );
}

type DashboardMetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
};

const toneStyles = {
  default: "border-border bg-surface text-primary",
  success: "border-success/20 bg-success/5 text-success",
  warning: "border-warning/20 bg-warning/5 text-warning",
  danger: "border-danger/20 bg-danger/5 text-danger",
  info: "border-primary/20 bg-primary/5 text-primary",
} as const;

export function DashboardMetricCard({
  label,
  value,
  icon,
  trend = "Stable this period",
  tone = "default",
  className,
}: DashboardMetricCardProps) {
  return (
    <article
      className={cn(
        auroraSurfaceElevated,
        "group aurora-glow p-6",
        transitionInteractive,
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-interactive",
        focusRing,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            toneStyles[tone],
          )}
        >
          <Icon icon={icon} size="md" />
        </span>
        <span className="text-[11px] font-medium text-muted">{trend}</span>
      </div>
      <p className="mt-6 text-4xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm font-medium text-muted">{label}</p>
    </article>
  );
}
