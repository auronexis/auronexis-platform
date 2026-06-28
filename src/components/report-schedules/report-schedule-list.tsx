import { ClickableRow } from "@/components/ui/clickable-row";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import type { ReportScheduleWithRelations } from "@/lib/report-schedules/types";
import {
  formatScheduleDate,
  formatScheduleDateTime,
  SCHEDULE_FREQUENCY_LABELS,
} from "@/lib/report-schedules/types";

type ReportScheduleListProps = {
  schedules: ReportScheduleWithRelations[];
};

export function ReportScheduleList({ schedules }: ReportScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <AuroraTableEmpty
        title="No report schedules configured"
        description="Define recurring schedules to prepare client reports on a consistent cadence."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Schedule</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Frequency</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Next run</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Last run</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Assigned</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {schedules.map((schedule) => (
            <ClickableRow
              key={schedule.id}
              href={`/reports/schedules/${schedule.id}`}
              ariaLabel={`Open schedule ${schedule.title_template}`}
            >
              <AuroraTableCell className="whitespace-nowrap">
                <span className="font-semibold text-foreground">{schedule.title_template}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {schedule.clients?.name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {SCHEDULE_FREQUENCY_LABELS[schedule.frequency]}
                {schedule.frequency === "monthly" && schedule.day_of_month
                  ? ` · Day ${schedule.day_of_month}`
                  : null}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <span
                  className={
                    schedule.is_active
                      ? "inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600"
                      : "inline-flex rounded-full border border-border bg-muted/10 px-2.5 py-0.5 text-xs font-semibold text-muted"
                  }
                >
                  {schedule.is_active ? "Active" : "Inactive"}
                </span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatScheduleDate(schedule.next_run_at)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatScheduleDateTime(schedule.last_run_at)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {schedule.users?.full_name ?? "—"}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
