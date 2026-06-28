import type { ReportScheduleFrequency } from "@/types/database";

export type ReportingPeriod = {
  start: string;
  end: string;
};

function toDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Previous calendar month relative to reference date. */
export function getPreviousMonthlyPeriod(referenceDate = new Date()): ReportingPeriod {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const start = new Date(Date.UTC(prevYear, prevMonth, 1));
  const end = new Date(Date.UTC(prevYear, prevMonth + 1, 0));

  return { start: toDateString(start), end: toDateString(end) };
}

/** Previous calendar quarter relative to reference date. */
export function getPreviousQuarterPeriod(referenceDate = new Date()): ReportingPeriod {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const currentQuarter = Math.floor(month / 3);
  let prevQuarter = currentQuarter - 1;
  let prevYear = year;

  if (prevQuarter < 0) {
    prevQuarter = 3;
    prevYear = year - 1;
  }

  const startMonth = prevQuarter * 3;
  const start = new Date(Date.UTC(prevYear, startMonth, 1));
  const end = new Date(Date.UTC(prevYear, startMonth + 3, 0));

  return { start: toDateString(start), end: toDateString(end) };
}

export function getReportingPeriodForFrequency(
  frequency: ReportScheduleFrequency,
  referenceDate = new Date(),
): ReportingPeriod {
  return frequency === "quarterly"
    ? getPreviousQuarterPeriod(referenceDate)
    : getPreviousMonthlyPeriod(referenceDate);
}

/** Calculate the next scheduled run date after a reference point. */
export function calculateNextRunAt(
  frequency: ReportScheduleFrequency,
  dayOfMonth: number | null,
  fromDate = new Date(),
): string {
  if (frequency === "monthly" && dayOfMonth) {
    const year = fromDate.getUTCFullYear();
    const month = fromDate.getUTCMonth();
    let candidate = new Date(Date.UTC(year, month, dayOfMonth));

    if (candidate.getTime() <= fromDate.getTime()) {
      candidate = new Date(Date.UTC(year, month + 1, dayOfMonth));
    }

    return toDateString(candidate);
  }

  const year = fromDate.getUTCFullYear();
  const month = fromDate.getUTCMonth();
  const nextQuarterStartMonth = (Math.floor(month / 3) + 1) * 3;

  if (nextQuarterStartMonth > 11) {
    return toDateString(new Date(Date.UTC(year + 1, 0, 1)));
  }

  return toDateString(new Date(Date.UTC(year, nextQuarterStartMonth, 1)));
}
