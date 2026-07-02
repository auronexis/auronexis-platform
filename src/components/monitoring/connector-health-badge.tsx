import { cn } from "@/lib/utils/cn";

type ConnectorHealthBadgeProps = {
  healthPercent: number;
  className?: string;
};

export function ConnectorHealthBadge({ healthPercent, className }: ConnectorHealthBadgeProps) {
  const tone =
    healthPercent >= 90 ? "success" : healthPercent >= 70 ? "warning" : "danger";

  const toneStyles = {
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    danger: "border-danger/20 bg-danger/10 text-danger",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {healthPercent}% healthy
    </span>
  );
}
