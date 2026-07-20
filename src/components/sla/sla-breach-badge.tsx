import { StatusBadge } from "@/components/ui/badge";

type SLABreachBadgeProps = {
  className?: string;
};

export function SLABreachBadge({ className }: SLABreachBadgeProps) {
  return (
    <StatusBadge tone="danger" className={className}>
      Breached
    </StatusBadge>
  );
}
