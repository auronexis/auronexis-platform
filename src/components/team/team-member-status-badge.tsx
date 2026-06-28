type TeamMemberStatusBadgeProps = {
  isDisabled: boolean;
};

export function TeamMemberStatusBadge({ isDisabled }: TeamMemberStatusBadgeProps) {
  return (
    <span
      className={
        isDisabled
          ? "inline-flex rounded-full bg-muted/10 px-2.5 py-0.5 text-xs font-medium text-muted"
          : "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
      }
    >
      {isDisabled ? "Disabled" : "Active"}
    </span>
  );
}
