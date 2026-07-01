import { cn } from "@/lib/utils/cn";

type SLABreachBadgeProps = {
  className?: string;
};

export function SLABreachBadge({ className }: SLABreachBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20",
        className,
      )}
    >
      Breached
    </span>
  );
}
