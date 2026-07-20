import {
  DEFAULT_CURRENCY,
  isAppCurrency,
  type AppCurrency,
} from "@/lib/i18n/currency";
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_MEASUREMENT_SYSTEM,
  DEFAULT_TIME_FORMAT,
  DEFAULT_TIMEZONE,
  DEFAULT_WEEK_START,
  isMeasurementSystem,
  isOrganizationDateFormat,
  isOrganizationTimeFormat,
  isWeekStart,
  type OrganizationRegionalSettings,
} from "@/lib/i18n/regional";
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/lib/i18n/types";
import type { DateFormatPreference, TimeFormatPreference } from "@/lib/profile/preferences";

export type ResolveLocaleInput = {
  organizationLanguage?: string | null;
  customerLanguage?: string | null;
  browserLanguage?: string | null;
};

export type OrganizationRegionalSource = {
  language?: string | null;
  timezone?: string | null;
  date_format?: string | null;
  time_format?: string | null;
  week_start?: string | null;
  measurement_system?: string | null;
};

/**
 * Read the persisted organization language for settings UI.
 * Never applies browser or customer fallbacks — only the stored DB value.
 */
export function getStoredOrganizationLanguage(organization: {
  language?: string | null;
}): AppLocale {
  if (isAppLocale(organization.language)) {
    return organization.language;
  }
  return DEFAULT_LOCALE;
}

/**
 * Read the persisted organization workspace currency for settings UI and money formatting.
 * Never derives currency from locale — only the stored DB value.
 */
export function getStoredOrganizationCurrency(organization: {
  currency?: string | null;
}): AppCurrency {
  if (isAppCurrency(organization.currency)) {
    return organization.currency;
  }
  return DEFAULT_CURRENCY;
}

/** Resolve organization regional display settings with safe defaults. */
export function getStoredOrganizationRegionalSettings(
  organization: OrganizationRegionalSource,
): OrganizationRegionalSettings {
  return {
    language: getStoredOrganizationLanguage(organization),
    timezone: organization.timezone?.trim() || DEFAULT_TIMEZONE,
    dateFormat: isOrganizationDateFormat(organization.date_format)
      ? organization.date_format
      : DEFAULT_DATE_FORMAT,
    timeFormat: isOrganizationTimeFormat(organization.time_format)
      ? organization.time_format
      : DEFAULT_TIME_FORMAT,
    weekStart: isWeekStart(organization.week_start) ? organization.week_start : DEFAULT_WEEK_START,
    measurementSystem: isMeasurementSystem(organization.measurement_system)
      ? organization.measurement_system
      : DEFAULT_MEASUREMENT_SYSTEM,
  };
}

/**
 * Merge org regional settings with optional user display overrides.
 * User prefs may override timezone / date / time display only.
 */
export function resolveDisplayRegionalSettings(
  organization: OrganizationRegionalSource,
  userOverride?: {
    timezone?: string;
    dateFormat?: DateFormatPreference;
    timeFormat?: TimeFormatPreference;
    language?: string;
  } | null,
): OrganizationRegionalSettings {
  const base = getStoredOrganizationRegionalSettings(organization);

  if (!userOverride) {
    return base;
  }

  return {
    ...base,
    language: isAppLocale(userOverride.language) ? userOverride.language : base.language,
    timezone: userOverride.timezone?.trim() || base.timezone,
    dateFormat: isOrganizationDateFormat(userOverride.dateFormat)
      ? userOverride.dateFormat
      : base.dateFormat,
    timeFormat: isOrganizationTimeFormat(userOverride.timeFormat)
      ? userOverride.timeFormat
      : base.timeFormat,
  };
}

/**
 * Resolve the active locale.
 * Priority: organization → customer (future) → browser → English fallback.
 */
export function resolveLocale(input: ResolveLocaleInput): AppLocale {
  if (isAppLocale(input.organizationLanguage)) {
    return input.organizationLanguage;
  }

  if (isAppLocale(input.customerLanguage)) {
    return input.customerLanguage;
  }

  const browser = input.browserLanguage?.trim().toLowerCase() ?? "";
  if (browser.startsWith("de")) {
    return "de";
  }
  if (browser.startsWith("en")) {
    return "en";
  }

  return "en";
}

export function resolveLocaleFromOrganization(organization: {
  language?: string | null;
}): AppLocale {
  return resolveLocale({ organizationLanguage: organization.language });
}

export function toIntlLocale(locale: AppLocale): string {
  return locale === "de" ? "de-DE" : "en-US";
}
