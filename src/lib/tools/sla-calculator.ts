/**
 * SLA / uptime arithmetic for the free calculator at /tools/sla-calculator.
 *
 * Pure functions only, so the server can render the reference table and the client widget can
 * reuse the same maths. Periods use the calendar average: a year is 365.25 days, a month is a
 * twelfth of that (30.44 days), a quarter a quarter of it. Allowed downtime is rounded DOWN to
 * the second, so the calculator never tells anyone they have more downtime than the SLA allows.
 */

const DAY_SECONDS = 24 * 60 * 60;
const YEAR_SECONDS = 365.25 * DAY_SECONDS;

export const SLA_PERIODS = [
  { id: "day", label: "Day", seconds: DAY_SECONDS },
  { id: "week", label: "Week", seconds: 7 * DAY_SECONDS },
  { id: "month", label: "Month", seconds: YEAR_SECONDS / 12 },
  { id: "quarter", label: "Quarter", seconds: YEAR_SECONDS / 4 },
  { id: "year", label: "Year", seconds: YEAR_SECONDS },
] as const;

export type SlaPeriodId = (typeof SLA_PERIODS)[number]["id"];

/** Common availability targets shown in the reference table. */
export const COMMON_SLA_LEVELS = [90, 95, 99, 99.5, 99.9, 99.95, 99.99, 99.999] as const;

export function periodSeconds(id: SlaPeriodId): number {
  const period = SLA_PERIODS.find((entry) => entry.id === id);
  if (!period) throw new Error(`Unknown period: ${id}`);
  return period.seconds;
}

export function isValidSlaPercent(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

/** Downtime the SLA allows in a period, in seconds (not rounded). */
export function allowedDowntimeSeconds(slaPercent: number, seconds: number): number {
  if (!isValidSlaPercent(slaPercent)) throw new RangeError("SLA must be between 0 and 100");
  if (!(seconds > 0)) throw new RangeError("Period must be longer than zero");
  return seconds * (1 - slaPercent / 100);
}

/** Uptime percentage achieved when a period had the given downtime. */
export function uptimeFromDowntime(downtimeSeconds: number, seconds: number): number {
  if (!(seconds > 0)) throw new RangeError("Period must be longer than zero");
  if (!Number.isFinite(downtimeSeconds) || downtimeSeconds < 0) {
    throw new RangeError("Downtime cannot be negative");
  }
  const clamped = Math.min(downtimeSeconds, seconds);
  return (1 - clamped / seconds) * 100;
}

/**
 * Availability of several services that ALL have to work (in series): multiply the
 * availabilities. Three services at 99.9% give about 99.7%.
 */
export function serialAvailability(percents: readonly number[]): number {
  if (percents.length === 0) throw new RangeError("Add at least one service");
  return percents.reduce((total, percent) => {
    if (!isValidSlaPercent(percent)) throw new RangeError("SLA must be between 0 and 100");
    return total * (percent / 100);
  }, 1) * 100;
}

/**
 * Availability of redundant services where ONE working copy is enough (in parallel):
 * 1 − the chance that all of them are down at the same time. Assumes independent failures.
 */
export function parallelAvailability(percents: readonly number[]): number {
  if (percents.length === 0) throw new RangeError("Add at least one service");
  const allDown = percents.reduce((total, percent) => {
    if (!isValidSlaPercent(percent)) throw new RangeError("SLA must be between 0 and 100");
    return total * (1 - percent / 100);
  }, 1);
  return (1 - allDown) * 100;
}

/**
 * "8h 45m 57s" style text. Under a minute keeps one decimal ("0.8s") because five-nines
 * targets allow less than a second per day. Longer durations show at most three units and are
 * truncated, never rounded up.
 */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "–";
  if (totalSeconds === 0) return "0s";
  // A tiny epsilon absorbs float noise (86400 × 0.1 = 8639.999…) before truncating.
  const EPSILON = 1e-6;
  if (totalSeconds < 60) {
    const tenths = Math.floor(totalSeconds * 10 + EPSILON) / 10;
    return `${Number.isInteger(tenths) ? tenths.toFixed(0) : tenths.toFixed(1)}s`;
  }

  let remaining = Math.floor(totalSeconds + EPSILON);
  const units: Array<[string, number]> = [
    ["d", DAY_SECONDS],
    ["h", 3600],
    ["m", 60],
    ["s", 1],
  ];
  const parts: string[] = [];
  for (const [suffix, size] of units) {
    const amount = Math.floor(remaining / size);
    remaining -= amount * size;
    if (amount > 0 || parts.length > 0) parts.push(`${amount}${suffix}`);
  }
  // Drop trailing zero units ("2d 0h 0m" → "2d") and keep the three largest.
  while (parts.length > 1 && /^0[a-z]$/.test(parts[parts.length - 1])) parts.pop();
  return parts.slice(0, 3).filter((part) => !/^0[a-z]$/.test(part)).join(" ");
}

/** Percent text without float noise: 99.9 → "99.9%", 99.70029... → "99.7003%". */
export function formatPercent(value: number, maxDecimals = 4): string {
  if (!Number.isFinite(value)) return "–";
  const factor = 10 ** maxDecimals;
  const truncated = Math.floor(value * factor) / factor;
  return `${Number(truncated.toFixed(maxDecimals))}%`;
}

export type DowntimeRow = {
  slaPercent: number;
  downtime: Record<SlaPeriodId, string>;
};

/** Allowed downtime for one SLA level in every period, formatted for display. */
export function downtimeRow(slaPercent: number): DowntimeRow {
  const downtime = Object.fromEntries(
    SLA_PERIODS.map((period) => [
      period.id,
      formatDuration(allowedDowntimeSeconds(slaPercent, period.seconds)),
    ]),
  ) as Record<SlaPeriodId, string>;
  return { slaPercent, downtime };
}

export const SLA_REFERENCE_TABLE: readonly DowntimeRow[] = COMMON_SLA_LEVELS.map(downtimeRow);
