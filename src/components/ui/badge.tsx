import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type StatusBadgeTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "muted"
  | "violet"
  | "orange"
  | "teal";

const toneStyles: Record<StatusBadgeTone, string> = {
  success: "bg-success/10 text-success ring-success/25",
  warning: "bg-warning/10 text-warning ring-warning/25",
  danger: "bg-danger/10 text-danger ring-danger/25",
  info: "bg-primary/10 text-primary ring-primary/25",
  neutral: "bg-muted/15 text-foreground ring-border/40",
  muted: "bg-muted/10 text-muted ring-border/20",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/25",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-teal-500/25",
};

type StatusBadgeProps = {
  tone?: StatusBadgeTone;
  children: ReactNode;
  className?: string;
  title?: string;
  "aria-label"?: string;
};

/**
 * Canonical status/pill badge — domain badges should compose this for chrome consistency.
 */
export function StatusBadge({
  tone = "muted",
  children,
  className,
  title,
  "aria-label": ariaLabel,
}: StatusBadgeProps) {
  return (
    <span
      title={title}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
