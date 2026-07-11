import type { Metadata } from "next";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFeatureDetails } from "@/components/marketing/marketing-feature-details";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
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
        description="Reporting, automation, risk management, integrations, and executive intelligence in one workspace."
        primaryHref="/signup"
        primaryLabel="Create workspace"
        secondaryHref="/pricing"
        secondaryLabel="See pricing"
      />
      <MarketingSection
        title="Platform capabilities"
        description="Each capability maps to a business problem, workflow, and measurable outcome for multi-client delivery teams."
      >
        <MarketingFeatureDetails features={FEATURES} />
      </MarketingSection>
      <MarketingCtaSection
        title="Start with a workspace built for agency operations"
        description="Create your organization, onboard your team, and connect your first clients."
        primaryPreset="startFreeTrial"
        secondaryPreset="bookDemo"
      />
    </MarketingShell>
  );
}
