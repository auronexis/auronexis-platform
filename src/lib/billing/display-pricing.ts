import "server-only";

import {
  listPublicCatalogEntries,
  type CanonicalPlanCatalogEntry,
} from "@/lib/billing/catalog";
import { formatWorkspaceMoney } from "@/lib/i18n/format";
import type { PlanKey } from "@/lib/billing/plans";

/**
 * Catalog-backed display prices for public and workspace plan surfaces.
 * Mollie is the sole active billing provider — amounts match catalog /
 * SUBSCRIPTION_PLANS (USD). No third-party Price API is consulted.
 */

export type CatalogDisplayPriceSource = "catalog_usd";

export type CatalogDisplayPlanPrice = {
  productPath: PlanKey;
  currency: "USD";
  amount: number;
  formattedAmount: string;
  interval: "month";
  source: CatalogDisplayPriceSource;
};

function toPlanKey(entry: CanonicalPlanCatalogEntry): PlanKey | null {
  return entry.planKey;
}

/** Public self-serve catalog prices formatted for UI (USD). */
export function getCatalogDisplayPrices(): CatalogDisplayPlanPrice[] {
  return listPublicCatalogEntries()
    .map((entry) => {
      const planKey = toPlanKey(entry);
      if (!planKey) return null;
      return {
        productPath: planKey,
        currency: "USD" as const,
        amount: entry.fallbackMonthlyUsd,
        formattedAmount: formatWorkspaceMoney(entry.fallbackMonthlyUsd, "USD", "en"),
        interval: "month" as const,
        source: "catalog_usd" as const,
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
