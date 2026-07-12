export type AppLocale = "de" | "en";

export const APP_LOCALES: readonly AppLocale[] = ["de", "en"] as const;

export const DEFAULT_LOCALE: AppLocale = "de";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "de" || value === "en";
}
