import { isAppLocale, type AppLocale } from "@/lib/i18n/types";

export type ResolveLocaleInput = {
  organizationLanguage?: string | null;
  customerLanguage?: string | null;
  browserLanguage?: string | null;
};

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
