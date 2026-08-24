/**
 * Billing vs display currency model.
 *
 * - Display currency: organization/workspace preference for CRM/UI formatting.
 * - Billing currency: persisted on the subscription commercial row; drives Mollie charges.
 * Never silently FX-convert historical transaction amounts.
 */

import type { AppCurrency } from "@/lib/i18n/currency";
import {
  PRIMARY_BILLING_CURRENCY,
  type CatalogBillingCurrency,
} from "@/lib/billing/price-catalog";

export const BILLING_CURRENCY_CODES = ["EUR", "USD", "GBP", "CHF"] as const satisfies readonly CatalogBillingCurrency[];

export type BillingCurrency = CatalogBillingCurrency;

export const DEFAULT_BILLING_CURRENCY: BillingCurrency = PRIMARY_BILLING_CURRENCY;

/** Normalize Mollie/API currency strings without inventing a different currency. */
export function normalizeBillingCurrency(
  value: string | null | undefined,
): BillingCurrency | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  return (BILLING_CURRENCY_CODES as readonly string[]).includes(upper)
    ? (upper as BillingCurrency)
    : null;
}

/**
 * Resolve currency for persisting a new Mollie transaction.
 * Prefer the payment's currency; never default a missing USD payment to EUR.
 */
export function resolveTransactionCurrency(input: {
  paymentCurrency: string | null | undefined;
  subscriptionBillingCurrency?: string | null | undefined;
  catalogCurrency?: BillingCurrency;
}): string {
  const fromPayment = normalizeBillingCurrency(input.paymentCurrency);
  if (fromPayment) return fromPayment.toLowerCase();

  const fromSub = normalizeBillingCurrency(input.subscriptionBillingCurrency ?? null);
  if (fromSub) return fromSub.toLowerCase();

  if (input.catalogCurrency) return input.catalogCurrency.toLowerCase();

  throw new Error("Missing payment currency — refusing silent EUR default");
}

/** Display currency may differ from billing currency; billing always wins for charges. */
export function resolveChargeCurrency(input: {
  subscriptionBillingCurrency: string | null | undefined;
  catalogCurrency: BillingCurrency;
}): BillingCurrency {
  return normalizeBillingCurrency(input.subscriptionBillingCurrency) ?? input.catalogCurrency;
}

export function isDisplayCurrency(value: string | null | undefined): value is AppCurrency {
  return Boolean(value && value.length === 3);
}
