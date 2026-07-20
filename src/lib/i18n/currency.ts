/**
 * Supported workspace currencies — configuration source of truth.
 * Adding a currency requires updating this list and the DB check constraint migration only.
 */
export type AppCurrency =
  | "USD"
  | "EUR"
  | "GBP"
  | "CAD"
  | "AUD"
  | "CHF"
  | "JPY"
  | "NOK"
  | "SEK"
  | "DKK"
  | "PLN"
  | "CZK"
  | "RON";

export const APP_CURRENCIES: readonly AppCurrency[] = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "CHF",
  "JPY",
  "NOK",
  "SEK",
  "DKK",
  "PLN",
  "CZK",
  "RON",
] as const;

export const DEFAULT_CURRENCY: AppCurrency = "USD";

export const APP_CURRENCY_LABELS: Record<AppCurrency, string> = {
  USD: "US Dollar (USD)",
  EUR: "Euro (EUR)",
  GBP: "British Pound (GBP)",
  CAD: "Canadian Dollar (CAD)",
  AUD: "Australian Dollar (AUD)",
  CHF: "Swiss Franc (CHF)",
  JPY: "Japanese Yen (JPY)",
  NOK: "Norwegian Krone (NOK)",
  SEK: "Swedish Krona (SEK)",
  DKK: "Danish Krone (DKK)",
  PLN: "Polish Zloty (PLN)",
  CZK: "Czech Koruna (CZK)",
  RON: "Romanian Leu (RON)",
};

const CURRENCY_SET = new Set<string>(APP_CURRENCIES);

export function isAppCurrency(value: string | null | undefined): value is AppCurrency {
  return Boolean(value && CURRENCY_SET.has(value));
}
