import "server-only";

import { getCatalogDisplayPrices, type CatalogDisplayPlanPrice } from "@/lib/billing/display-pricing";
import { PUBLIC_PRICING_PLANS } from "@/lib/marketing/content";
import { PRIMARY_BILLING_CURRENCY } from "@/lib/billing/price-catalog";

export type PublicPricingPlanView = {
  name: string;
  productPath: "professional" | "business" | "enterprise";
  price: string;
  period: string;
  description: string;
  highlights: readonly string[];
  featured: boolean;
  currency: string;
  country: string;
  source: CatalogDisplayPlanPrice["source"];
};

/**
 * Server-rendered public pricing cards from the canonical EUR catalog.
 * Mollie is the sole active billing provider — catalog display prices only.
 */
export async function loadPublicPricingPlanViews(_options?: {
  explicitCountry?: string | null;
}): Promise<{ country: string; plans: PublicPricingPlanView[] }> {
  const catalog = getCatalogDisplayPrices();
  const byPath = new Map(catalog.map((row) => [row.productPath, row] as const));

  const plans: PublicPricingPlanView[] = PUBLIC_PRICING_PLANS.map((plan) => {
    const price = byPath.get(plan.productPath);
    return {
      name: plan.name,
      productPath: plan.productPath,
      price: price?.formattedAmount ?? plan.price,
      period: plan.period,
      description: plan.description,
      highlights: plan.highlights,
      featured: plan.featured,
      currency: price?.currency ?? PRIMARY_BILLING_CURRENCY,
      country: "DE",
      source: price?.source ?? "catalog_eur",
    };
  });

  return { country: "DE", plans };
}
