import Link from "next/link";
import type { ReportScheduleWithRelations } from "@/lib/report-schedules/types";
import {
  formatScheduleDate,
  SCHEDULE_FREQUENCY_LABELS,
} from "@/lib/report-schedules/types";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DashboardUpcomingSchedulesProps = {
  schedules: ReportScheduleWithRelations[];
};

export function DashboardUpcomingSchedules({ schedules }: DashboardUpcomingSchedulesProps) {
  if (schedules.length === 0) {
    return <p className="text-sm text-muted">No scheduled reports.</p>;
  }

  return (
    <ul className="space-y-3">
      {schedules.map((schedule) => (
        <li key={schedule.id}>
          <Link
            href={`/reports/schedules/${schedule.id}`}
            aria-label={`Open schedule ${schedule.title_template}`}
            className={cn(
              "block rounded-md border border-border px-4 py-3",
              "transition-colors hover:bg-surface-2",
              focusRing,
            )}
          >
            <span className="font-medium text-foreground">{schedule.title_template}</span>
            <p className="mt-1 text-sm text-secondary">{schedule.clients?.name ?? "—"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>Next run {formatScheduleDate(schedule.next_run_at)}</span>
              <span>·</span>
              <span>{SCHEDULE_FREQUENCY_LABELS[schedule.frequency]}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
