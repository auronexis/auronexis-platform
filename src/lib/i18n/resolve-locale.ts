import {
  DEFAULT_CURRENCY,
  isAppCurrency,
  type AppCurrency,
} from "@/lib/i18n/currency";
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@/lib/i18n/types";

export type ResolveLocaleInput = {
  organizationLanguage?: string | null;
  customerLanguage?: string | null;
  browserLanguage?: string | null;
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
