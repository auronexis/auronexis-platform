import { cn } from "@/lib/utils/cn";

type PredictiveCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function PredictiveCard({
  title,
  description,
  action,
  children,
  className,
}: PredictiveCardProps) {
  return (
    <section className={cn("rounded-2xl border border-border bg-surface/80 p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
