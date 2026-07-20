import type { AppLocale } from "@/lib/i18n/types";
import { toIntlLocale } from "@/lib/i18n/resolve-locale";

export type FormatNumberOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  style?: "decimal" | "percent";
};

/** Locale-aware number formatting for dashboards, tables, and usage metrics. */
export function formatAppNumber(
  value: number,
  locale: AppLocale = "en",
  options: FormatNumberOptions = {},
): string {
  const {
    minimumFractionDigits,
    maximumFractionDigits = 0,
    style = "decimal",
  } = options;

  return new Intl.NumberFormat(toIntlLocale(locale), {
    style,
    minimumFractionDigits,
    maximumFractionDigits: style === "percent" ? (maximumFractionDigits ?? 1) : maximumFractionDigits,
  }).format(style === "percent" ? value / 100 : value);
}

/** Format a percentage value already expressed as 0–100 (e.g. margin 42.5 → "42.5%"). */
export function formatAppPercent(
  value: number | null | undefined,
  locale: AppLocale = "en",
  fractionDigits = 1,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value / 100);
}

/** Compact notation for large counts (e.g. 1200 → "1.2K" in en). */
export function formatAppCompactNumber(value: number, locale: AppLocale = "en"): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
