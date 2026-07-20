import type { AppLocale } from "@/lib/i18n/types";
import { toIntlLocale } from "@/lib/i18n/resolve-locale";
import type { OrganizationDateFormat, OrganizationTimeFormat } from "@/lib/i18n/regional";
import { DEFAULT_TIMEZONE } from "@/lib/i18n/regional";

export type FormatDateOptions = {
  locale?: AppLocale;
  timeZone?: string;
  dateFormat?: OrganizationDateFormat;
  timeFormat?: OrganizationTimeFormat;
};

function resolveTimeZone(timeZone?: string): string | undefined {
  const zone = timeZone?.trim();
  if (!zone || zone === DEFAULT_TIMEZONE) {
    return zone || undefined;
  }
  return zone;
}

function hourCycle(timeFormat?: OrganizationTimeFormat): "h12" | "h23" | undefined {
  if (timeFormat === "12h") return "h12";
  if (timeFormat === "24h") return "h23";
  return undefined;
}

/**
 * Pattern-aware date parts using Intl (timezone-safe).
 * Falls back to locale short date when no explicit pattern is requested.
 */
function formatWithPattern(
  date: Date,
  locale: AppLocale,
  timeZone: string | undefined,
  dateFormat: OrganizationDateFormat | undefined,
): string {
  const intlLocale = toIntlLocale(locale);
  const options: Intl.DateTimeFormatOptions = { timeZone };

  if (!dateFormat) {
    return new Intl.DateTimeFormat(intlLocale, {
      ...options,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  const parts = new Intl.DateTimeFormat(intlLocale, {
    ...options,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  const year = lookup.year ?? "";
  const month = lookup.month ?? "";
  const day = lookup.day ?? "";

  if (dateFormat === "MM/DD/YYYY") return `${month}/${day}/${year}`;
  if (dateFormat === "YYYY-MM-DD") return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
}

/**
 * Canonical short date formatter for workspace surfaces.
 * Defaults to English to preserve existing display contracts; pass org locale when available.
 */
export function formatAppDate(
  value: string | null | undefined,
  localeOrOptions: AppLocale | FormatDateOptions = "en",
): string {
  if (!value) {
    return "—";
  }

  const options: FormatDateOptions =
    typeof localeOrOptions === "string" ? { locale: localeOrOptions } : localeOrOptions;
  const locale = options.locale ?? "en";
  const date = new Date(value);

  return formatWithPattern(date, locale, resolveTimeZone(options.timeZone), options.dateFormat);
}

/**
 * Canonical date-time formatter for workspace surfaces.
 */
export function formatAppDateTime(
  value: string | null | undefined,
  localeOrOptions: AppLocale | FormatDateOptions = "en",
): string {
  if (!value) {
    return "—";
  }

  const options: FormatDateOptions =
    typeof localeOrOptions === "string" ? { locale: localeOrOptions } : localeOrOptions;
  const locale = options.locale ?? "en";
  const date = new Date(value);
  const datePart = formatWithPattern(date, locale, resolveTimeZone(options.timeZone), options.dateFormat);

  const timePart = new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: resolveTimeZone(options.timeZone),
    hourCycle: hourCycle(options.timeFormat),
  }).format(date);

  return `${datePart}, ${timePart}`;
}

/** Date formatter that returns null for missing values (billing overview labels). */
export function formatAppDateOrNull(
  value: string | null | undefined,
  localeOrOptions: AppLocale | FormatDateOptions = "en",
): string | null {
  if (!value) {
    return null;
  }

  return formatAppDate(value, localeOrOptions);
}

/** Date-time formatter that returns null for missing values. */
export function formatAppDateTimeOrNull(
  value: string | null | undefined,
  localeOrOptions: AppLocale | FormatDateOptions = "en",
): string | null {
  if (!value) {
    return null;
  }

  return formatAppDateTime(value, localeOrOptions);
}

/**
 * Compact date-time without year (AI / monitoring timestamps).
 * Preserves the historical display contract used on those surfaces.
 */
export function formatAppDateTimeCompact(
  value: string | null | undefined,
  localeOrOptions: AppLocale | FormatDateOptions = "en",
): string {
  if (!value) {
    return "—";
  }

  const options: FormatDateOptions =
    typeof localeOrOptions === "string" ? { locale: localeOrOptions } : localeOrOptions;
  const locale = options.locale ?? "en";

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: resolveTimeZone(options.timeZone),
    hourCycle: hourCycle(options.timeFormat),
  }).format(new Date(value));
}

/** Month + year label for period comparisons. */
export function formatAppMonthYear(
  value: string | Date,
  locale: AppLocale = "en",
  timeZone?: string,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    year: "numeric",
    timeZone: resolveTimeZone(timeZone),
  }).format(date);
}

/** Weekday + short date for audit timelines. */
export function formatAppWeekdayDate(
  value: string | null | undefined,
  locale: AppLocale = "en",
  timeZone?: string,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: "short",
    timeZone: resolveTimeZone(timeZone),
  }).format(date);

  return `${weekday}, ${formatAppDate(value, { locale, timeZone })}`;
}
