import type { Metadata } from "next";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import {
  MarketingCardGrid,
  MarketingSection,
} from "@/components/marketing/marketing-sections";
import { FEATURES } from "@/lib/marketing/content";
import { createMarketingMetadata } from "@/lib/marketing/seo";

export const metadata: Metadata = createMarketingMetadata({
  title: "Features",
  description: "Explore Auroranexis platform features for agency operations.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <ConversionTracker event="cta_clicked" props={{ surface: "features" }} />
      <MarketingHero
        eyebrow="Features"
        title="Everything your operations team needs"
        description="Reporting, automation, risk management, integrations, and predictive intelligence in one workspace."
        primaryHref="/signup"
        primaryLabel="Start free trial"
        secondaryHref="/documentation"
        secondaryLabel="Documentation"
      />
      <MarketingSection title="Platform capabilities">
        <MarketingCardGrid items={FEATURES} />
      </MarketingSection>
    </MarketingShell>
  );
}
