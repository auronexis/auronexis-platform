/**
 * Versioned commercial price catalog — Auroranexis seller, Mollie PSP.
 *
 * Canonical amounts are integer minor units. Active production currency is EUR.
 * Multi-currency keys (USD/GBP/CHF) are scaffolded; production prices are not invented.
 * Historical transaction currency must never be reinterpreted (no silent FX).
 */

import type { PlanKey } from "@/lib/billing/plans";

/** Currencies supported by the billing architecture (not all have production prices). */
export type CatalogBillingCurrency = "EUR" | "USD" | "GBP" | "CHF";

/** Active self-serve / list billing currency. */
export const PRIMARY_BILLING_CURRENCY: CatalogBillingCurrency = "EUR";

/** Active catalog price version for EUR list prices. */
export const ACTIVE_EUR_PRICE_VERSION = "eur-v1-2026-08" as const;

export type PriceCatalogEntry = {
  planKey: Extract<PlanKey, "professional" | "business" | "enterprise">;
  currency: CatalogBillingCurrency;
  /** Gross customer catalog total in minor units (VAT-inclusive where tax model permits). */
  amountMinor: number;
  priceVersion: string;
  /** Inclusive ISO date (UTC calendar day). */
  activeFrom: string;
  /** Exclusive upper bound; null = open-ended. */
  activeUntil: string | null;
};

/**
 * Authoritative EUR list prices (minor units).
 * Professional €179, Business €599, Enterprise €1,799.
 */
export const EUR_PRICE_CATALOG: readonly PriceCatalogEntry[] = [
  {
    planKey: "professional",
    currency: "EUR",
    amountMinor: 17_900,
    priceVersion: ACTIVE_EUR_PRICE_VERSION,
    activeFrom: "2026-08-24",
    activeUntil: null,
  },
  {
    planKey: "business",
    currency: "EUR",
    amountMinor: 59_900,
    priceVersion: ACTIVE_EUR_PRICE_VERSION,
    activeFrom: "2026-08-24",
    activeUntil: null,
  },
  {
    planKey: "enterprise",
    currency: "EUR",
    amountMinor: 179_900,
    priceVersion: ACTIVE_EUR_PRICE_VERSION,
    activeFrom: "2026-08-24",
    activeUntil: null,
  },
] as const;

/** Future currency slots — empty until operators publish approved list prices. */
export const FUTURE_CURRENCY_PRICE_SLOTS: Readonly<
  Record<Exclude<CatalogBillingCurrency, "EUR">, readonly PriceCatalogEntry[]>
> = {
  USD: [],
  GBP: [],
  CHF: [],
};

function isActiveOn(entry: PriceCatalogEntry, onIsoDate: string): boolean {
  if (entry.activeFrom > onIsoDate) return false;
  if (entry.activeUntil !== null && entry.activeUntil <= onIsoDate) return false;
  return true;
}

export function listActiveEurCatalog(onIsoDate = new Date().toISOString().slice(0, 10)): PriceCatalogEntry[] {
  return EUR_PRICE_CATALOG.filter((e) => isActiveOn(e, onIsoDate));
}

export function getActiveCatalogPrice(input: {
  planKey: PlanKey | string;
  currency?: CatalogBillingCurrency;
  onIsoDate?: string;
}): PriceCatalogEntry | null {
  const currency = input.currency ?? PRIMARY_BILLING_CURRENCY;
  const onIsoDate = input.onIsoDate ?? new Date().toISOString().slice(0, 10);

  if (currency !== "EUR") {
    const slot = FUTURE_CURRENCY_PRICE_SLOTS[currency as Exclude<CatalogBillingCurrency, "EUR">];
    return slot.find((e) => e.planKey === input.planKey && isActiveOn(e, onIsoDate)) ?? null;
  }

  return (
    EUR_PRICE_CATALOG.find(
      (e) => e.planKey === input.planKey && isActiveOn(e, onIsoDate),
    ) ?? null
  );
}

/** Major units derived from minor units (integer division for whole-currency catalog). */
export function amountMinorToMajorUnits(amountMinor: number): number {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error("amountMinor must be a non-negative integer");
  }
  return Math.trunc(amountMinor / 100);
}

/** Mollie amount.value string from minor units (no floating money math beyond fixed 2dp). */
export function formatMinorUnitsForMollie(amountMinor: number): string {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error("amountMinor must be a non-negative integer");
  }
  const major = Math.trunc(amountMinor / 100);
  const cents = Math.abs(amountMinor % 100);
  return `${major}.${cents.toString().padStart(2, "0")}`;
}

export function assertPriceConsistency(input: {
  catalogAmountMinor: number;
  checkoutAmountMinor: number;
  chargedAmountMinor: number;
  invoiceGrossMinor: number;
}): boolean {
  const { catalogAmountMinor, checkoutAmountMinor, chargedAmountMinor, invoiceGrossMinor } = input;
  return (
    catalogAmountMinor === checkoutAmountMinor &&
    checkoutAmountMinor === chargedAmountMinor &&
    chargedAmountMinor === invoiceGrossMinor
  );
}
