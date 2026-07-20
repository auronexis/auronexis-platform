import type { CustomerInvoiceView } from "@/lib/billing/types";
import type { AppCurrency } from "@/lib/i18n/currency";
import type { AppLocale } from "@/lib/i18n/types";
import { getInvoiceTranslations, type InvoiceTranslations } from "@/lib/i18n/invoice";
import { toIntlLocale } from "@/lib/i18n/resolve-locale";

/**
 * Format whole-unit workspace money (CRM, profitability, forecasts).
 * Uses organization currency — never hardcode currency symbols.
 */
export function formatWorkspaceMoney(
  amount: number,
  currency: AppCurrency,
  locale: AppLocale = "en",
): string {
  const zeroDecimal = currency === "JPY";
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: zeroDecimal ? 0 : undefined,
    maximumFractionDigits: zeroDecimal ? 0 : 0,
  }).format(amount);
}

/**
 * Format platform/Paddle invoice amounts in cents (charge currency from the transaction).
 * Distinct from workspace currency used for org business metrics.
 */
export function formatMoneyFromCentsLocale(
  amountCents: number,
  currency: string,
  locale: AppLocale,
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function formatBillingDateLocale(
  value: string | null | undefined,
  locale: AppLocale,
): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatBillingDateTimeLocale(
  value: string | null | undefined,
  locale: AppLocale,
): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getLocalizedInvoiceDisplayLabel(
  invoice: CustomerInvoiceView,
  locale: AppLocale,
): string {
  const translations = getInvoiceTranslations(locale);

  if (invoice.status === "open" && invoice.amountPaid === 0) {
    return translations.statusOpenUnpaid;
  }

  if (invoice.status === "paid") {
    return translations.statusPaid;
  }

  if (invoice.status === "open") {
    return translations.statusOpen;
  }

  if (invoice.status === "draft") {
    return invoice.isFuture ? translations.statusUpcoming : translations.statusDraft;
  }

  if (invoice.status === "uncollectible") {
    return translations.statusUncollectible;
  }

  if (invoice.status === "void") {
    return translations.statusVoid;
  }

  return invoice.statusLabel;
}

export function formatLocalizedInvoiceDueLabel(
  invoice: CustomerInvoiceView,
  locale: AppLocale,
): string {
  const translations = getInvoiceTranslations(locale);

  if (invoice.paidAt) {
    const formatted = formatBillingDateTimeLocale(invoice.paidAt, locale);
    return formatted ? `${translations.paidAt} ${formatted}` : translations.statusPaid;
  }

  if (invoice.dueAt) {
    const formatted = formatBillingDateLocale(invoice.dueAt, locale);
    return formatted ? `${translations.dueAt} ${formatted}` : invoice.statusLabel;
  }

  return invoice.statusLabel;
}

export function formatInvoicePeriodLabel(
  periodStart: string | null,
  periodEnd: string | null,
  locale: AppLocale,
): string | null {
  const start = formatBillingDateLocale(periodStart, locale);
  const end = formatBillingDateLocale(periodEnd, locale);
  return start && end ? `${start} – ${end}` : null;
}

export function formatShowingLatestMessage(
  translations: InvoiceTranslations,
  limit: number,
): string {
  return translations.showingLatest.replace("{limit}", String(limit));
}
