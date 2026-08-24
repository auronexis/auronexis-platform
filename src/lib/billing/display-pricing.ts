import "server-only";

import {
  listPublicCatalogEntries,
  type CanonicalPlanCatalogEntry,
} from "@/lib/billing/catalog";
import { formatWorkspaceMoney } from "@/lib/i18n/format";
import type { PlanKey } from "@/lib/billing/plans";
import type { CatalogBillingCurrency } from "@/lib/billing/price-catalog";

/**
 * Catalog-backed display prices for public and workspace plan surfaces.
 * Mollie is the sole active billing provider — amounts match catalog /
 * SUBSCRIPTION_PLANS (EUR). No third-party Price API is consulted.
 */

export type CatalogDisplayPriceSource = "catalog_eur";

export type CatalogDisplayPlanPrice = {
  productPath: PlanKey;
  currency: CatalogBillingCurrency;
  amount: number;
  amountMinor: number;
  formattedAmount: string;
  interval: "month";
  source: CatalogDisplayPriceSource;
};

function toPlanKey(entry: CanonicalPlanCatalogEntry): PlanKey | null {
  return entry.planKey;
}

/** Public self-serve catalog prices formatted for UI (EUR). */
export function getCatalogDisplayPrices(): CatalogDisplayPlanPrice[] {
  return listPublicCatalogEntries()
    .map((entry) => {
      const planKey = toPlanKey(entry);
      if (!planKey) return null;
      const amount = Math.trunc(entry.amountMinor / 100);
      return {
        productPath: planKey,
        currency: entry.currency,
        amount,
        amountMinor: entry.amountMinor,
        formattedAmount: formatWorkspaceMoney(amount, entry.currency, "en"),
        interval: "month" as const,
        source: "catalog_eur" as const,
      };
    })
    .filter((row): row is CatalogDisplayPlanPrice => row !== null);
}

/** Map of plan key → formatted display string for PricingGrid. */
export function getCatalogDisplayPriceMap(): Partial<Record<PlanKey, string>> {
  return Object.fromEntries(
    getCatalogDisplayPrices().map((price) => [price.productPath, price.formattedAmount]),
  ) as Partial<Record<PlanKey, string>>;
}
