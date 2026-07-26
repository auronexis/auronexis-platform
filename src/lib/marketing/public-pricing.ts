import "server-only";

import { resolveRequestBillingCountry } from "@/lib/fastspring/country";
import {
  getPublicLocalizedPrices,
  type LocalizedPlanPrice,
} from "@/lib/fastspring/localized-pricing";
import { PUBLIC_PRICING_PLANS } from "@/lib/marketing/content";

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
  source: LocalizedPlanPrice["source"];
};

/**
 * Server-rendered public pricing cards with FastSpring localized amounts.
 * Falls back to base USD catalog amounts when the Price API is unavailable.
 */
export async function loadPublicPricingPlanViews(options?: {
  explicitCountry?: string | null;
}): Promise<{ country: string; plans: PublicPricingPlanView[] }> {
  const country = await resolveRequestBillingCountry({
    explicitCountry: options?.explicitCountry,
  });
  const localized = await getPublicLocalizedPrices({ country });
  const byPath = new Map(localized.map((row) => [row.productPath, row] as const));

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
      currency: price?.currency ?? "USD",
      country,
      source: price?.source ?? "base_usd_fallback",
    };
  });

  return { country, plans };
}
