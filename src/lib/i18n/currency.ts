export type AppCurrency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

export const APP_CURRENCIES: readonly AppCurrency[] = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
] as const;

export const DEFAULT_CURRENCY: AppCurrency = "USD";

export const APP_CURRENCY_LABELS: Record<AppCurrency, string> = {
  USD: "US Dollar (USD)",
  EUR: "Euro (EUR)",
  GBP: "British Pound (GBP)",
  CAD: "Canadian Dollar (CAD)",
  AUD: "Australian Dollar (AUD)",
};

export function isAppCurrency(value: string | null | undefined): value is AppCurrency {
  return (
    value === "USD" ||
    value === "EUR" ||
    value === "GBP" ||
    value === "CAD" ||
    value === "AUD"
  );
}
