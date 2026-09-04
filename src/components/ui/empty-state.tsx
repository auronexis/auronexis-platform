import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { CardHeading, MutedText } from "@/components/ui/typography";
import { Icon } from "@/components/ui/icon";
import { motionEmptyEnter } from "@/lib/ui/motion";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  /** Compact density for dashboard panels (~180–260px). */
  density?: "default" | "compact";
};

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  secondaryAction,
  className,
  density = "default",
}: EmptyStateProps) {
  const compact = density === "compact";

  return (
    <Card
      padding={compact ? "sm" : "lg"}
      className={cn(
        "flex flex-col items-center justify-center border-dashed border-border-strong bg-surface text-center",
        compact
          ? "min-h-[10rem] max-h-[16rem] px-4 py-6"
          : "min-h-[12rem] px-6 py-10",
        motionEmptyEnter,
        className,
      )}
    >
      {IconComponent ? (
        <div
          className={cn(
            "mx-auto flex items-center justify-center rounded-2xl border border-border/80 bg-muted/10 text-muted shadow-xs",
            compact ? "mb-3 h-10 w-10" : "mb-4 h-14 w-14",
          )}
          aria-hidden
        >
          <Icon icon={IconComponent} size={compact ? "md" : "lg"} />
        </div>
      ) : null}
      <CardHeading className={compact ? "text-base" : "text-lg"}>{title}</CardHeading>
      {description ? (
        <MutedText
          className={cn(
            "mx-auto mt-2 max-w-lg leading-relaxed",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </MutedText>
      ) : null}
      {action || secondaryAction ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 sm:flex-row",
            compact ? "mt-4" : "mt-6",
          )}
        >
          {action ? <div className="flex justify-center">{action}</div> : null}
          {secondaryAction ? <div className="flex justify-center">{secondaryAction}</div> : null}
        </div>
      ) : null}
    </Card>
  );
}
