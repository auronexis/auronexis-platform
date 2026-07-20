import type { AppLocale } from "@/lib/i18n/types";
import type { DateFormatPreference, TimeFormatPreference } from "@/lib/profile/preferences";

export type WeekStart = "monday" | "sunday";
export type MeasurementSystem = "metric" | "imperial";
export type OrganizationDateFormat = DateFormatPreference;
export type OrganizationTimeFormat = TimeFormatPreference;

export type OrganizationRegionalSettings = {
  language: AppLocale;
  timezone: string;
  dateFormat: OrganizationDateFormat;
  timeFormat: OrganizationTimeFormat;
  weekStart: WeekStart;
  measurementSystem: MeasurementSystem;
};

export const DEFAULT_TIMEZONE = "UTC";
export const DEFAULT_DATE_FORMAT: OrganizationDateFormat = "DD/MM/YYYY";
export const DEFAULT_TIME_FORMAT: OrganizationTimeFormat = "24h";
export const DEFAULT_WEEK_START: WeekStart = "monday";
export const DEFAULT_MEASUREMENT_SYSTEM: MeasurementSystem = "metric";

export const ORGANIZATION_TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Bucharest",
  "Europe/Zurich",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export const WEEK_START_OPTIONS: { value: WeekStart; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
];

export const MEASUREMENT_SYSTEM_OPTIONS: { value: MeasurementSystem; label: string }[] = [
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

export function isWeekStart(value: string | null | undefined): value is WeekStart {
  return value === "monday" || value === "sunday";
}

export function isMeasurementSystem(value: string | null | undefined): value is MeasurementSystem {
  return value === "metric" || value === "imperial";
}

export function isOrganizationDateFormat(
  value: string | null | undefined,
): value is OrganizationDateFormat {
  return value === "DD/MM/YYYY" || value === "MM/DD/YYYY" || value === "YYYY-MM-DD";
}

export function isOrganizationTimeFormat(
  value: string | null | undefined,
): value is OrganizationTimeFormat {
  return value === "12h" || value === "24h";
}
