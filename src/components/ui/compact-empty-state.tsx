import { cn } from "@/lib/utils/cn";

type CompactEmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

/**
 * Compact dashed empty chrome for inline panels (AI / analysis slots).
 * Prefer {@link EmptyState} for full-page or card-sized empty surfaces.
 */
export function CompactEmptyState({ title, description, className }: CompactEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center",
        className,
      )}
      role="status"
    >
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}
