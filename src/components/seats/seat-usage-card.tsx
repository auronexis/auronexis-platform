import Link from "next/link";
import { SeatLimitWarning } from "@/components/seats/seat-limit-warning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { linkText } from "@/lib/ui/tokens";
import { formatSeatUsage } from "@/lib/seats/plans";
import type { OrganizationSeatUsage } from "@/lib/seats/types";
import { cn } from "@/lib/utils/cn";

type SeatUsageCardProps = {
  usage: OrganizationSeatUsage;
  className?: string;
  showLinks?: boolean;
};

export function SeatUsageCard({
  usage,
  className,
  showLinks = true,
}: SeatUsageCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="mb-0">
        <CardTitle>Seats</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-3 text-sm text-muted">
        <p>
          Used seats:{" "}
          <span className="font-semibold text-foreground">
            {formatSeatUsage(usage.used, usage.limit)}
          </span>
        </p>
        <p className="text-xs text-muted">
          {usage.activeUsers} active member{usage.activeUsers === 1 ? "" : "s"}
          {usage.pendingInvitations > 0
            ? ` · ${usage.pendingInvitations} pending invitation${usage.pendingInvitations === 1 ? "" : "s"}`
            : ""}
        </p>

        {usage.isOverLimit ? (
          <SeatLimitWarning message="Your team is over the seat limit for this plan." />
        ) : null}

        {showLinks ? (
          <div className="flex flex-wrap gap-4 pt-1">
            <Link href="/settings/team" className={cn(linkText, "text-sm")}>
              Manage team
            </Link>
            <Link href="/settings/plans" className={cn(linkText, "text-sm")}>
              Change plan
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
