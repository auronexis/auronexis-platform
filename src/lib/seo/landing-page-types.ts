import type { MarketingCtaPresetKey } from "@/lib/marketing/cta";

export type LandingPageLink = {
  label: string;
  href: string;
};

export type LandingPageBenefit = {
  title: string;
  description: string;
};

export type LandingPageFaqItem = {
  question: string;
  answer: string;
};

/** Shared content model for feature, audience, and industry landing pages. */
export type LandingPageContent = {
  slug: string;
  path: string;
  category: "feature" | "audience" | "industry" | "capability";
  eyebrow: string;
  title: string;
  description: string;
  metaDescription: string;
  problem: string;
  solution: string;
  businessValue: string;
  audience: string;
  enterpriseAdvantages: ReadonlyArray<string>;
  benefits: ReadonlyArray<LandingPageBenefit>;
  capabilities: ReadonlyArray<string>;
  challenges?: ReadonlyArray<string>;
  workflowImprovements?: ReadonlyArray<string>;
  expectedOutcomes?: ReadonlyArray<string>;
  faq: ReadonlyArray<LandingPageFaqItem>;
  relatedLinks: ReadonlyArray<LandingPageLink>;
  primaryCta?: MarketingCtaPresetKey;
  secondaryCta?: MarketingCtaPresetKey;
};

export type LandingHubEntry = {
  slug: string;
  path: string;
  title: string;
  description: string;
};
