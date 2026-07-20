import { StatusBadge } from "@/components/ui/badge";

type TeamMemberStatusBadgeProps = {
  isDisabled: boolean;
};

export function TeamMemberStatusBadge({ isDisabled }: TeamMemberStatusBadgeProps) {
  return (
    <StatusBadge tone={isDisabled ? "muted" : "success"}>
      {isDisabled ? "Disabled" : "Active"}
    </StatusBadge>
  );
}
