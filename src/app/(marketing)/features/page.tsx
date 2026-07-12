import type { Metadata } from "next";
import { ConversionTracker } from "@/components/analytics/conversion-tracker";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { MarketingCtaSection } from "@/components/marketing/marketing-cta-section";
import { MarketingFeatureDetails } from "@/components/marketing/marketing-feature-details";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingSection } from "@/components/marketing/marketing-sections";
import { FEATURES } from "@/lib/marketing/content";
import { SOLUTION_ROUTES } from "@/lib/company/company-links";
import { createMarketingMetadata } from "@/lib/marketing/seo";
import Link from "next/link";

export const metadata: Metadata = createMarketingMetadata({
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
      <MarketingSection
        title="Related solutions"
        description="Explore solution pages aligned to common agency operating models."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <Link href={SOLUTION_ROUTES.customerHealthScore} className="text-sm font-medium text-primary hover:underline">
              Customer health score
            </Link>
          </li>
          <li>
            <Link href={SOLUTION_ROUTES.riskManagement} className="text-sm font-medium text-primary hover:underline">
              Risk management
            </Link>
          </li>
          <li>
            <Link href={SOLUTION_ROUTES.incidentManagement} className="text-sm font-medium text-primary hover:underline">
              Incident management
            </Link>
          </li>
          <li>
            <Link href={SOLUTION_ROUTES.aiReporting} className="text-sm font-medium text-primary hover:underline">
              AI reporting
            </Link>
          </li>
        </ul>
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
