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
  className?: string;
};

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      padding="lg"
      className={cn(
        "flex min-h-[12rem] flex-col items-center justify-center border-dashed border-border-strong bg-surface px-6 py-10 text-center",
        motionEmptyEnter,
        className,
      )}
    >
      {IconComponent ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/80 bg-muted/10 text-muted shadow-xs">
          <Icon icon={IconComponent} size="lg" />
        </div>
      ) : null}
      <CardHeading className="text-lg">{title}</CardHeading>
      {description ? (
        <MutedText className="mx-auto mt-2 max-w-lg text-sm leading-relaxed">{description}</MutedText>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </Card>
  );
}
