import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

type ConnectorHealthBadgeProps = {
  healthPercent: number;
  className?: string;
};

export function ConnectorHealthBadge({ healthPercent, className }: ConnectorHealthBadgeProps) {
  const tone: StatusBadgeTone =
    healthPercent >= 90 ? "success" : healthPercent >= 70 ? "warning" : "danger";

  return (
    <StatusBadge tone={tone} className={className}>
      {healthPercent}% healthy
    </StatusBadge>
  );
}
