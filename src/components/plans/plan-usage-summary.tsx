import Link from "next/link";
import { SeatLimitWarning } from "@/components/seats/seat-limit-warning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { linkText } from "@/lib/ui/tokens";
import { formatClientUsage } from "@/lib/plans/features";
import type { OrganizationPlanUsageSummary } from "@/lib/plans/types";
import type { OrganizationSeatUsage } from "@/lib/seats/types";
import { formatSeatUsage } from "@/lib/seats/plans";
import { cn } from "@/lib/utils/cn";

type PlanUsageSummaryProps = {
  summary: OrganizationPlanUsageSummary;
  seatUsage: OrganizationSeatUsage;
  className?: string;
};

function UsageCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="mb-0">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 space-y-3 text-sm text-muted">{children}</CardContent>
    </Card>
  );
}

export function PlanUsageSummary({ summary, seatUsage, className }: PlanUsageSummaryProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <UsageCard title="Plan usage">
        <p>
          Current plan:{" "}
          <span className="font-semibold text-foreground">{summary.plan.planLabel}</span>
        </p>
        <p>
          Clients:{" "}
          <span className="font-semibold text-foreground">
            {formatClientUsage(summary.clients.used, summary.clients.limit)}
          </span>
        </p>
        <p>
          Seats:{" "}
          <span className="font-semibold text-foreground">
            {formatSeatUsage(seatUsage.used, seatUsage.limit)}
          </span>
        </p>
        <div>
          <p className="font-medium text-foreground">Enabled modules</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {summary.enabledModules.map((module) => (
              <li
                key={module}
                className="rounded-full bg-muted/10 px-2.5 py-0.5 text-xs font-medium text-muted"
              >
                {module}
              </li>
            ))}
          </ul>
        </div>
        {summary.hasUsageOverPlan ? (
          <SeatLimitWarning message="Your usage exceeds this plan. Existing data is preserved, but new records may be blocked." />
        ) : null}
        <Link href="/settings/plans" className={cn(linkText, "inline-flex text-sm")}>
          Change plan
        </Link>
      </UsageCard>
    </div>
  );
}
