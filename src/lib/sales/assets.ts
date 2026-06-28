import {
  FOUNDING_CUSTOMER_DISCOUNT_PERCENT,
  FOUNDING_CUSTOMER_LIMIT,
  FOUNDING_CUSTOMER_OFFER,
} from "@/lib/sales/founding-program";

export const SALES_ASSETS = {
  proposalTemplate: {
    title: "Commercial Proposal Template",
    slug: "proposal-template",
    description: "Standard Auroranexis proposal structure for qualified agencies.",
    sections: [
      "Executive summary",
      "Current state & pain points",
      "Proposed solution",
      "Implementation timeline",
      "Pricing & pilot terms",
      "Next steps",
    ],
  },
  pilotAgreement: {
    title: "Pilot Agreement Template",
    slug: "pilot-agreement",
    description: "6-week founding customer pilot agreement outline.",
    sections: [
      "Pilot duration & scope",
      "Beta pricing (50%)",
      "Success criteria",
      "Data processing",
      "Support & onboarding",
      "Conversion to paid plan",
    ],
  },
  pricingPdf: {
    title: "Pricing Overview PDF",
    slug: "pricing-pdf",
    description: "Public pricing tiers with pilot discount callout.",
    href: "/pricing",
  },
  foundingCustomerOffer: {
    title: "Founding Customer Offer",
    slug: "founding-customer-offer",
    description: FOUNDING_CUSTOMER_OFFER.summary,
    limit: FOUNDING_CUSTOMER_LIMIT,
    discountPercent: FOUNDING_CUSTOMER_DISCOUNT_PERCENT,
    benefits: FOUNDING_CUSTOMER_OFFER.benefits,
  },
  roiCalculator: {
    title: "ROI Calculator Worksheet",
    slug: "roi-calculator",
    description: "Agency ROI model — hours saved, risk reduction, client retention uplift.",
    inputs: [
      "Managed clients",
      "Hours per client per month",
      "Blended hourly rate",
      "Churn reduction target",
    ],
  },
  caseStudyTemplate: {
    title: "Case Study Template",
    slug: "case-study-template",
    description: "Founding customer success story outline for marketing.",
    sections: [
      "Customer profile",
      "Challenge",
      "Solution",
      "Results (quantified)",
      "Quote",
    ],
  },
} as const;

export type SalesAssetKey = keyof typeof SALES_ASSETS;

export function listSalesAssets() {
  return Object.entries(SALES_ASSETS).map(([key, asset]) => ({
    key: key as SalesAssetKey,
    ...asset,
  }));
}
