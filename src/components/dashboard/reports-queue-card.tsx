import Link from "next/link";
import type { ReportScheduleWithRelations } from "@/lib/report-schedules/types";
import { formatScheduleDateTime } from "@/lib/report-schedules/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ReportsQueueCardProps = {
  draftReportsCount: number;
  upcomingSchedules: ReportScheduleWithRelations[];
  schedulingEnabled: boolean;
};

export function ReportsQueueCard({
  draftReportsCount,
  upcomingSchedules,
  schedulingEnabled,
}: ReportsQueueCardProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/70 bg-muted/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Draft queue
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {draftReportsCount}
        </p>
        <p className="mt-1 text-sm text-muted">Reports waiting to be finalized</p>
        <Link href="/reports" className={cn(linkText, "mt-3 inline-block text-sm")}>
          Open reports
        </Link>
      </div>

      {schedulingEnabled ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Upcoming schedules
          </p>
          {upcomingSchedules.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-5 text-sm text-muted">
              No scheduled reports queued. Create a schedule to automate delivery.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcomingSchedules.slice(0, 4).map((schedule) => (
                <li
                  key={schedule.id}
                  className="rounded-xl border border-border/70 bg-surface px-3 py-2.5"
                >
                  <Link
                    href={`/reports/schedules/${schedule.id}`}
                    className={cn(linkText, "text-sm font-medium no-underline hover:underline")}
                  >
                    {schedule.title_template}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    Next run · {formatScheduleDateTime(schedule.next_run_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-5 text-sm text-muted">
          Report scheduling unlocks on Professional. Upgrade to automate recurring delivery.
        </p>
      )}
    </div>
  );
}
